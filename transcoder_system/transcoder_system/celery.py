#Celery is an asynchronous task queue that helps us run background jobs without blocking the main web application.

import os
from celery import Celery

# if os.name == 'nt':  # Check if running on Windows
#     CELERY_WORKER_POOL = 'solo'


# Set default settings for Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcoder_system.settings')

# Create a Celery instance
app = Celery('transcoder_system')

# Set the pool to solo (for Windows)
if os.name == 'nt':  # Check if running on Windows
    app.conf.worker_pool = 'solo'


# Load Celery config from Django settings, using the CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all Django apps
app.autodiscover_tasks()

# task for debugging (this is just for testing).
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')