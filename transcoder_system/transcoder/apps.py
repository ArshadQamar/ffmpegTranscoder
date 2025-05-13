from django.apps import AppConfig


class TranscoderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transcoder'

    def ready(self):
        # Import signals so they get registered
        import transcoder.signals
