# FFmpeg Command Customization Guide

## Overview

This guide explains how to modify the FFmpeg command generation logic in `tasks.py` to customize transcoding behavior. The FFmpeg commands are dynamically constructed based on channel configuration and ABR profiles.

**File Location:** `backend/transcoder/tasks.py`

---

## Table of Contents

1. [Understanding tasks.py Structure](#understanding-taskspy-structure)
2. [FFmpeg Command Construction](#ffmpeg-command-construction)
3. [Modifying Input Handling](#modifying-input-handling)
4. [Customizing Video Processing](#customizing-video-processing)
5. [Modifying Audio Processing](#modifying-audio-processing)
6. [Customizing Output Settings](#customizing-output-settings)
7. [Adding New Features](#adding-new-features)
8. [Common Customization Examples](#common-customization-examples)
9. [Testing Your Changes](#testing-your-changes)

---

## Understanding tasks.py Structure

The `tasks.py` file contains two main Celery tasks and several helper functions:

### Main Tasks

1. **`transcoding_start(job_id, retry_count=0)`** - Starts a transcoding job
2. **`transcoding_stop(job_id)`** - Stops a running transcoding job

### Helper Functions

- **`is_multicast_active(address, timeout=3)`** - Checks if multicast stream is active
- **`is_process_alive(pid)`** - Checks if a process is running
- **`is_ffmpeg_process(pid)`** - Validates that a PID belongs to FFmpeg
- **`watchdog(process, job, logger)`** - Monitors FFmpeg startup and kills stuck processes
- **`stream_logs(process, log_file_path, job, ffmpeg_command, retry_count, max_retries)`** - Streams FFmpeg output to log files and handles retries

### Key Variables

- **`stop_signals`** - Dictionary tracking stop signals for each job
- **`max_retries`** - Default is 5 automatic retries

---

## FFmpeg Command Construction

The FFmpeg command is built in the `transcoding_start()` function starting at **line 222**. The command is constructed as a list of strings that will be passed to `subprocess.Popen()`.

### Basic Structure

```python
ffmpeg_command = ['ffmpeg']

# 1. Input handling (lines 224-233)
# 2. Filter complex for ABR (lines 236-288)
# 3. Video/Audio codec settings (lines 294-336)
# 4. Output configuration (lines 344-365)
```

### Command Flow

```
Input → Filters (logo, deinterlace, split) → Encoding → Output
```

---

## Modifying Input Handling

### Location: Lines 224-233

The input handling section determines how FFmpeg receives the source stream.

### Current Implementation

```python
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
```

### Example 1: Add RTMP Input Support

```python
# Add after line 233
elif channel.input_type == 'rtmp':
    ffmpeg_command += [
        '-rtmp_live', 'live',
        '-i', channel.input_rtmp_url
    ]
```

**Required Model Changes:**
- Add `'rtmp'` to `INPUT_TYPES` in `models.py`
- Add `input_rtmp_url` field to `Channel` model
- Update serializer validation

### Example 2: Add SRT Input Support

```python
elif channel.input_type == 'srt':
    ffmpeg_command += [
        '-f', 'mpegts',
        '-i', f"srt://{channel.input_srt_address}?mode=listener"
    ]
```

### Example 3: Customize UDP Buffer Settings

```python
elif channel.input_type == 'udp':
    # Increase buffer size for high bitrate streams
    ffmpeg_command += [
        '-f', 'mpegts',
        '-fflags', '+nobuffer+discardcorrupt',
        '-probesize', '5000000',  # Increased from 1000000
        '-analyzeduration', '5000000',  # Increased from 1000000
        '-buffer_size', '10485760',  # Add 10MB buffer
        '-i', f"udp://{channel.input_multicast_ip}?localaddr={channel.input_network}&buffer_size=10485760"
    ]
```

### Example 4: Add Hardware Acceleration for Input

```python
if channel.input_type == 'hls':
    # Add NVIDIA hardware acceleration
    ffmpeg_command += [
        '-hwaccel', 'cuda',
        '-hwaccel_output_format', 'cuda',
        '-re', '-i', channel.input_url
    ]
```

---

## Customizing Video Processing

### Filter Complex (Lines 236-288)

The filter complex handles logo overlay, deinterlacing, splitting for ABR, and scaling.

### Current Filter Structure

```
[Logo Input] → [Format + Opacity] → [Overlay] → [Split] → [Scale for each profile]
```

### Example 1: Add Watermark Text

```python
# Modify the filter_parts section (around line 268)
if has_logo:
    # Existing logo filter
    logo_filter = f"[1:v]format=rgba,colorchannelmixer=aa={logo_opacity}[logo]"
    filter_parts.append(logo_filter)
    
    # Add text watermark
    text_filter = f"[logo_video]drawtext=text='{channel.name}':fontsize=24:fontcolor=white:x=10:y=H-th-10[watermarked]"
    filter_parts.append(text_filter)
    
    # Update split to use watermarked video
    filter_parts.append(f"[watermarked]split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))
```

**Required Model Changes:**
- Add `watermark_text` field to Channel model
- Add `watermark_position` field

### Example 2: Add Color Correction

```python
# Add after deinterlacing, before split (around line 273)
if channel.scan_type == 'progressive':
    filter_parts.append(f"[0:v]yadif,eq=brightness=0.05:contrast=1.1[color_corrected]")
    filter_parts.append(f"[color_corrected]split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))
```

### Example 3: Add Cropping

```python
# Add crop filter before scaling (around line 277)
for i, profile in enumerate(channel.abr.all()):
    # Add crop before scale
    crop_filter = f"[v{i}]crop={channel.crop_width}:{channel.crop_height}:{channel.crop_x}:{channel.crop_y}[cropped{i}]"
    filter_parts.append(crop_filter)
    # Scale the cropped video
    filter_parts.append(f"[cropped{i}]scale={profile.resolution}[vout{i}]")
```

**Required Model Changes:**
- Add `crop_width`, `crop_height`, `crop_x`, `crop_y` fields

### Example 4: Add Denoising Filter

```python
# Add after deinterlacing (around line 272)
if channel.enable_denoise:
    if channel.scan_type == 'progressive':
        filter_parts.append(f"[0:v]yadif,hqdn3d=4:3:6:4.5[denoised]")
        filter_parts.append(f"[denoised]split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))
```

---

## Modifying Audio Processing

### Location: Lines 281-284

### Current Implementation

```python
# Audio split and volume
audio_gain = channel.audio_gain if channel.audio_gain else 1.0
filter_parts.append(f"[0:a]asplit={num_profiles}" + ''.join(f"[a{i}]" for i in range(num_profiles)))
for i in range(num_profiles):
    filter_parts.append(f"[a{i}]volume={audio_gain}[aout{i}]")
```

### Example 1: Add Audio Normalization

```python
# Replace volume filter with loudnorm
audio_gain = channel.audio_gain if channel.audio_gain else 1.0
filter_parts.append(f"[0:a]asplit={num_profiles}" + ''.join(f"[a{i}]" for i in range(num_profiles)))
for i in range(num_profiles):
    # Add loudness normalization before volume
    filter_parts.append(
        f"[a{i}]loudnorm=I=-16:TP=-1.5:LRA=11,volume={audio_gain}[aout{i}]"
    )
```

### Example 2: Add Audio Delay

```python
# Add audio delay (useful for lip-sync correction)
for i in range(num_profiles):
    delay_ms = channel.audio_delay_ms if hasattr(channel, 'audio_delay_ms') else 0
    filter_parts.append(
        f"[a{i}]adelay={delay_ms}|{delay_ms},volume={audio_gain}[aout{i}]"
    )
```

**Required Model Changes:**
- Add `audio_delay_ms` field to Channel model

### Example 3: Add Audio Compression

```python
# Add dynamic range compression
for i in range(num_profiles):
    filter_parts.append(
        f"[a{i}]acompressor=threshold=-20dB:ratio=4:attack=5:release=50,volume={audio_gain}[aout{i}]"
    )
```

---

## Customizing Output Settings

### Location: Lines 344-365

### Current Implementation (UDP Output)

```python
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
```

### Example 1: Add RTMP Output Support

```python
# Add after HLS output (around line 365)
elif profile.output_type == 'rtmp':
    ffmpeg_command += [
        '-f', 'flv',
        '-flvflags', 'no_duration_filesize',
        profile.output_rtmp_url
    ]
```

**Required Model Changes:**
- Add `'rtmp'` to `OUTPUT_TYPES` in `models.py`
- Add `output_rtmp_url` field to ABR model

### Example 2: Customize MPEG-TS Muxing

```python
if profile.output_type == 'udp':
    ffmpeg_command += [
        '-f', 'mpegts',
        '-ttl', '64',  # Increased TTL
        '-muxrate', str(profile.muxrate),  # Add muxrate control
        '-pcr_period', '20',  # PCR interval in ms
        '-pat_period', '0.1',  # PAT interval in seconds
        '-sdt_period', '0.5',  # SDT interval in seconds
        '-streamid', f'0:{profile.video_pid}',
        '-streamid', f'1:{profile.audio_pid}',
        '-mpegts_service_id', str(profile.service_id),
        '-mpegts_pmt_start_pid', str(profile.pmt_pid),
        '-mpegts_start_pid', str(profile.pcr_pid),
        '-metadata', f'service_name={service_name}',
        '-metadata', f'service_provider={channel.name}',
    ]
```

### Example 3: Add SRT Output

```python
elif profile.output_type == 'srt':
    ffmpeg_command += [
        '-f', 'mpegts',
        f'srt://{profile.output_srt_address}?mode=caller&latency=1000000'
    ]
```

### Example 4: Customize HLS Segmentation

```python
elif profile.output_type == 'hls':
    ffmpeg_command += [
        '-f', 'hls',
        '-hls_time', '6',  # 6-second segments
        '-hls_list_size', '10',  # Keep 10 segments in playlist
        '-hls_flags', 'delete_segments+append_list',
        '-hls_segment_type', 'mpegts',  # or 'fmp4' for fragmented MP4
        '-hls_segment_filename', f'{profile.output_url.replace(".m3u8", "")}_%03d.ts',
        profile.output_url
    ]
```

---

## Adding New Features

### Example 1: Add Subtitle Burning

**Step 1:** Add model fields
```python
# In models.py, add to Channel model
subtitle_file = models.CharField(max_length=500, blank=True, null=True)
subtitle_style = models.CharField(max_length=200, blank=True, null=True, default='FontSize=24,PrimaryColour=&HFFFFFF&')
```

**Step 2:** Modify filter complex in tasks.py
```python
# Add after logo overlay (around line 268)
if hasattr(channel, 'subtitle_file') and channel.subtitle_file:
    subtitle_filter = f"[logo_video]subtitles={channel.subtitle_file}:force_style='{channel.subtitle_style}'[subtitled]"
    filter_parts.append(subtitle_filter)
    filter_parts.append(f"[subtitled]split={num_profiles}" + ''.join(f"[v{i}]" for i in range(num_profiles)))
```

### Example 2: Add Multi-Audio Track Support

**Step 1:** Modify audio handling
```python
# Replace single audio split with multi-audio (around line 281)
# Assuming channel has audio_track_count field
audio_track_count = getattr(channel, 'audio_track_count', 1)

for track in range(audio_track_count):
    filter_parts.append(f"[0:a:{track}]asplit={num_profiles}" + ''.join(f"[a{track}_{i}]" for i in range(num_profiles)))
    for i in range(num_profiles):
        filter_parts.append(f"[a{track}_{i}]volume={audio_gain}[aout{track}_{i}]")
```

**Step 2:** Update stream mapping
```python
# In output section (around line 340)
for i, profile in enumerate(channel.abr.all()):
    # Map video
    ffmpeg_command += ['-map', f'[vout{i}]']
    
    # Map all audio tracks
    for track in range(audio_track_count):
        ffmpeg_command += ['-map', f'[aout{track}_{i}]']
```

### Example 3: Add Thumbnail Generation

```python
# Add after starting FFmpeg process (around line 478)
if channel.generate_thumbnails:
    thumbnail_command = [
        'ffmpeg', '-i', f"udp://{profile.output_multicast_ip}?localaddr={profile.output_network}",
        '-vf', 'fps=1/10',  # 1 frame every 10 seconds
        '-q:v', '2',
        f'/media/thumbnails/{channel.name}_%03d.jpg'
    ]
    # Start thumbnail generation in separate process
    thumbnail_process = subprocess.Popen(thumbnail_command)
```

---

## Common Customization Examples

### 1. Change Encoding Preset

**Location:** Lines 301-303

```python
# Current
*(['-preset', 'fast'] if channel.video_codec == 'libx264' else []),

# Change to slower preset for better quality
*(['-preset', 'medium'] if channel.video_codec == 'libx264' else []),

# Or make it configurable
*(['-preset', channel.encoding_preset] if channel.video_codec == 'libx264' else []),
```

### 2. Add Custom x264 Parameters

**Location:** After line 330

```python
if channel.scan_type == 'interlaced':
    if channel.video_codec == 'libx264':
        # Add custom x264 parameters
        ffmpeg_command += [
            '-x264opts', 
            'tff=1:interlaced=1:bframes=2:ref=4:me=umh:subme=7'
        ]
```

### 3. Modify GOP Size

**Location:** Line 317

```python
# Current: GOP size of 50 frames
'-g', '50',

# Make it configurable based on frame rate (2 seconds GOP)
'-g', str(channel.frame_rate * 2),

# Or use channel field
'-g', str(channel.gop_size),
```

### 4. Add Closed GOP

```python
# Add after GOP size (line 317)
'-g', '50',
'-keyint_min', '50',  # Minimum GOP size
'-sc_threshold', '0',  # Disable scene change detection
'-force_key_frames', 'expr:gte(t,n_forced*2)',  # Force keyframe every 2 seconds
```

### 5. Change Bitrate Control Method

**Location:** Lines 308-315

```python
# Add CRF mode option
if channel.bitrate_mode.lower() == 'crf':
    ffmpeg_command += [
        '-crf', str(channel.crf_value),  # Add crf_value field to model
        '-maxrate', str(profile.video_bitrate),
        '-bufsize', str(profile.buffer_size)
    ]
elif channel.bitrate_mode.lower() == 'cbr':
    # ... existing CBR code
```

### 6. Add Two-Pass Encoding

```python
# First pass
if channel.enable_two_pass:
    first_pass_command = ffmpeg_command.copy()
    first_pass_command += [
        '-pass', '1',
        '-passlogfile', f'/tmp/ffmpeg_pass_{job.id}',
        '-f', 'null',
        '-'
    ]
    subprocess.run(first_pass_command)
    
    # Second pass
    ffmpeg_command += [
        '-pass', '2',
        '-passlogfile', f'/tmp/ffmpeg_pass_{job.id}'
    ]
```

### 7. Modify Retry Logic

**Location:** Lines 166-176

```python
# Current: 5 retries with 10 second delay
if retry_count < max_retries:
    job.status = 'stopped'
    job.ffmpeg_pid = None
    job.save()
    time.sleep(10)
    transcoding_start.apply_async(args=[job.id, retry_count + 1])

# Custom: Exponential backoff
if retry_count < max_retries:
    job.status = 'stopped'
    job.ffmpeg_pid = None
    job.save()
    delay = min(10 * (2 ** retry_count), 300)  # Max 5 minutes
    time.sleep(delay)
    transcoding_start.apply_async(args=[job.id, retry_count + 1])
```

### 8. Add Email Notification on Error

```python
# Add after max retries reached (around line 189)
if retry_count >= max_retries:
    logger.error(f"Maximum retries ({max_retries}) reached.")
    
    # Send email notification
    from django.core.mail import send_mail
    send_mail(
        subject=f'Transcoding Job {job.id} Failed',
        message=f'Channel: {channel.name}\nRetries: {max_retries}\nCheck logs for details.',
        from_email='noreply@transcoder.com',
        recipient_list=['admin@transcoder.com'],
        fail_silently=True
    )
    
    job.status = 'error'
    job.save()
```

---

## Testing Your Changes

### 1. Test Command Generation

Add debug logging to see the generated command:

```python
# After line 449
print(f"FFmpeg Command: {' '.join(ffmpeg_command)}")

# Or save to file for inspection
with open(f'/tmp/ffmpeg_cmd_{job.id}.txt', 'w') as f:
    f.write(' '.join(ffmpeg_command))
```

### 2. Test FFmpeg Command Manually

Copy the generated command and run it manually:

```bash
# From the debug output
ffmpeg -f mpegts -fflags +nobuffer+discardcorrupt -probesize 1000000 ...

# Check for errors
# Verify output stream
```

### 3. Monitor Logs

```bash
# Watch the log file
tail -f backend/logs/channels/your_channel_name.log

# Check Celery worker output
# Look for errors in Django logs
```

### 4. Validate Output Stream

For UDP output:
```bash
# Use ffplay to test
ffplay udp://239.2.1.1:6000

# Use VLC
vlc udp://@239.2.1.1:6000

# Check with ffprobe
ffprobe udp://239.2.1.1:6000
```

For HLS output:
```bash
# Test with ffplay
ffplay /path/to/output.m3u8

# Check segment creation
ls -lh /path/to/segments/
```

### 5. Performance Testing

```bash
# Monitor system resources
curl http://localhost:8000/api/metrics/

# Check FFmpeg process
ps aux | grep ffmpeg

# Monitor network bandwidth
iftop -i eth0
```

---

## Best Practices

1. **Always validate input:** Check that required fields exist before using them
2. **Use channel attributes safely:** Use `getattr(channel, 'field', default)` for optional fields
3. **Test incrementally:** Make small changes and test each one
4. **Keep logs:** Maintain detailed logging for debugging
5. **Handle errors gracefully:** Wrap risky operations in try-except blocks
6. **Document changes:** Comment your modifications clearly
7. **Backup original:** Keep a copy of the original `tasks.py` before modifying
8. **Test with real streams:** Always test with actual input sources, not just file inputs

---

## Troubleshooting

### FFmpeg Won't Start

- Check the generated command syntax
- Verify input source is accessible
- Check file permissions for logo/subtitle files
- Ensure network interfaces are correct

### Job Stuck in "Pending"

- Check the watchdog timeout (line 53)
- Verify FFmpeg is producing output
- Check log file for errors

### High CPU Usage

- Reduce encoding preset (fast → ultrafast)
- Lower resolution or bitrate
- Disable complex filters
- Enable hardware acceleration

### Audio/Video Sync Issues

- Add audio delay filter
- Check frame rate settings
- Verify input stream quality
- Adjust buffer sizes

---

## Additional Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html)
- [FFmpeg Formats](https://ffmpeg.org/ffmpeg-formats.html)
- [Celery Documentation](https://docs.celeryproject.org/)

---

## Getting Help

If you encounter issues:

1. Check FFmpeg logs in `backend/logs/channels/`
2. Review Celery worker output
3. Test FFmpeg command manually
4. Verify model changes are migrated: `python manage.py makemigrations && python manage.py migrate`
5. Restart Celery worker after code changes
