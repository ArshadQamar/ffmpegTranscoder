# Architecture Overview

## System Architecture

The FFmpeg Transcoder System is a full-stack application for managing and executing video transcoding jobs using FFmpeg. It consists of a Django REST API backend, a Next.js frontend, and Celery for asynchronous task processing.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                     http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Django REST Framework                         │
│                     http://localhost:8000                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Views      │  │ Serializers  │  │   Models     │          │
│  │              │  │              │  │              │          │
│  │ - Channels   │  │ - Channel    │  │ - Channel    │          │
│  │ - Jobs       │  │ - Job        │  │ - ABR        │          │
│  │ - Metrics    │  │ - ABR        │  │ - Job        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│    SQLite Database        │  │   Celery + Redis         │
│                           │  │                          │
│  - Channels               │  │  - Task Queue            │
│  - ABR Profiles           │  │  - Job Processing        │
│  - Transcoding Jobs       │  │  - Retry Logic           │
└───────────────────────────┘  └──────────┬───────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │   FFmpeg Processes     │
                              │                        │
                              │  - Video Encoding      │
                              │  - Audio Processing    │
                              │  - Stream Muxing       │
                              └────────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │   Output Streams       │
                              │                        │
                              │  - UDP Multicast       │
                              │  - HLS Files           │
                              │  - RTMP Streams        │
                              └────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend (Next.js)

**Location:** `frontend/`

**Technology Stack:**
- Next.js 15+ (React framework)
- React 19+
- Tailwind CSS (if configured)

**Key Features:**
- Channel management interface
- Job control (start/stop)
- Real-time system metrics display
- Network interface selection

**API Integration:**
- Communicates with backend via REST API
- Base URL configured in environment or axios configuration

---

### 2. Backend (Django)

**Location:** `backend/`

#### 2.1 Django Project Structure

```
backend/
├── transcoder_system/       # Main project directory
│   ├── settings.py          # Django settings
│   ├── urls.py              # Root URL configuration
│   ├── celery.py            # Celery configuration
│   ├── wsgi.py              # WSGI application
│   └── asgi.py              # ASGI application
├── transcoder/              # Main app
│   ├── models.py            # Data models
│   ├── views.py             # API views
│   ├── serializers.py       # DRF serializers
│   ├── tasks.py             # Celery tasks (FFmpeg logic)
│   ├── urls.py              # App URL routing
│   ├── signals.py           # Django signals
│   └── admin.py             # Django admin config
├── dashboard/               # Dashboard app (optional)
├── media/                   # User uploads
├── logs/                    # FFmpeg logs
│   └── channels/            # Per-channel log files
├── manage.py                # Django management script
└── requirements.txt         # Python dependencies
```

#### 2.2 Key Files

**models.py** - Defines three main models:
- `Channel`: Stores channel configuration (input, output, encoding settings)
- `ABR`: Stores ABR profile configurations (linked to Channel)
- `TranscodingJob`: Tracks job status and FFmpeg process

**views.py** - API endpoints:
- `TranscodingJobListView`: List/create jobs
- `TranscodingJobDetailView`: Get job details
- `ChannelListCreateView`: List/create channels
- `ChannelDetailView`: Get/update/delete channel
- `StartTranscodingJob`: Start a job
- `StopTranscodingJob`: Stop a job
- `NetworkInterfaceView`: Get network interfaces
- `SystemMetricsView`: Get system metrics

**serializers.py** - Data validation and serialization:
- `ChannelSerializer`: Validates channel data, handles ABR profiles
- `ABRSerializer`: Validates ABR profile data
- `TranscodingJobSerializer`: Serializes job data

**tasks.py** - Celery tasks (the heart of the system):
- `transcoding_start()`: Builds and executes FFmpeg command
- `transcoding_stop()`: Terminates FFmpeg process
- Helper functions for process management and logging

---

### 3. Database (SQLite)

**File:** `backend/db.sqlite3`

**Schema:**

