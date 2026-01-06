from .celery import app as celery_app

# This ensures Celery starts when Django starts.
__all__ = ('celery_app',)
