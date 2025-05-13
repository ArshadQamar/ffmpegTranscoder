from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import TranscodingJob, Channel

@receiver(post_save, sender=Channel)
def create_transcoding_job(sender, instance, created, **kwarg):
    if created:
        TranscodingJob.objects.create(channel=instance, status='pending')