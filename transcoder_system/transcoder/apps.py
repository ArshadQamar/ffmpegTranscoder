import os
from django.apps import AppConfig

class TranscoderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transcoder'

    def ready(self):
        import transcoder.signals

        # Only run this once in main process
        if os.environ.get('RUN_MAIN') == 'true' and not os.environ.get('CHANNEL_RESTARTED'):
            os.environ['CHANNEL_RESTARTED'] = '1'  # Prevent double init

            from transcoder.models import TranscodingJob
            from transcoder.tasks import transcoding_start

            running_jobs = TranscodingJob.objects.filter(status='running')

            for job in running_jobs:
                print(f"Auto-restarting job: {job.channel.name}")
                transcoding_start.delay(job.id)
