from celery import shared_task
from .models import TranscodingJob, Channel
from django.utils import timezone
import subprocess

def transcoding_start(job_id):
    #fetching job and related channels
    try:
        job = TranscodingJob.objects.get(id=job_id)
        channel = job.channel
        print(f"Input type: {channel.input_type}")
        print(f"Output type: {channel.output_type}")

        #building ffmpeg command
        #ffmpeg_command=['ffmpeg']
        ffmpeg_command = [r'D:\Softwares\ffmpeg\bin\ffmpeg.exe']

        #Input Handling
        if channel.input_type == 'hls':
            ffmpeg_command += ['-i',channel.input_url]
        elif channel.input_type == 'udp':
            ffmpeg_command += ['-i',f"udp://{channel.input_multicast_ip}?localaddr={channel.input_network}"]
        elif channel.input_type == 'file':
            ffmpeg += ['-i',channel.input_file.path]

        # Video & Audio codec, bitrate, resolution, etc.
        ffmpeg_command += [
            '-c:v', channel.video_codec,  # Video codec (H.264, H.265, etc.)
            '-b:v', str(channel.video_bitrate),  # Video bitrate
            '-c:a', channel.audio,  # Audio codec (AAC, AC3, etc.)
            '-b:a', str(channel.audio_bitrate),  # Audio bitrate
            '-bufsize', str(channel.buffer_size),  # Buffer size
            '-s', channel.resolution,  # Resolution (e.g., 1920x1080)
            '-r', str(channel.frame_rate),  # Frame rate (e.g., 30 fps)
            '-metadata', f'service_name={channel.name}'  # Add service name as metadata
        ]
        if channel.audio_gain:
            ffmpeg_command +=['-af', f'volume={channel.audio_gain}']
        
        if channel.logo_path:
            ffmpeg_command += ['-i', channel.logo_path, 'filter_complex', f'overlay={channel.logo_position}']

        #ouput handling
        if channel.output_type == 'hls':
            ffmpeg_command += ['-f', 'hls', '-hls_time', '10', '-hls_list_size', '6', '-hls_flags', 'delete_segments', channel.output_url]
        elif channel.output_type == 'udp':
            ffmpeg_command += ['-f', 'mpegts', f'udp://{channel.output_multicast_ip}?localaddr={channel.output_network} -ttl 50']
        elif channel.output_type == 'file':
            ffmpeg_command += [channel.output_file.path]

        

        
        # Print command for testing
        print(f"FFmpeg Command: {' '.join(ffmpeg_command)}")


    except TranscodingJob.DoesNotExist:
        print(f"job with id {job_id} not found")

    # Run the FFmpeg command
    try:
        process = subprocess.Popen(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)

        # Optional: Print output line by line (for real-time feedback)
        for line in process.stdout:
            print(line.strip())

    except Exception as e:
        print(f"Error while starting FFmpeg: {e}")