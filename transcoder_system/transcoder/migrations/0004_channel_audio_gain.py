# Generated by Django 4.2 on 2025-04-21 10:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transcoder', '0003_transcodingjob'),
    ]

    operations = [
        migrations.AddField(
            model_name='channel',
            name='audio_gain',
            field=models.FloatField(default=1.0, null=True),
        ),
    ]
