from celery import shared_task
from .models import TranscodingJob, Channel
from rest_framework.exceptions import ValidationError
from django.utils import timezone
import subprocess, socket, struct
import os,signal,re,time,threading,logging, psutil


def is_multicast_active(address, timeout=3):
    try:
        ip, port = address.split(":")
        port = int(port)
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.settimeout(timeout)
        sock.bind(("",port))
        mreq = struct.pack("4sl", socket.inet_aton(ip), socket.INADDR_ANY)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
        sock.recvfrom(2048)
        sock.close()
        return True
    except:
        return False


def is_process_alive(pid):
    try:
        return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
    except psutil.NoSuchProcess:
        return False
    
def is_ffmpeg_process(pid):
    try:
        if not psutil.pid_exists(pid):
            return False
        
        process = psutil.Process(pid)
        if not process.is_running():
            return False
            
        # Check if it's an FFmpeg process
        process_name = process.name().lower()
        cmdline = ' '.join(process.cmdline()).lower()
        
        # Check if process name or command contains 'ffmpeg'
        return 'ffmpeg' in process_name or 'ffmpeg' in cmdline
        
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        return False

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
    
    # Check if job already has a running process
    if job.ffmpeg_pid and is_process_alive(job.ffmpeg_pid):
        if is_ffmpeg_process(job.ffmpeg_pid):
            print(f"Job {job_id} already running with PID {job.ffmpeg_pid}, skipping start")
            return
        else:
            print(f"Stale PID {job.ffmpeg_pid} found, clearing it")
            job.ffmpeg_pid = None
            job.save()
            



    # Build ffmpeg command
    ffmpeg_command = ['ffmpeg']
    # Input Handling
    if channel.input_type == 'hls':
        ffmpeg_command += ['-re', '-i', channel.input_url]
    elif channel.input_type == 'udp':
        ffmpeg_command += [
            '-f', 'mpegts', '-fflags', '+nobuffer+discardcorrupt',
            '-probesize', '1000000', '-analyzeduration', '1000000',
            '-i', f"udp://{channel.input_multicast_ip}?localaddr={channel.input_network}"
        ]
    elif channel.input_type == 'file':
        ffmpeg_command += ['-i', channel.input_file]

    #-------------------ABR------------------------------------#
    if channel.is_abr and hasattr(channel, 'abr') and channel.abr.exists():
        num_profiles = channel.abr.count()

        # Build basic filter complex - handle logo if exists
        filter_parts = []
        
        # Check if logo exists and has valid path (same as single channel)
        has_logo = hasattr(channel, 'logo_path') and channel.logo_path and channel.logo_path.strip()
        
        if has_logo:
            # Process logo position (same as single channel)
            raw_position = getattr(channel, 'logo_position', 'x=10:y=10')
            ffmpeg_position = raw_position.replace('x=', '').replace('y=', '')
            logo_opacity = getattr(channel, 'logo_opacity', 1.0)
            
            # Add logo input to ffmpeg command
            ffmpeg_command += ['-i', channel.logo_path]
            
            # Create logo filter with opacity and format (same as single channel)
            logo_filter = f"[1:v]format=rgba,colorchannelmixer=aa={logo_opacity}[logo]"
            filter_parts.append(logo_filter)
            
            # Apply overlay based on scan type
            if channel.scan_type == 'progressive':
                # For progressive: apply deinterlacing first, then overlay
                filter_parts.append(f"[0:v]yadif[deint_video]")
                filter_parts.append(f"[deint_video][logo]overlay={ffmpeg_position}[logo_video]")
            else:
                # For interlaced: apply overlay directly, then deinterlace if needed
                filter_parts.append(f"[0:v][logo]overlay={ffmpeg_position}[logo_video]")
            
            # Split the video with logo for all profiles
            filter_parts.append(f"[logo_video]split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))
        else:
            # No logo - proceed with original splitting
            if channel.scan_type == 'progressive':
                filter_parts.append(f"[0:v]yadif,split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))
            else:
                filter_parts.append(f"[0:v]split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))

        # Scale each video stream to target resolution
        for i, profile in enumerate(channel.abr.all()):
            filter_parts.append(f"[v{i}]scale={profile.resolution}[vout{i}]")

        # Audio split and volume
        audio_gain = channel.audio_gain if channel.audio_gain else 1.0
        filter_parts.append(f"[0:a]asplit={num_profiles}" + ''.join(f"[a{i}]" for i in range(num_profiles)))
        for i in range(num_profiles):
            filter_parts.append(f"[a{i}]volume={audio_gain}[aout{i}]")

        # Combine all filter parts
        filter_complex = ';'.join(filter_parts)
        ffmpeg_command += ['-filter_complex', filter_complex]    

        # Global parameters for all streams
  

        # Configure each output stream
        for i, profile in enumerate(channel.abr.all()):
            resolution_height = profile.resolution.split('x')[1]
            service_name = f"{channel.name}@{resolution_height}"
            ffmpeg_command += [
                '-c:v', channel.video_codec,
                '-c:a', channel.audio,
                *(
                    ['-preset', 'fast']
                    if channel.video_codec == 'libx264' else []
                ),
                '-aspect', str(channel.aspect_ratio),
                '-r', str(channel.frame_rate),
                f'-b:v:{i}', str(profile.video_bitrate),

                *(
                    ['-minrate', str(profile.video_bitrate), '-maxrate', str(profile.video_bitrate),'-bufsize', str(profile.buffer_size)]
                    if channel.bitrate_mode.lower() == 'cbr' else []
                ),
                *(
                    ['-maxrate', str(profile.video_bitrate), '-bufsize', str(profile.buffer_size)]
                    if channel.bitrate_mode.lower() == 'vbr' else []
                ),

                '-g', '50',
                '-bf', '2',
                '-sc_threshold', '0',    
                '-pcr_period', '20',            

            ]

            if channel.scan_type == 'interlaced':
                if channel.video_codec == 'libx264':
                    ffmpeg_command += ['-x264opts', 'tff=1:interlaced=1']
                elif channel.video_codec == 'libx265':
                    ffmpeg_command += ['-x265-params', 'interlace=1:field=tff']
                elif channel.video_codec == 'mpeg2video':
                    ffmpeg_command += ['-flags', '+ildct+ilme', '-top', '1']            
            
            # Stream-specific audio parameters
            ffmpeg_command += [
                f'-b:a:{i}', str(profile.audio_bitrate),
            ]
            
            # Map the streams for this output
            ffmpeg_command += [
                '-map', f'[vout{i}]',
                '-map', f'[aout{i}]',
            ]
            
            # Output-specific configuration
            if profile.output_type == 'udp':
                ffmpeg_command += [
                    '-f', 'mpegts',
                    '-ttl', '50',
                    '-streamid', f'0:{profile.video_pid}',
                    '-streamid', f'1:{profile.audio_pid}',
                    '-mpegts_service_id', str(profile.service_id),
                    '-mpegts_pmt_start_pid', str(profile.pmt_pid),
                    '-mpegts_start_pid', str(profile.pcr_pid),
                    '-metadata', f'service_name={service_name}',
                    '-metadata', f'service_provider={channel.name}',              
                ]
                
                ffmpeg_command += [
                    f'udp://{profile.output_multicast_ip}?localaddr={profile.output_network}&pkt_size=1316'
                ]   

            elif profile.output_type == 'hls':
                ffmpeg_command += [
                    '-f', 'hls', '-hls_time', '10', '-hls_list_size', '6',
                    '-hls_flags', 'delete_segments', profile.output_url
                ]
            



    # ------------------Single Channel-------------------------#
    # Logo/overlay
    # else:
    #     if channel.logo_path:
    #         raw_position = channel.logo_position
    #         ffmpeg_position = raw_position.replace('x=', '').replace('y=', '')
    #         if channel.scan_type == "interlaced":
    #             ffmpeg_command += [
    #                 '-i', channel.logo_path, '-filter_complex',
    #                 f'[1:v]format=rgba,colorchannelmixer=aa={channel.logo_opacity}[logo];[0][logo]overlay={ffmpeg_position}'
    #             ]
    #         else:
    #             ffmpeg_command += [
    #                 '-i', channel.logo_path, '-filter_complex',
    #                 f'[0:v]yadif[v0];[1:v]format=rgba,colorchannelmixer=aa={channel.logo_opacity}[logo];[v0][logo]overlay={ffmpeg_position}'
    #             ]
    #     elif channel.scan_type == "progressive":
    #         ffmpeg_command += ['-filter_complex', '[0:v]yadif[v0]', '-map', '[v0]', '-map', '0:a']

        # Video & Audio codec, bitrate, resolution, etc.
        # ffmpeg_command += [
        #     '-c:v', channel.video_codec,
        #     *(
        #         ['-preset', 'fast']
        #         if channel.video_codec == 'libx264' else []
        #      ),
        #     '-b:v', str(channel.video_bitrate),
        #     *(
        #         ['-minrate', str(channel.video_bitrate), '-maxrate', str(channel.video_bitrate),'-bufsize', str(channel.buffer_size)]
        #         if channel.bitrate_mode.lower() == 'cbr' else []
        #     ),
        #      *(
        #         ['-maxrate', str(channel.video_bitrate), '-bufsize', str(channel.buffer_size)]
        #         if channel.bitrate_mode.lower() == 'vbr' else []
        #     ),
        #     '-g', '50',
        #     '-bf', '2',
        #     '-sc_threshold', '0',
        #     '-c:a', channel.audio,
        #     '-b:a', str(channel.audio_bitrate),
        #     '-fps_mode', 'auto',
        #     '-s', channel.resolution,
        #     '-aspect', str(channel.aspect_ratio),
        #     '-r', str(channel.frame_rate),
        #     '-metadata', f'service_name={channel.name}'
        # ]

        # if channel.scan_type == 'interlaced':
        #     ffmpeg_command += [
        #         '-flags', '+ilme+ildct',
        #         '-field_order', 'tt'
        #     ]

        # if channel.audio_gain:
        #     ffmpeg_command += ['-af', f'volume={channel.audio_gain}']

        # # Output Handling
        # if channel.output_type == 'hls':
        #     ffmpeg_command += [
        #         '-f', 'hls', '-hls_time', '10', '-hls_list_size', '6',
        #         '-hls_flags', 'delete_segments', channel.output_url
        #     ]
        # elif channel.output_type == 'udp':
        #     ffmpeg_command += [
        #         '-streamid', f'0:{channel.video_pid}', '-streamid', f'1:{channel.audio_pid}',
        #         '-mpegts_service_id', str(channel.service_id)
        #     ]
        #     if channel.pmt_pid:
        #         ffmpeg_command += ['-mpegts_pmt_start_pid', str(channel.pmt_pid)]
        #     if channel.pcr_pid:
        #         ffmpeg_command += ['-mpegts_start_pid', str(channel.pcr_pid)]
        #     ffmpeg_command += [
        #         '-f', 'mpegts', '-ttl', '50',
        #         f'udp://{channel.output_multicast_ip}?localaddr={channel.output_network}&pkt_size=1316'
        #     ]
        # elif channel.output_type == 'file':
        #     ffmpeg_command += [channel.output_file]

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