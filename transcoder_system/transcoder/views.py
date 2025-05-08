import psutil
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from .models import TranscodingJob, Channel
from .serializers import TranscodingJobSerializer, ChannelSerializer
from .tasks import transcoding_start,transcoding_stop

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

# List Channel based on channel id
class ChannelDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer

# Start Channel vai API Endpoint
class StartTranscodingJob(APIView):
    def post(self,request,pk):
        #Start the Transcoding job by id
        try:
            #Retrieve Job by ID
            job = TranscodingJob.objects.get(pk=pk)

            #call the transcoding start function
            transcoding_start.delay(pk)
            return Response({'message': f'Job {pk} started'}, status=status.HTTP_200_OK)
        
        except TranscodingJob.DoesNotExist:
            return Response({'error': 'Transcoding job not found'}, status=status.HTTP_404_NOT_FOUND)
        
class StopTranscodingJob(APIView):
    def post(self,request,pk):
        try:
            job = TranscodingJob.objects.get(pk=pk)
            transcoding_stop(pk)
            return Response({'message': f'Job {pk} Stopped'}, status=status.HTTP_200_OK)
        except TranscodingJob.DoesNotExist:
            return Response({'error': 'Transcoding job not found'}, status=status.HTTP_404_NOT_FOUND)
        

class NetworkInterfaceView(APIView):
    def get(self, request):
        interfaces = psutil.net_if_addrs()

        data = []

        for name, addrs in interfaces.items():
            ip_address = None
            for addr in addrs:
                if addr.family.name == 'AF_INET':
                    ip_address = addr.address
                    break  # Stop after the first IPv4 address
            data.append({
                "name": name,
                "ip_addresses": ip_address
            })

        return Response(data)
