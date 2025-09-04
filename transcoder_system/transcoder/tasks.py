from celery import shared_task
from .models import TranscodingJob, Channel
from django.utils import timezone
import subprocess
import os,signal,re,time,threading,logging

def watchdog(process,job,logger):
    """kill ffmpeg if no log appears for certain time"""
    time.sleep(15)
    job.refresh_from_db()
    if job.status == 'pending':
        logger.warning("No logs after timeout. Killing process")
        try:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                logger.warning("ffmpeg didnot exit after SIGTERM, forcing kill")
                process.kill()
                process.wait()
        except Exception as e:
            logger.error("error while killing stuck ffmpeg, check from server")
        job.status = 'error'
        job.save()

def stream_logs(
    process,
    log_file_path,
    job,
    ffmpeg_command=None,
    retry_count=0,
    max_retries=5
):
    logger = logging.getLogger(f"ffmpeg_logger_{job.id}")
    logger.setLevel(logging.INFO)
    logger.propagate = False  # prevent logs leaking to celery console

    handler = logging.FileHandler(log_file_path, mode='a')
    formatter = logging.Formatter('%(asctime)s - %(message)s')
    handler.setFormatter(formatter)

    if not any(isinstance(h, logging.FileHandler) and h.baseFilename == handler.baseFilename for h in logger.handlers):
        logger.addHandler(handler)
	
    # Log the command at the start
    if ffmpeg_command:
        logger.info(f"=== Starting new FFmpeg job ===")
        logger.info(f"Command: {' '.join(ffmpeg_command)}")

    log_found = False
    start_time = time.time()
    timeout = 10

    # Starting watchdogs
    threading.Thread(target=watchdog, args=(process,job,logger), daemon=True).start()

    try:
        for line in process.stdout:
            line = line.strip()
            logger.info(line)

            # Live status check
            if not log_found and 'frame=' in line and 'fps=' in line and 'bitrate=' in line:
                log_found = True
                job.status = 'running'
                job.save()

            # Timeout if no log within expected period
            if not log_found and time.time() - start_time > timeout:
                logger.warning("No valid FFmpeg log found in time window. Terminating.")
                try:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        logger.warning("FFMpeg did not exit after SIGTERM, forcing kill.")
                        process.kill()
                        process.wait()
                except Exception as kill_err:
                    logger.error(f"Error while terminating FFmpeg: {kill_err}")
                job.status = 'error'
                job.save()
                return

            # Check file size and truncate
            if os.path.exists(log_file_path) and os.path.getsize(log_file_path) >= 10 * 1024 * 1024:
                handler.flush()
                handler.close()
                logger.removeHandler(handler)
                with open(log_file_path, 'w'):
                    pass  # Truncate the file
                handler = logging.FileHandler(log_file_path, mode='a')
                handler.setFormatter(formatter)
                logger.addHandler(handler)

        process.wait()
        logger.info(f"--- FFmpeg exited with return code {process.returncode} ---")

    finally:
        handler.close()
        logger.removeHandler(handler)


    # --- Retry logic after process ends ---
    time.sleep(3)
    job.refresh_from_db()

    # Only retry if not stopped or error
    if job.status not in ['stopped', 'error']:
        if retry_count < max_retries:
            # Mark as stopped and clear PID
            job.status = 'stopped'
            job.ffmpeg_pid = None
            job.save()

            # Wait before retrying
            time.sleep(10)
            # Retry by calling transcoding_start with incremented retry_count
            from .tasks import transcoding_start
            transcoding_start.apply_async(args=[job.id, retry_count + 1])
        else:
            # Max retries reached, log to file and set error
            logger = logging.getLogger(f"ffmpeg_logger_{job.id}")
            logger.setLevel(logging.INFO)
            handler = logging.FileHandler(log_file_path, mode='a')
            formatter = logging.Formatter('%(asctime)s - %(message)s')
            handler.setFormatter(formatter)
            if not any(isinstance(h, logging.FileHandler) and h.baseFilename == handler.baseFilename for h in logger.handlers):
                logger.addHandler(handler)
            logger.error(f"Maximum retries ({max_retries}) reached. No further restart attempts will be made.")
            handler.close()
            logger.removeHandler(handler)
            job.status = 'error'
            job.save()


