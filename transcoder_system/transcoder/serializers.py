from rest_framework import serializers
from .models import TranscodingJob,Channel

class TranscodingJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscodingJob
        fields = "__all__"

class ChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = "__all__"