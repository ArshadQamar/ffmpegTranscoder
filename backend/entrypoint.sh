#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Applying database migrations..."
#python manage.py makemigrations transcoder
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput
#nohup celery -A transcoder_system worker --loglevel=info > /var/log/celery.log 2>&1 &

echo "Starting server..."
exec "$@"

