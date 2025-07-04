# Generated by Django 4.2 on 2025-06-25 06:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transcoder', '0005_channel_service_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='channel',
            name='audio_pid',
            field=models.IntegerField(default=102, help_text='Audio PID'),
        ),
        migrations.AddField(
            model_name='channel',
            name='video_pid',
            field=models.IntegerField(default=101, help_text='Video PID'),
        ),
    ]
