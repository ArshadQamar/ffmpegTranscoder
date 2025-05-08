from rest_framework import serializers
from .models import TranscodingJob,Channel

class TranscodingJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscodingJob
        fields = "__all__"

class ChannelSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    class Meta:
        model = Channel
        fields = "__all__"

    def get_status(self, obj):
        # Check if the channel has a job
        if hasattr(obj, 'jobs'):
            return obj.jobs.status
        return None