@shared_task
def transcoding_start(job_id, retry_count=0):
    """
    Start a transcoding job. If the job fails, it will be retried up to max_retries times.
    retry_count: how many times this job has been retried (in-memory, not persistent)
    """
    #fetching job and related channels
    try:
        job = TranscodingJob.objects.get(id=job_id)
        channel = job.channel
    except TranscodingJob.DoesNotExist:
        print(f"job with id {job_id} not found")
        return

    # Build ffmpeg command
    ffmpeg_command = ['ffmpeg']
    # Input Handling
    if channel.input_type == 'hls':
        ffmpeg_command += ['-re', '-i', channel.input_url]
    elif channel.input_type == 'udp':
        ffmpeg_command += [
            '-f', 'mpegts', '-fflags', '+genpts+discardcorrupt+igndts',
            '-probesize', '1000000', '-analyzeduration', '1000000',
            '-i', f"udp://{channel.input_multicast_ip}?localaddr={channel.input_network}"
        ]
    elif channel.input_type == 'file':
        ffmpeg_command += ['-i', channel.input_file.path]

    # Logo/overlay
    if channel.logo_path:
        raw_position = channel.logo_position
        ffmpeg_position = raw_position.replace('x=', '').replace('y=', '')
        if channel.scan_type == "interlaced":
            ffmpeg_command += [
                '-i', channel.logo_path, '-filter_complex',
                f'[1:v]format=rgba,colorchannelmixer=aa={channel.logo_opacity}[logo];[0][logo]overlay={ffmpeg_position}'
            ]
        else:
            ffmpeg_command += [
                '-i', channel.logo_path, '-filter_complex',
                f'[0:v]yadif[v0];[1:v]format=rgba,colorchannelmixer=aa={channel.logo_opacity}[logo];[v0][logo]overlay={ffmpeg_position}'
            ]
    elif channel.scan_type == "progressive":
        ffmpeg_command += ['-filter_complex', '[0:v]yadif[v0]', '-map', '[v0]', '-map', '0:a']

    # Video & Audio codec, bitrate, resolution, etc.
    ffmpeg_command += [
        '-c:v', channel.video_codec, '-preset', 'fast',
        '-b:v', str(channel.video_bitrate),
        *(
            ['-minrate', str(channel.video_bitrate), '-maxrate', str(channel.video_bitrate)]
            if channel.bitrate_mode.lower() == 'cbr' else []
        ),
        '-c:a', channel.audio,
        '-b:a', str(channel.audio_bitrate),
        '-bufsize', str(channel.buffer_size),
        '-s', channel.resolution,
        '-aspect', str(channel.aspect_ratio),
        '-r', str(channel.frame_rate),
        '-metadata', f'service_name={channel.name}'
    ]

    if channel.scan_type == 'interlaced':
        ffmpeg_command += [
            '-flags', '+ilme+ildct',
            '-field_order', 'tt'
        ]

    if channel.audio_gain:
        ffmpeg_command += ['-af', f'volume={channel.audio_gain}']

    # Output Handling
    if channel.output_type == 'hls':
        ffmpeg_command += [
            '-f', 'hls', '-hls_time', '10', '-hls_list_size', '6',
            '-hls_flags', 'delete_segments', channel.output_url
        ]
    elif channel.output_type == 'udp':
        ffmpeg_command += [
            '-streamid', f'0:{channel.video_pid}', '-streamid', f'1:{channel.audio_pid}',
            '-mpegts_service_id', str(channel.service_id)
        ]
        if channel.pmt_pid:
            ffmpeg_command += ['-mpegts_pmt_start_pid', str(channel.pmt_pid)]
        if channel.pcr_pid:
            ffmpeg_command += ['-mpegts_start_pid', str(channel.pcr_pid)]
        ffmpeg_command += [
            '-f', 'mpegts', '-ttl', '50',
            f'udp://{channel.output_multicast_ip}?localaddr={channel.output_network}&pkt_size=1316'
        ]
    elif channel.output_type == 'file':
        ffmpeg_command += [channel.output_file.path]

    # Print command for debugging
    print(f"FFmpeg Command: {' '.join(ffmpeg_command)}")

    # Run the FFmpeg command and handle errors
    try:
        # Create log directory
        log_dir = os.path.join('logs', 'channels')
        os.makedirs(log_dir, exist_ok=True)

        # Clean log filename
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', channel.name)
        log_file_path = os.path.join(log_dir, f'{safe_name}.log')

        # Start ffmpeg process
        process = subprocess.Popen(
            ffmpeg_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )

        # Save PID and status
        job.ffmpeg_pid = process.pid
        job.status = 'pending'
        job.save()

        # Start log streaming and retry logic in a thread
        threading.Thread(
            target=stream_logs,
            args=(process, log_file_path, job, ffmpeg_command, retry_count)
        ).start()

    except Exception as e:
        print(f"Error while starting FFmpeg: {e}")
        if job.ffmpeg_pid:
            os.kill(job.ffmpeg_pid, signal.SIGTERM)
        job.status = 'error'
        job.save()


def transcoding_stop(job_id):
    try:
        job = TranscodingJob.objects.get(id=job_id)
        pid = job.ffmpeg_pid
        if not pid:
            print(f'No pid found for job {job_id}. Is it running?')
            if job.status=='running':
                job.status = 'stopped'
                job.save()
            return
        #Try killing the process
        try:
            os.kill(pid, signal.SIGTERM)
            try:
                os.waitpid(pid,os.WNOHANG)
                time.sleep(5)
                finished_pid, _ = os.waitpid(pid, os.WNOHANG)
                if finished_pid == 0:  # still running
                    os.kill(pid, signal.SIGKILL)
                    os.waitpid(pid, 0)
            except ChildProcessError:
                # already waited by stream_logs
                pass
            print(f"Stopped {job.channel.name} with JOB ID {job_id} and PID {pid}")
        except Exception as e:
            print(f'An error occurred {e}')
            if job.status == 'running':
                job.status = 'stopped'
                job.save()            
            return

        job.status = 'stopped'
        job.ffmpeg_pid= None
        job.save()

    except TranscodingJob.DoesNotExist:
        print(f"Transcoding job with {job_id} not found")