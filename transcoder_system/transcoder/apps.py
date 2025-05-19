from django.apps import AppConfig


class TranscoderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transcoder'

    # Import signals so they get registered
    def ready(self):
        import transcoder.signals
