from rest_framework import serializers
from .models import TranscodingJob,Channel

class TranscodingJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscodingJob
        fields = "__all__"

class ChannelSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    job_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Channel
        exclude = ['created_at', 'updated_at']

    #Getting status from job db
    def get_status(self, obj):
        # Check if the channel has a job
        if hasattr(obj, 'jobs'):
            return obj.jobs.status
        return None

    #getting id from job db
    def get_job_id(self,obj):
        if hasattr(obj, 'jobs'):
            return obj.jobs.id
        return None