```sql
-- Channel table
CREATE TABLE transcoder_channel (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    input_type VARCHAR(10),
    input_url VARCHAR(500),
    input_multicast_ip VARCHAR(50),
    input_network VARCHAR(100),
    input_file VARCHAR(500),
    is_abr BOOLEAN,
    output_type VARCHAR(10),
    -- ... (many more fields)
    created_at DATETIME,
    updated_at DATETIME
);

-- ABR profile table
CREATE TABLE transcoder_abr (
    id INTEGER PRIMARY KEY,
    channel_id INTEGER REFERENCES transcoder_channel(id),
    output_type VARCHAR(10),
    output_multicast_ip VARCHAR(50),
    video_bitrate INTEGER,
    audio_bitrate INTEGER,
    resolution VARCHAR(10),
    -- ... (more fields)
);

-- Transcoding job table
CREATE TABLE transcoder_transcodingjob (
    id INTEGER PRIMARY KEY,
    channel_id INTEGER UNIQUE REFERENCES transcoder_channel(id),
    status VARCHAR(20),
    start_time DATETIME,
    end_time DATETIME,
    ffmpeg_pid INTEGER,
    error_message TEXT
);
```

**Relationships:**
- Channel ↔ TranscodingJob: One-to-One
- Channel → ABR: One-to-Many

---

### 4. Task Queue (Celery + Redis)

**Celery Configuration:** `backend/transcoder_system/celery.py`

**Broker:** Redis (localhost:6379)

**Task Flow:**

```
API Request → Celery Task Queue → Worker Process → FFmpeg Execution
     ↓                                                      ↓
  Return 200 OK                                    Update Job Status
```

**Key Features:**
- Asynchronous job execution
- Automatic retry on failure (up to 5 times)
- Process monitoring and logging
- Graceful shutdown handling

**Starting Celery:**
```bash
celery -A transcoder_system worker --loglevel=info
```

---

### 5. FFmpeg Process Management

#### Process Lifecycle

```
Start Request → Create FFmpeg Command → Launch Process → Monitor Logs
                                              ↓
                                        Save PID to DB
                                              ↓
                                    Wait for "running" status
                                              ↓
                                    Stream logs to file
                                              ↓
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                        Process Running                  Process Crashed
                              │                               │
                              │                               ▼
                              │                         Retry (up to 5x)
                              │                               │
                              ▼                               ▼
                        Stop Request                    Max Retries
                              │                               │
                              ▼                               ▼
                        SIGTERM → SIGKILL              Set status=error
                              │
                              ▼
                        Clear PID, status=stopped
```

#### Watchdog Mechanism

- **Timeout:** 15 seconds
- **Purpose:** Kill FFmpeg if no logs appear (indicates startup failure)
- **Action:** Sets job status to 'error'

#### Log Management

- **Location:** `backend/logs/channels/{channel_name}.log`
- **Max Size:** 10 MB (auto-truncated)
- **Format:** Timestamped FFmpeg output
- **Includes:** Full FFmpeg command at start

---

## Data Flow

### Creating and Starting a Channel

```
1. User creates channel via frontend
   ↓
2. POST /api/channels/ with channel config
   ↓
3. ChannelSerializer validates data
   ↓
4. Channel and ABR profiles saved to DB
   ↓
5. TranscodingJob auto-created (via signal)
   ↓
6. User clicks "Start" button
   ↓
7. POST /api/job/{id}/start/
   ↓
8. transcoding_start.delay(job_id) queued in Celery
   ↓
9. Celery worker picks up task
   ↓
10. Build FFmpeg command from channel config
   ↓
11. Launch FFmpeg subprocess
   ↓
12. Save PID, set status='pending'
   ↓
13. Stream logs in background thread
   ↓
14. Detect "frame=" in logs → status='running'
   ↓
15. FFmpeg continues until stopped or crashed
```

### Stopping a Channel

```
1. User clicks "Stop" button
   ↓
2. POST /api/job/{id}/stop/
   ↓
3. transcoding_stop.delay(job_id) queued
   ↓
4. Celery worker picks up task
   ↓
5. Set stop signal for job
   ↓
6. Send SIGTERM to FFmpeg PID
   ↓
7. Wait 5 seconds
   ↓
8. If still running → SIGKILL
   ↓
9. Clear PID, set status='stopped'
```

---

## Configuration Files

### Backend Configuration

**settings.py** - Key settings:
```python
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CORS_ALLOW_ALL_ORIGINS = True
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

**celery.py** - Celery setup:
```python
app = Celery('transcoder_system')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### Frontend Configuration

**next.config.mjs** - Next.js configuration
**package.json** - Dependencies and scripts

---

## Security Considerations

### Current State

⚠️ **Warning:** The current implementation has minimal security:

