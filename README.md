# FFmpeg Transcoder System

## Overview
A full-stack application for managing and automating video transcoding workflows. Features a Django backend for channel/job management and a Next.js frontend for user interaction.

---

## How It Works

1. **Channel Management**: Users can add, edit, or delete channels via the web interface or API. Each channel contains stream parameters and metadata (input/output URLs, audio/video settings, etc.).
2. **Transcoding Jobs**: Users can start or stop transcoding jobs for any channel. When a job is started, the backend launches an FFmpeg process with the channel's parameters. Job status is tracked in real time.
3. **Import/Export**: Channel configurations can be imported from or exported to JSON files, making it easy to back up or migrate settings.
4. **Frontend**: The Next.js frontend provides a dashboard for managing channels and jobs, with dark mode, responsive design, and branding.
5. **Backend**: The Django backend exposes REST APIs, manages the database, and uses Celery for background job control. All transcoding logic is handled by FFmpeg, invoked as a subprocess.

---

## Features
- Add, edit, and delete video channels
- Manage transcoding jobs
- Import/export channel configurations via JSON
- Responsive frontend with dark mode and branding

---

## Who Can Use This?
- Broadcast engineers
- DevOps/media teams
- System integrators
- Developers customizing transcoding workflows

---

## Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg installed and in PATH
- Django, Celery, and Python packages (`requirements.txt`)
- Next.js and JS packages (`frontend/package.json`)
- SQLite (default) or other DB

---

## Project Structure
```
transcoder_system/
  manage.py
  dashboard/         # Django app for dashboard
  transcoder/        # Django app for transcoding logic, models, API
  media/             # Uploaded and output files
frontend/
  app/               # Next.js pages and components
  public/            # Static assets (logo, icons)
requirements.txt
README.md
```

---

## API Reference

### Channel Endpoints
- `GET /api/channels/` — List all channels
- `POST /api/channels/` — Create a new channel
- `GET /api/channels/{id}/` — Get channel details
- `PUT /api/channels/{id}/` — Update channel
- `DELETE /api/channels/{id}/` — Delete channel

### Transcoding Job Endpoints
- `GET /api/jobs/` — List all jobs
- `POST /api/jobs/` — Start a new job
- `GET /api/jobs/{id}/` — Get job status
- `POST /api/jobs/{id}/stop/` — Stop a running job

### Import/Export
- `POST /api/channels/import/` — Import channels from JSON
- `GET /api/channels/export/` — Download all channels as JSON

---

## Example Usage

**Create a Channel:**
```sh
curl -X POST http://localhost:8000/api/channels/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Channel", "input_url": "rtmp://...", "output_url": "rtmp://..."}'
```

**Start a Job:**
```sh
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Content-Type: application/json" \
  -d '{"channel": 1}'
```

---

## Running the Project

### Backend
```sh
cd transcoder_system
python manage.py migrate
python manage.py runserver
celery -A transcoder_system worker --loglevel=info
```

### Frontend
```sh
cd frontend
npm install
npm run dev
```

---

## Customization
- Add fields: update `transcoder/models.py` and run migrations
- Change transcoding logic: edit `transcoder/tasks.py`
- Add endpoints: update `transcoder/views.py` and `urls.py`
- Customize frontend: edit files in `frontend/app/`

---

## Troubleshooting
- Check logs for errors
- Ensure FFmpeg is installed
- For DB issues, check `db.sqlite3` permissions or use another DB

---

## License
MIT

---

## Contact
For issues, contact the project maintainer.