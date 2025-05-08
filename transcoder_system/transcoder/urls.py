from django.urls import path
from .views import TranscodingJobListView,TranscodingJobDetailView,ChannelListCreateView,ChannelDetailView,StartTranscodingJob,StopTranscodingJob,NetworkInterfaceView

urlpatterns=[
    path('jobs/', TranscodingJobListView.as_view(), name='tarnscodingjob_list'),
    path('jobs/<int:pk>/',TranscodingJobDetailView.as_view()  ,name='tarnscodingjob_detail'),
    path('job/<int:pk>/start/', StartTranscodingJob.as_view(), name='start-job'),
    path('job/<int:pk>/stop/', StopTranscodingJob.as_view(), name='stop-job'),
    path('channels/',ChannelListCreateView.as_view(), name='Channel'),
    path('channels/<int:pk>/',ChannelDetailView.as_view(), name='ChannelDetails'),
    path('netiface/', NetworkInterfaceView.as_view(), name='network-interfaces'),
]

