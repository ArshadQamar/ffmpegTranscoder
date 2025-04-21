from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import TranscodingJob, Channel
from .serializers import TranscodingJobSerializer, ChannelSerializer

# List all transcoding jobs
class TranscodingJobListView(generics.ListCreateAPIView):
    #permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = TranscodingJob.objects.all()  # Query all transcoding jobs
    serializer_class = TranscodingJobSerializer  # Use the serializer for response

    def get(self, request, *args, **kwargs):
        # Handle GET requests to list all jobs
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        # Handle POST requests to create a new job (optional for now)
        return self.create(request, *args, **kwargs)
    
#Retrieve a single transcoding job by ID
class TranscodingJobDetailView(generics.RetrieveAPIView):
    queryset = TranscodingJob.objects.all()
    serializer_class = TranscodingJobSerializer

#List all Channels or create a new one
class ChannelListCreateView(generics.ListCreateAPIView):
    #permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer

class ChannelDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer



