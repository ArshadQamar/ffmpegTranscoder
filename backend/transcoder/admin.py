from django.contrib import admin
from .models import Channel,TranscodingJob

# Register your models here.
admin.site.register(Channel)
admin.site.register(TranscodingJob)
