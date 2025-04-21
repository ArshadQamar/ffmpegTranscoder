from django.urls import path
from .views import TranscodingJobListView,TranscodingJobDetailView,ChannelListCreateView,ChannelDetailView

urlpatterns=[
    path('jobs/', TranscodingJobListView.as_view(), name='tarnscodingjob_list'),
    path('jobs/<int:pk>/',TranscodingJobDetailView.as_view()  ,name='tarnscodingjob_detail'),
    path('channels/',ChannelListCreateView.as_view(), name='Channel'),
    path('channels/<int:pk>/',ChannelDetailView.as_view(), name='ChannelDetails'),
]

