# FFmpeg Transcoder – Deployment Documentation

This document describes the **deployment procedure** for the FFmpeg Transcoder application, written **exactly in the sequence used during real server deployments**. The order matters to ensure configuration is completed **before** containers are started.

---

## 1. Overview

The application consists of:

- **Backend**: Django API with FFmpeg and Celery workers  
- **Frontend**: Web-based UI  
- **Database**: SQLite (persistent volume)  
- **Reverse Proxy**: Nginx  
- **Container Runtime**: Docker  

All persistent data is stored under `/opt/ffmpegTranscoder`.

---

## 2. Prerequisites

- Ubuntu 22.04  
- Docker Engine  
- Git  
- Nginx  
- Internet access (Docker Hub)

---

## 3. Clone Repository in /opt

```bash
cd /opt
git clone <REPOSITORY_URL> 
cd ffmpegTranscoder
```

---


## 4. Install and Configure Nginx

### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ffmpeg_app
```

```nginx
server {
    listen 80;
    server_name _;

    location ~ ^/api/?$ {
        return 403;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:

```bash
sudo unlink /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/ffmpeg_app /etc/nginx/sites-enabled/ffmpeg_app
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Update Django ALLOWED_HOSTS

```python
ALLOWED_HOSTS = ["<SERVER_IP>", "<DOMAIN_NAME>", "localhost"]
```

---

## 6. Create Frontend Environment File

```bash
nano frontend/.env.local
```

```env
NEXT_PUBLIC_BACKEND_API_BASE_URL=http://<SERVER_IP>/api
```

---

## 7. Prepare Backend Volumes

```bash
mkdir -p /opt/ffmpegTranscoder/backend/{media,logs}
touch /opt/ffmpegTranscoder/backend/db.sqlite3
chmod 664 /opt/ffmpegTranscoder/backend/db.sqlite3
chmod -R 775 /opt/ffmpegTranscoder/backend/{media,logs}
```

---

## 8. Build Docker Images
- Navigate to the folder where relevant Dockerfile is present then run the relevant command from below

```bash
docker build -f Dockerfile.backend -t ffmpeg-backend .
docker build -f Dockerfile.frontend -t ffmpeg-frontend .
```

---

## 9. Start Backend Containers

```bash
docker run -d --name ffmpeg-backend --network host  -v /opt/ffmpegTranscoder/backend/db.sqlite3:/app/db.sqlite3  -v /opt/ffmpegTranscoder/backend/media:/app/media  -v /opt/ffmpegTranscoder/backend/logs:/app/logs  ffmpeg-backend
```

```bash
docker run -d --name ffmpeg-backend-celery --network host  -v /opt/ffmpegTranscoder/backend/db.sqlite3:/app/db.sqlite3  -v /opt/ffmpegTranscoder/backend/media:/app/media  -v /opt/ffmpegTranscoder/backend/logs:/app/logs  ffmpeg-backend celery -A transcoder_system worker -l info  --logfile=/app/logs/celery.log
```

---

## 10. Start Frontend Container

```bash
docker run -d -it --name frontend -p 3000:3000 ffmpeg-frontend
```

---

## 11. Verification

```bash
docker ps
docker logs ffmpeg-backend
docker logs ffmpeg-backend-celery
```

---

**End of Document**