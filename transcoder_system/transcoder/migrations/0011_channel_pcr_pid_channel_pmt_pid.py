# Generated by Django 4.2 on 2025-07-04 10:51

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transcoder', '0010_channel_aspect_ratio'),
    ]

    operations = [
        migrations.AddField(
            model_name='channel',
            name='pcr_pid',
            field=models.IntegerField(null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(9999)]),
        ),
        migrations.AddField(
            model_name='channel',
            name='pmt_pid',
            field=models.IntegerField(null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(9999)]),
        ),
    ]