1. **No Authentication:** API endpoints are open to all
2. **CORS:** Allows all origins
3. **Debug Mode:** DEBUG=True in settings
4. **Secret Key:** Hardcoded in settings.py
5. **No HTTPS:** Running on HTTP

### Production Recommendations

1. **Enable Authentication:**
   ```python
   # In views.py
   permission_classes = [IsAuthenticated]
   ```

2. **Configure CORS:**
   ```python
   CORS_ALLOWED_ORIGINS = [
       'https://yourdomain.com',
   ]
   ```

3. **Disable Debug:**
   ```python
   DEBUG = False
   ALLOWED_HOSTS = ['yourdomain.com']
   ```

4. **Use Environment Variables:**
   ```python
   SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
   ```

5. **Add Rate Limiting:**
   ```python
   # Use django-ratelimit or DRF throttling
   ```

6. **Input Validation:**
   - Already implemented via serializers
   - Multicast IP validation
   - PID range validation

---

## Scaling Considerations

### Current Limitations

- **Single Server:** All components on one machine
- **SQLite:** Not suitable for high concurrency
- **No Load Balancing:** Single Django instance

### Scaling Strategies

1. **Database:**
   - Migrate to PostgreSQL or MySQL
   - Enable connection pooling

2. **Celery Workers:**
   - Run multiple workers on different machines
   - Use dedicated machines for encoding

3. **Redis:**
   - Use Redis Sentinel for high availability
   - Consider Redis Cluster for larger deployments

4. **Django:**
   - Deploy with Gunicorn/uWSGI
   - Use Nginx as reverse proxy
   - Enable caching (Redis/Memcached)

5. **FFmpeg:**
   - Distribute jobs across multiple encoding servers
   - Use hardware acceleration (NVENC, QSV, VAAPI)
   - Implement job prioritization

---

## Monitoring and Logging

### Application Logs

- **Django:** Console output or file logging
- **Celery:** Worker console output
- **FFmpeg:** Per-channel log files in `logs/channels/`

### System Metrics

Available via `/api/metrics/`:
- CPU usage
- RAM usage
- Network bandwidth (in/out)

### Process Monitoring

- FFmpeg PID tracking in database
- Process validation before stop operations
- Automatic retry on process failure

### Recommended Tools

- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerting:** PagerDuty, Slack webhooks
- **APM:** New Relic, DataDog

---

## Deployment Architecture

### Development Setup

```
┌─────────────────────────────────────────────┐
│           Developer Machine                  │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Django   │  │ Celery   │  │  Redis    │ │
│  │ :8000    │  │ Worker   │  │  :6379    │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                              │
│  ┌──────────┐                                │
│  │ Next.js  │                                │
│  │ :3000    │                                │
│  └──────────┘                                │
└─────────────────────────────────────────────┘
```

### Production Setup (Recommended)

```
                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │  Django Server 1 │      │  Django Server 2 │
    │  (Gunicorn)      │      │  (Gunicorn)      │
    └────────┬─────────┘      └────────┬─────────┘
             │                         │
             └────────────┬────────────┘
                          ▼
                 ┌─────────────────┐
                 │   PostgreSQL    │
                 └─────────────────┘

    ┌──────────────────┐      ┌──────────────────┐
    │ Celery Worker 1  │      │ Celery Worker 2  │
    │ (Encoding)       │      │ (Encoding)       │
    └────────┬─────────┘      └────────┬─────────┘
             │                         │
             └────────────┬────────────┘
                          ▼
                 ┌─────────────────┐
                 │  Redis Cluster  │
                 └─────────────────┘

              ┌──────────────────┐
              │   Next.js        │
              │   (Static)       │
              └──────────────────┘
```

---

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Backend Framework | Django | 4.2+ | REST API, ORM, Admin |
| API Framework | Django REST Framework | 3.14+ | RESTful API endpoints |
| Task Queue | Celery | 5.3+ | Async job processing |
| Message Broker | Redis | 7.0+ | Task queue backend |
| Database | SQLite | 3.x | Data persistence (dev) |
| Frontend Framework | Next.js | 15+ | React-based UI |
| UI Library | React | 19+ | Component-based UI |
| Video Processing | FFmpeg | 4.4+ | Transcoding engine |
| System Monitoring | psutil | 5.9+ | CPU/RAM/Network metrics |
| CORS | django-cors-headers | 4.0+ | Cross-origin requests |

