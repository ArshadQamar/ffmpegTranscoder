# API Reference Documentation

## Overview

This document provides comprehensive documentation for all API endpoints available in the FFmpeg Transcoder System. The API is built using Django REST Framework and provides endpoints for managing channels, transcoding jobs, and system monitoring.

**Base URL:** `http://localhost:8000/api/`

**Authentication:** Currently, the API does not require authentication (configured with `IsAuthenticatedOrReadOnly` but commented out in views).

---

## Table of Contents

1. [Channel Management](#channel-management)
2. [Transcoding Job Management](#transcoding-job-management)
3. [Job Control](#job-control)
4. [System Monitoring](#system-monitoring)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)

---

## Channel Management

### List All Channels

Retrieve a list of all configured channels.

**Endpoint:** `GET /api/channels/`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Channel 1",
    "input_type": "udp",
    "input_url": null,
    "input_multicast_ip": "239.1.1.1:5000",
    "input_network": "192.168.1.100",
    "input_file": null,
    "is_abr": true,
    "output_type": null,
    "output_url": null,
    "output_multicast_ip": null,
    "output_network": null,
    "output_file": null,
    "video_codec": "libx264",
    "audio": "aac",
    "audio_gain": 1.0,
    "bitrate_mode": "vbr",
    "video_bitrate": null,
    "audio_bitrate": null,
    "buffer_size": null,
    "scan_type": "progressive",
    "resolution": null,
    "frame_rate": 30,
    "service_id": null,
    "video_pid": null,
    "audio_pid": null,
    "aspect_ratio": "16:9",
    "pmt_pid": null,
    "pcr_pid": null,
    "logo_path": "/path/to/logo.png",
    "logo_position": "x=10:y=10",
    "logo_opacity": 0.8,
    "status": "running",
    "job_id": 1,
    "error_message": null,
    "abr_profiles": [
      {
        "id": 1,
        "channel": 1,
        "output_type": "udp",
        "output_url": null,
        "output_multicast_ip": "239.2.1.1:6000",
        "output_network": "192.168.1.100",
        "video_bitrate": 4800000,
        "audio_bitrate": 192000,
        "buffer_size": 9600000,
        "resolution": "1920x1080",
        "service_id": 1001,
        "video_pid": 101,
        "audio_pid": 102,
        "pmt_pid": 4096,
        "pcr_pid": 256,
        "muxrate": 6000000
      }
    ]
  }
]
```

**Example cURL:**
```bash
curl -X GET http://localhost:8000/api/channels/
```

---

### Create a New Channel

Create a new channel configuration. Channels can be configured as ABR (Adaptive Bitrate) or single-profile.

**Endpoint:** `POST /api/channels/`

**Request Body (ABR Channel):**
```json
{
  "name": "HD Sports Channel",
  "input_type": "udp",
  "input_multicast_ip": "239.1.1.10:5000",
  "input_network": "192.168.1.100",
  "is_abr": true,
  "video_codec": "libx264",
  "audio": "aac",
  "audio_gain": 1.0,
  "bitrate_mode": "cbr",
  "scan_type": "progressive",
  "frame_rate": 30,
  "aspect_ratio": "16:9",
  "logo_path": "/media/logos/sports_logo.png",
  "logo_position": "x=W-w-10:y=10",
  "logo_opacity": 0.9,
  "abr_profiles": [
    {
      "output_type": "udp",
      "output_multicast_ip": "239.2.1.10:6000",
      "output_network": "192.168.1.100",
      "video_bitrate": 4800000,
      "audio_bitrate": 192000,
      "buffer_size": 9600000,
      "resolution": "1920x1080",
      "service_id": 1001,
      "video_pid": 101,
      "audio_pid": 102,
      "pmt_pid": 4096,
      "pcr_pid": 256,
      "muxrate": 6000000
    },
    {
      "output_type": "udp",
      "output_multicast_ip": "239.2.1.11:6001",
      "output_network": "192.168.1.100",
      "video_bitrate": 2400000,
      "audio_bitrate": 128000,
      "buffer_size": 4800000,
      "resolution": "1280x720",
      "service_id": 1002,
      "video_pid": 201,
      "audio_pid": 202,
      "pmt_pid": 4097,
      "pcr_pid": 257,
      "muxrate": 3000000
    }
  ]
}
```

**Request Body (HLS Input Channel):**
```json
{
  "name": "News Channel HLS",
  "input_type": "hls",
  "input_url": "https://example.com/stream/playlist.m3u8",
  "is_abr": true,
  "video_codec": "libx264",
  "audio": "aac",
  "audio_gain": 1.0,
  "bitrate_mode": "vbr",
  "scan_type": "progressive",
  "frame_rate": 25,
  "aspect_ratio": "16:9",
  "abr_profiles": [
    {
      "output_type": "hls",
      "output_url": "/media/output/news_1080p.m3u8",
      "video_bitrate": 4000000,
      "audio_bitrate": 192000,
      "buffer_size": 8000000,
      "resolution": "1920x1080",
      "service_id": 2001,
      "video_pid": 301,
      "audio_pid": 302,
      "pmt_pid": 4098,
      "pcr_pid": 258,
      "muxrate": 5000000
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "HD Sports Channel",
  "input_type": "udp",
  "input_multicast_ip": "239.1.1.10:5000",
  "input_network": "192.168.1.100",
  "is_abr": true,
  "video_codec": "libx264",
  "audio": "aac",
  "audio_gain": 1.0,
  "bitrate_mode": "cbr",
  "scan_type": "progressive",
  "frame_rate": 30,
  "aspect_ratio": "16:9",
  "logo_path": "/media/logos/sports_logo.png",
  "logo_position": "x=W-w-10:y=10",
  "logo_opacity": 0.9,
  "status": "stopped",
  "job_id": 2,
  "error_message": null,
  "abr_profiles": [...]
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/channels/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Channel",
    "input_type": "udp",
    "input_multicast_ip": "239.1.1.1:5000",
    "input_network": "192.168.1.100",
    "is_abr": true,
    "video_codec": "libx264",
    "audio": "aac",
    "frame_rate": 30,
    "aspect_ratio": "16:9",
    "abr_profiles": [...]
  }'
```

**Validation Rules:**
- `name` must be unique
- When `is_abr=true`:
  - Must provide at least one ABR profile
  - Channel-level output/encoding fields must be null
- When `is_abr=false`:
  - Must provide all encoding parameters at channel level
  - No ABR profiles should be provided
- Input type validation:
  - `udp`: requires `input_multicast_ip` and `input_network`
  - `hls`: requires `input_url`
  - `file`: requires `input_file`

---

### Get Channel Details

Retrieve details of a specific channel by ID.

**Endpoint:** `GET /api/channels/{id}/`

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Channel 1",
  "input_type": "udp",
  "input_multicast_ip": "239.1.1.1:5000",
  "input_network": "192.168.1.100",
  "is_abr": true,
  "video_codec": "libx264",
  "audio": "aac",
  "status": "running",
  "job_id": 1,
  "abr_profiles": [...]
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:8000/api/channels/1/
```

---

### Update Channel

Update an existing channel configuration.

**Endpoint:** `PUT /api/channels/{id}/` or `PATCH /api/channels/{id}/`

**Request Body (Partial Update):**
```json
{
  "logo_opacity": 0.7,
  "audio_gain": 1.2
}
```

**Response:** `200 OK`

**Example cURL:**
```bash
curl -X PATCH http://localhost:8000/api/channels/1/ \
  -H "Content-Type: application/json" \
  -d '{"audio_gain": 1.2}'
```

**Note:** When updating ABR profiles, all existing profiles will be deleted and replaced with the new ones provided.

---

### Delete Channel

Delete a channel and its associated transcoding job.

**Endpoint:** `DELETE /api/channels/{id}/`

**Response:** `204 No Content`

**Example cURL:**
```bash
curl -X DELETE http://localhost:8000/api/channels/1/
```

---

## Transcoding Job Management

### List All Transcoding Jobs

Retrieve a list of all transcoding jobs.

**Endpoint:** `GET /api/jobs/`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "channel": 1,
    "status": "running",
    "start_time": "2026-01-26T10:00:00Z",
    "end_time": null,
    "ffmpeg_pid": 12345,
    "error_message": null
  },
  {
    "id": 2,
    "channel": 2,
    "status": "stopped",
    "start_time": "2026-01-26T09:30:00Z",
    "end_time": "2026-01-26T10:15:00Z",
    "ffmpeg_pid": null,
    "error_message": null
  }
]
```

**Example cURL:**
```bash
curl -X GET http://localhost:8000/api/jobs/
```

**Status Values:**
- `pending`: Job is starting, waiting for FFmpeg to initialize
- `running`: FFmpeg process is actively transcoding
- `stopped`: Job was manually stopped
- `error`: Job encountered an error
- `completed`: Job finished successfully (rarely used for continuous streams)

---

### Get Job Details

Retrieve details of a specific transcoding job.

**Endpoint:** `GET /api/jobs/{id}/`

**Response:** `200 OK`
```json
{
  "id": 1,
  "channel": 1,
  "status": "running",
  "start_time": "2026-01-26T10:00:00Z",
  "end_time": null,
  "ffmpeg_pid": 12345,
  "error_message": null
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:8000/api/jobs/1/
```

---

### Create Transcoding Job

Create a new transcoding job for a channel.

**Endpoint:** `POST /api/jobs/`

**Request Body:**
```json
{
  "channel": 1
}
```

**Response:** `201 Created`
```json
{
  "id": 3,
  "channel": 1,
  "status": "stopped",
  "start_time": "2026-01-26T10:30:00Z",
  "end_time": null,
  "ffmpeg_pid": null,
  "error_message": null
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Content-Type: application/json" \
  -d '{"channel": 1}'
```

**Note:** Each channel can have only one associated transcoding job (OneToOne relationship).

---

## Job Control

### Start Transcoding Job

Start a transcoding job. This triggers the Celery task to launch the FFmpeg process.

**Endpoint:** `POST /api/job/{id}/start/`

**Response:** `200 OK`
```json
{
  "message": "Job 1 started"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Transcoding job not found"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/job/1/start/
```

**Behavior:**
- Triggers `transcoding_start.delay(job_id)` Celery task
- Creates FFmpeg process with configured parameters
- Sets job status to `pending`, then `running` when FFmpeg starts outputting
- Saves FFmpeg process PID to the job
- Implements automatic retry logic (up to 5 retries by default)
- Creates log file at `logs/channels/{channel_name}.log`

---

### Stop Transcoding Job

Stop a running transcoding job. This terminates the FFmpeg process.

**Endpoint:** `POST /api/job/{id}/stop/`

**Response:** `200 OK`
```json
{
  "message": "Job 1 Stopped"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Transcoding job not found"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/job/1/stop/
```

**Behavior:**
- Triggers `transcoding_stop.delay(job_id)` Celery task
- Sends SIGTERM to FFmpeg process
- If process doesn't exit within 5 seconds, sends SIGKILL
- Sets job status to `stopped`
- Clears FFmpeg PID from job record

---

## System Monitoring

### Get Network Interfaces

Retrieve all network interfaces available on the system with their IP addresses.

**Endpoint:** `GET /api/netiface/`

**Response:** `200 OK`
```json
[
  {
    "name": "Ethernet",
    "ip_addresses": "192.168.1.100"
  },
  {
    "name": "Wi-Fi",
    "ip_addresses": "192.168.1.101"
  },
  {
    "name": "Loopback Pseudo-Interface 1",
    "ip_addresses": "127.0.0.1"
  }
]
```

**Example cURL:**
```bash
curl -X GET http://localhost:8000/api/netiface/
```

**Use Case:** This endpoint is useful for populating dropdown menus when configuring input/output network interfaces for channels.

---

### Get System Metrics

Retrieve real-time system performance metrics.

**Endpoint:** `GET /api/metrics/`

**Response:** `200 OK`
```json
{
  "cpu_usage": 45.2,
  "ram_usage": 62.8,
  "network": {
    "in_mbps": 12.5,
    "out_mbps": 8.3
  }
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:8000/api/metrics/
```

**Metrics Description:**
- `cpu_usage`: CPU utilization percentage (0-100)
- `ram_usage`: RAM utilization percentage (0-100)
- `network.in_mbps`: Incoming network bandwidth in Mbps
- `network.out_mbps`: Outgoing network bandwidth in Mbps

**Note:** This endpoint has a built-in 1-second delay to calculate network bandwidth, so response time will be ~1.5 seconds.

---

## Data Models

### Channel Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | Auto | Primary key |
| `name` | String | Yes | Unique channel name (max 255 chars) |
| `input_type` | Choice | Yes | Input type: `hls`, `udp`, `file` |
| `input_url` | String | Conditional | HLS input URL (required if input_type=hls) |
| `input_multicast_ip` | String | Conditional | Multicast IP:Port (required if input_type=udp) |
| `input_network` | String | Conditional | Network interface IP (required if input_type=udp) |
| `input_file` | String | Conditional | File path (required if input_type=file) |
| `is_abr` | Boolean | Yes | Enable ABR mode (default: true) |
| `output_type` | Choice | Conditional | Output type: `hls`, `rtmp`, `udp`, `file` (null if is_abr=true) |
| `output_url` | String | Conditional | Output URL for HLS/RTMP |
| `output_multicast_ip` | String | Conditional | Output multicast IP:Port for UDP |
| `output_network` | String | Conditional | Output network interface |
| `output_file` | String | Conditional | Output file path |
| `video_codec` | Choice | Yes | Video codec: `libx264`, `libx265`, `mpeg2video` |
| `audio` | Choice | Yes | Audio codec: `aac`, `ac3`, `mp2` |
| `audio_gain` | Float | No | Audio volume multiplier (0.1-10, default: 1.0) |
| `bitrate_mode` | Choice | Yes | Bitrate mode: `cbr`, `vbr` (default: vbr) |
| `video_bitrate` | Integer | Conditional | Video bitrate in bps (null if is_abr=true) |
| `audio_bitrate` | Integer | Conditional | Audio bitrate in bps (null if is_abr=true) |
| `buffer_size` | Integer | Conditional | Buffer size in bytes (null if is_abr=true) |
| `scan_type` | Choice | Yes | Scan type: `progressive`, `interlaced` |
| `resolution` | Choice | Conditional | Video resolution (null if is_abr=true) |
| `frame_rate` | Integer | Yes | Frame rate: 24, 25, 30, 50, 60 |
| `service_id` | Integer | Conditional | MPEG-TS service ID (1-9999) |
| `video_pid` | Integer | Conditional | Video PID for MPEG-TS |
| `audio_pid` | Integer | Conditional | Audio PID for MPEG-TS |
| `aspect_ratio` | Choice | Yes | Aspect ratio: `16:9`, `4:3` |
| `pmt_pid` | Integer | Conditional | PMT PID (32-8186) |
| `pcr_pid` | Integer | Conditional | PCR PID (32-8186) |
| `logo_path` | String | No | Path to logo image file |
| `logo_position` | String | No | Logo position (e.g., "x=10:y=10" or "x=W-w-10:y=H-h-10") |
| `logo_opacity` | Float | No | Logo opacity (0.1-1.0, default: 1.0) |

### ABR Profile Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | Auto | Primary key |
| `channel` | ForeignKey | Yes | Associated channel |
| `output_type` | Choice | Yes | Output type: `hls`, `rtmp`, `udp`, `file` |
| `output_url` | String | Conditional | Output URL |
| `output_multicast_ip` | String | Conditional | Multicast IP:Port |
| `output_network` | String | Conditional | Network interface |
| `video_bitrate` | Integer | Yes | Video bitrate in bps (1000-10000000) |
| `audio_bitrate` | Integer | Yes | Audio bitrate in bps (32000-256000) |
| `buffer_size` | Integer | Yes | Buffer size in bytes |
| `resolution` | Choice | Yes | Video resolution |
| `service_id` | Integer | Yes | MPEG-TS service ID (1-9999) |
| `video_pid` | Integer | Yes | Video PID |
| `audio_pid` | Integer | Yes | Audio PID |
| `pmt_pid` | Integer | Yes | PMT PID (32-8186) |
| `pcr_pid` | Integer | Yes | PCR PID (32-8186) |
| `muxrate` | Integer | Yes | Mux rate (10000-50000000) |

### Transcoding Job Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | Auto | Primary key |
| `channel` | OneToOneField | Yes | Associated channel |
| `status` | Choice | Yes | Job status: `pending`, `running`, `completed`, `error`, `stopped` |
| `start_time` | DateTime | Auto | Job creation time |
| `end_time` | DateTime | No | Job end time |
| `ffmpeg_pid` | Integer | No | FFmpeg process ID |
| `error_message` | Text | No | Error details if status=error |

---

## Error Handling

### Validation Errors

**Status Code:** `400 Bad Request`

**Response Format:**
```json
{
  "field_name": [
    "Error message describing the validation failure"
  ]
}
```

**Example:**
```json
{
  "input_multicast_ip": [
    "Enter a valid multicast address like '239.x.x.x:port'. IP must be 224.0.0.0-239.255.255.255 and port between 1-60000."
  ],
  "abr_profiles": [
    "At least one ABR profile is required when is_abr=True."
  ]
}
```

### Not Found Errors

**Status Code:** `404 Not Found`

**Response Format:**
```json
{
  "detail": "Not found."
}
```

### Server Errors

**Status Code:** `500 Internal Server Error`

**Response Format:**
```json
{
  "detail": "A server error occurred."
}
```

---

## Common Use Cases

### Example 1: Create and Start a UDP to UDP ABR Channel

```bash
# Step 1: Create the channel
curl -X POST http://localhost:8000/api/channels/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Live Sports HD",
    "input_type": "udp",
    "input_multicast_ip": "239.1.1.50:5000",
    "input_network": "192.168.1.100",
    "is_abr": true,
    "video_codec": "libx264",
    "audio": "aac",
    "audio_gain": 1.0,
    "bitrate_mode": "cbr",
    "scan_type": "progressive",
    "frame_rate": 30,
    "aspect_ratio": "16:9",
    "abr_profiles": [
      {
        "output_type": "udp",
        "output_multicast_ip": "239.2.1.50:6000",
        "output_network": "192.168.1.100",
        "video_bitrate": 4800000,
        "audio_bitrate": 192000,
        "buffer_size": 9600000,
        "resolution": "1920x1080",
        "service_id": 1001,
        "video_pid": 101,
        "audio_pid": 102,
        "pmt_pid": 4096,
        "pcr_pid": 256,
        "muxrate": 6000000
      },
      {
        "output_type": "udp",
        "output_multicast_ip": "239.2.1.51:6001",
        "output_network": "192.168.1.100",
        "video_bitrate": 2400000,
        "audio_bitrate": 128000,
        "buffer_size": 4800000,
        "resolution": "1280x720",
        "service_id": 1002,
        "video_pid": 201,
        "audio_pid": 202,
        "pmt_pid": 4097,
        "pcr_pid": 257,
        "muxrate": 3000000
      }
    ]
  }'

# Response will include job_id, let's say it's 5

# Step 2: Start the transcoding job
curl -X POST http://localhost:8000/api/job/5/start/

# Step 3: Monitor the job status
curl -X GET http://localhost:8000/api/jobs/5/

# Step 4: Check system metrics
curl -X GET http://localhost:8000/api/metrics/

# Step 5: Stop the job when done
curl -X POST http://localhost:8000/api/job/5/stop/
```

### Example 2: HLS Input to HLS Output

```bash
curl -X POST http://localhost:8000/api/channels/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "News Channel",
    "input_type": "hls",
    "input_url": "https://example.com/live/news.m3u8",
    "is_abr": true,
    "video_codec": "libx264",
    "audio": "aac",
    "frame_rate": 25,
    "aspect_ratio": "16:9",
    "bitrate_mode": "vbr",
    "scan_type": "progressive",
    "logo_path": "/media/logos/news_logo.png",
    "logo_position": "x=W-w-20:y=20",
    "logo_opacity": 0.9,
    "abr_profiles": [
      {
        "output_type": "hls",
        "output_url": "/media/output/news_hd.m3u8",
        "video_bitrate": 4000000,
        "audio_bitrate": 192000,
        "buffer_size": 8000000,
        "resolution": "1920x1080",
        "service_id": 2001,
        "video_pid": 301,
        "audio_pid": 302,
        "pmt_pid": 4098,
        "pcr_pid": 258,
        "muxrate": 5000000
      }
    ]
  }'
```

---

## Notes

1. **Celery Requirement:** The start/stop job endpoints require Celery and Redis to be running. Start Celery worker with:
   ```bash
   celery -A transcoder_system worker --loglevel=info
   ```

2. **Log Files:** FFmpeg logs are stored in `backend/logs/channels/{channel_name}.log`. Log files are automatically truncated when they exceed 10MB.

3. **Automatic Retry:** Jobs automatically retry up to 5 times if FFmpeg crashes. This can be configured in `tasks.py`.

4. **Process Management:** The system tracks FFmpeg PIDs and validates that processes are actually FFmpeg before attempting to stop them.

5. **Multicast Validation:** Multicast IPs must be in the range 224.0.0.0-239.255.255.255 with ports 1-60000.

6. **Logo Positioning:** Logo positions use FFmpeg overlay syntax. Examples:
   - `x=10:y=10` - 10 pixels from top-left
   - `x=W-w-10:y=10` - 10 pixels from top-right
   - `x=10:y=H-h-10` - 10 pixels from bottom-left
   - `x=W-w-10:y=H-h-10` - 10 pixels from bottom-right
