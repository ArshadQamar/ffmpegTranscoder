from celery import shared_task
from .models import TranscodingJob, Channel
from django.utils import timezone
import subprocess
import os,signal,re,time,threading

def stream_logs(process, log_file_path,job):
    with open(log_file_path, 'a') as log_file:
        for line in process.stdout:
            log_file.write(line)
            log_file.flush()
        
        process.wait()
        log_file.write(f'\n--- FFmpeg exited with return code {process.returncode} ---\n')
        log_file.flush()

    time.sleep(3)
    
    job.refresh_from_db()
    if job.status not in ['stopped', 'error']:
        job.status = 'stopped'
        job.ffmpeg_pid = None
        job.save()

        #Restarting After exit
        time.sleep(5)
        from .tasks import transcoding_start
        transcoding_start.delay(job.id)
            

@shared_task
def transcoding_start(job_id):
    #fetching job and related channels
    try:
        job = TranscodingJob.objects.get(id=job_id)
        channel = job.channel
        print(f"Input type: {channel.input_type}")
        print(f"Output type: {channel.output_type}")

        #building ffmpeg command
        ffmpeg_command=['ffmpeg']
        # ffmpeg_command = [r'D:\Softwares\ffmpeg\bin\ffmpeg.exe','-y']

        #Input Handling
        if channel.input_type == 'hls':
            ffmpeg_command += ['-re','-i',channel.input_url]
        elif channel.input_type == 'udp':
            ffmpeg_command += ['-f', 'mpegts', '-fflags', '+genpts+discardcorrupt+igndts',
                               '-probesize', '1000000', '-analyzeduration', '1000000',
                               '-i',f"udp://{channel.input_multicast_ip}?localaddr={channel.input_network}"]
        elif channel.input_type == 'file':
            ffmpeg_command += ['-i',channel.input_file.path]

        if channel.logo_path:
            raw_position = channel.logo_position
            ffmpeg_position = raw_position.replace('x=', '').replace('y=', '')
            if channel.scan_type == "interlaced":
                ffmpeg_command += ['-i', channel.logo_path, '-filter_complex', 
                f'[1:v]format=rgba,colorchannelmixer=aa={channel.logo_opacity}[logo];[0][logo]overlay={ffmpeg_position}']
            else:
                ffmpeg_command += ['-i', channel.logo_path, '-filter_complex', 
                f'[0:v]yadif[v0];[1:v]format=rgba,colorchannelmixer=aa={channel.logo_opacity}[logo];[v0][logo]overlay={ffmpeg_position}']
        
        elif channel.scan_type == "progressive":
             ffmpeg_command += ['-filter_complex', '[0:v]yadif[v0]', '-map', '[v0]','-map','0:a']


        # Video & Audio codec, bitrate, resolution, etc.
        ffmpeg_command += [
            '-c:v', channel.video_codec,'-preset','fast',  # Video codec (H.264, H.265, etc.)
            '-b:v', str(channel.video_bitrate), # Video bitrate
            *(
                ['-minrate', str(channel.video_bitrate), '-maxrate', str(channel.video_bitrate)]
                if channel.bitrate_mode.lower() == 'cbr'
                else []
            ),

            '-c:a', channel.audio,  # Audio codec (AAC, AC3, etc.)
            '-b:a', str(channel.audio_bitrate),  # Audio bitrate
            '-bufsize', str(channel.buffer_size),  # Buffer size
            '-s', channel.resolution,  # Resolution (e.g., 1920x1080)
            '-aspect', str(channel.aspect_ratio),
            '-r', str(channel.frame_rate),  # Frame rate (e.g., 30 fps)
            '-metadata', f'service_name={channel.name}'  # Add service name as metadata
        ]

        if channel.scan_type == 'interlaced':
            ffmpeg_command += [
                    '-flags', '+ilme+ildct',
                    '-field_order', 'tt']  # or 'bb' depending on your field order
                

        if channel.audio_gain:
            ffmpeg_command +=['-af', f'volume={channel.audio_gain}']
        


        #ouput handling
        if channel.output_type == 'hls':
            ffmpeg_command += ['-f', 'hls', '-hls_time', '10', '-hls_list_size', '6', '-hls_flags', 'delete_segments', channel.output_url]
        elif channel.output_type == 'udp':
            ffmpeg_command += ['-streamid',f'0:{channel.video_pid}', '-streamid',f'1:{channel.audio_pid}', '-mpegts_service_id',str(channel.service_id)]

            if channel.pmt_pid:
                ffmpeg_command += ['-mpegts_pmt_start_pid', str(channel.pmt_pid)]

            if channel.pcr_pid:
                ffmpeg_command += ['-mpegts_start_pid', str(channel.pcr_pid)]
                               
            ffmpeg_command += ['-f', 'mpegts', '-ttl', '50', f'udp://{channel.output_multicast_ip}?localaddr={channel.output_network}&pkt_size=1316']

        elif channel.output_type == 'file':
            ffmpeg_command += [channel.output_file.path]

        

        
        # Print command for testing
        print(f"FFmpeg Command: {' '.join(ffmpeg_command)}")



    except TranscodingJob.DoesNotExist:
        print(f"job with id {job_id} not found")

    # Run the FFmpeg command
    try:
        #Create log directory
        log_dir=os.path.join('logs','channels')
        os.makedirs(log_dir,exist_ok=True)

        #Cleaning log filename
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', channel.name)
        log_file_path = os.path.join(log_dir,f'{safe_name}.log')

        log_file = open(log_file_path, 'a')


        process = subprocess.Popen(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)


        
        #Save PID and Status in job
        job.ffmpeg_pid = process.pid
        job.status = 'pending'
        job.save()

        log_found = False
        start_time = time.time()
        timeout = 10

        for line in process.stdout:
            log_file.write(line)
            log_file.flush()

            if 'frame=' in line and 'fps=' in line and 'bitrate=' in line:
                log_found = True
                break
            if time.time() - start_time > timeout:
                break

        if log_found:
            job.status='running'
        else:
            try:
                os.kill(process.pid,signal.SIGTERM)
            except Exception as kill_err:
                job.status='error'

        job.save()

        threading.Thread(target=stream_logs, args=(process, log_file_path, job)).start()


    except Exception as e:
        print(f"Error while starting FFmpeg: {e}")
        if job.ffmpeg_pid:
            os.kill(job.ffmpeg_pid,signal.SIGTERM)
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