---

## File Structure Reference

```
transcoder/
├── backend/
│   ├── transcoder_system/      # Django project
│   │   ├── __init__.py
│   │   ├── settings.py         # Configuration
│   │   ├── urls.py             # Root URLs
│   │   ├── celery.py           # Celery config
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── transcoder/             # Main app
│   │   ├── models.py           # Channel, ABR, Job models
│   │   ├── views.py            # API views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── tasks.py            # FFmpeg logic ⭐
│   │   ├── urls.py             # App URLs
│   │   ├── signals.py          # Auto-create jobs
│   │   └── admin.py
│   ├── dashboard/              # Optional dashboard
│   ├── media/                  # Uploads
│   ├── logs/                   # FFmpeg logs
│   │   └── channels/
│   ├── db.sqlite3              # Database
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   └── next.config.mjs
├── docs/                       # Documentation
│   ├── API_REFERENCE.md
│   ├── FFMPEG_CUSTOMIZATION_GUIDE.md
│   └── ARCHITECTURE.md
└── README.md
```

---

## Key Design Decisions

### 1. Why Celery?

- FFmpeg processes are long-running
- API should respond immediately
- Need retry logic for failed jobs
- Allows distributed processing

### 2. Why SQLite?

- Simple development setup
- No additional server required
- Sufficient for small-scale deployments
- Easy to migrate to PostgreSQL later

### 3. Why ABR Model?

- Supports adaptive bitrate streaming
- Single input → multiple outputs
- Efficient resource usage
- Industry standard for streaming

### 4. Why OneToOne for Jobs?

- Each channel has exactly one job
- Simplifies job management
- Clear status tracking
- Prevents duplicate jobs

### 5. Why Separate Logs?

- Per-channel debugging
- Log rotation per channel
- Easy troubleshooting
- Prevents log file bloat

---

## Extension Points

The system is designed to be extended in several ways:

1. **New Input Types:** Add to `INPUT_TYPES` in models.py, update tasks.py
2. **New Output Types:** Add to `OUTPUT_TYPES`, update FFmpeg command generation
3. **New Codecs:** Add to codec choices, update encoding parameters
4. **Custom Filters:** Modify filter_complex in tasks.py
5. **Authentication:** Add DRF authentication classes
6. **Webhooks:** Add signals to notify external systems
7. **Scheduling:** Use Celery Beat for scheduled jobs
8. **Multi-tenancy:** Add user/organization models

---

## Performance Characteristics

### Resource Usage (per 1080p stream)

- **CPU:** 50-80% of one core (software encoding)
- **RAM:** 200-500 MB per FFmpeg process
- **Network:** Depends on bitrate (typically 5-10 Mbps)
- **Disk I/O:** Minimal (logs only, unless file output)

### Scaling Limits

- **Single Server:** 5-10 concurrent 1080p streams
- **With Hardware Encoding:** 20-30 concurrent streams
- **Distributed:** Limited by network and encoding capacity

---

## Troubleshooting Guide

### Common Issues

1. **Celery not processing tasks**
   - Check Redis is running
   - Verify Celery worker is started
   - Check Celery logs for errors

2. **FFmpeg won't start**
   - Verify FFmpeg is installed
   - Check input source is accessible
   - Review generated command in logs

3. **Job stuck in "pending"**
   - Check FFmpeg logs
   - Verify input stream is active
   - Increase watchdog timeout

4. **High CPU usage**
   - Use hardware acceleration
   - Reduce encoding preset
   - Lower resolution/bitrate

5. **Network interface errors**
   - Verify interface IP is correct
   - Check multicast routing
   - Test with `ffplay` or VLC

---

## Next Steps for Development

1. **Add Authentication:** Implement JWT or session-based auth
2. **Add User Management:** Multi-user support
3. **Improve Frontend:** Real-time status updates (WebSockets)
4. **Add Scheduling:** Celery Beat for scheduled jobs
5. **Monitoring Dashboard:** Grafana integration
6. **Hardware Acceleration:** NVENC, QSV support
7. **Cloud Storage:** S3 integration for HLS output
8. **API Versioning:** /api/v1/, /api/v2/
9. **Testing:** Unit tests, integration tests
10. **Documentation:** API documentation with Swagger/OpenAPI
