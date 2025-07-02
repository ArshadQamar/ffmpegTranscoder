from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator



# Create your models here.
class Channel(models.Model):
    INPUT_TYPES = [
        ('hls', 'hls'),
        ('udp', 'udp'),
        ('file', 'file'),
    ]

    OUTPUT_TYPES = [
        ('hls', 'hls'),
        ('rtmp', 'rtmp'),
        ('udp', 'udp'),
        ('file', 'file'),
    ]


    # Video Codec Choices
    VIDEO_CODEC_CHOICES = [
        ('h264', 'H.264'),
        ('h265', 'H.265'),
        ('mpeg2', 'MPEG-2'),
    ]

    # Audio Codec Choices
    AUDIO_CODEC_CHOICES = [
        ('aac', 'AAC'),
        ('ac3', 'AC3'),
        ('mp2', 'MP2'),
    ]

    # Standard FPS Choices
    FRAMERATE_CHOICES = [
        (24, '24 FPS'),
        (25, '25 FPS'),
        (30, '30 FPS'),
        (50, '50 FPS'),
        (60, '60 FPS'),
    ]

    # Standard Resolution Choices
    RESOLUTION_CHOICES = [
        ('1920x1080', '1080p (Full HD)'),
        ('1280x720', '720p (HD)'),
        ('1024x576', '576p (SD PAL 16:9)'),  
        ('768x576', '576p (SD PAL 4:3)'),
        ('854x480', '480p (SD)'),
        ('640x360', '360p'),
        ('426x240', '240p'),
    ]


    #name of channel
    name=models.CharField(max_length=255, unique=True)

    #Input Details
    input_type=models.CharField(max_length=10, choices=INPUT_TYPES)
    input_url=models.CharField(max_length=500,blank=True,null=True)
    input_multicast_ip=models.CharField(max_length=50,blank=True,null=True)
    input_network=models.CharField(max_length=100,blank=True,null=True)
    input_file=models.FileField(upload_to="uploads/input/",blank=True,null=True)

    #Output Details
    output_type = models.CharField(max_length=10, choices=OUTPUT_TYPES)
    output_url = models.CharField(max_length=500, blank=True, null=True)
    output_multicast_ip = models.CharField(max_length=50, blank=True, null=True)
    output_network = models.CharField(max_length=100, blank=True, null=True)
    output_file = models.FileField(upload_to="uploads/output/", blank=True, null=True)

    #Parameters
    video_codec=models.CharField(max_length=50,choices=VIDEO_CODEC_CHOICES, default='h264')
    audio=models.CharField(max_length=50,choices=AUDIO_CODEC_CHOICES, default='aac')
    audio_gain=models.FloatField(default=1.0,null=True,validators=[MinValueValidator(0.1), MaxValueValidator(10)])
    
    video_bitrate=models.IntegerField(help_text="2.4M, 4.8M")
    audio_bitrate=models.IntegerField(help_text="128k, 256k")
    buffer_size=models.IntegerField(help_text="4.8M,9.6M")
    scan_type = models.CharField(max_length=20, choices=[('progressive', 'Progressive'), ('interlaced', 'Interlaced')], default='progressive')
    resolution=models.CharField(max_length=10,choices=RESOLUTION_CHOICES,default='1920x1080')
    frame_rate=models.IntegerField(choices=FRAMERATE_CHOICES, default=30)
    service_id = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(9999)])
    video_pid = models.IntegerField(default=101, help_text="Video PID")
    audio_pid = models.IntegerField(default=102, help_text="Audio PID")


    logo_path=models.CharField(max_length=500,blank=True, null=True)
    logo_position = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^x=(?:\d+|W-w-\d+):y=(?:\d+|H-h-\d+)$',
                message="Enter a valid overlay position like 'x=10:y=10' or 'x=W-w-10:y=H-h-10'."
            )
        ],
        help_text="Enter overlay position like 'x=10:y=10' or 'x=W-w-10:y=H-h-10'"
    )
    logo_opacity=models.FloatField(default=1,null=True,validators=[MinValueValidator(0.1), MaxValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name



class TranscodingJob(models.Model):
    STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('running', 'Running'),
    ('completed', 'Completed'),
    ('error', 'Error'),
    ('stopped', 'Stopped'),
 ]
    

    channel=models.OneToOneField('Channel', on_delete=models.CASCADE, related_name='jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    ffmpeg_pid = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)


    def __str__(self):
        return f"Job for {self.channel.name} - {self.status}"













