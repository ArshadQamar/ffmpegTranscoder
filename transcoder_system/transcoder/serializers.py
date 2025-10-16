from rest_framework import serializers
from .models import TranscodingJob, Channel, ABR

class ABRSerializer(serializers.ModelSerializer):
    channel = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = ABR
        fields = "__all__"

class TranscodingJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscodingJob
        fields = "__all__"

class ChannelSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    job_id = serializers.SerializerMethodField()
    error_message = serializers.SerializerMethodField()
    abr_profiles = ABRSerializer(many=True, required=False, read_only=False)

    class Meta:
        model = Channel
        exclude = ['created_at', 'updated_at']

    def get_status(self, obj):
        return obj.jobs.status if hasattr(obj, 'jobs') else None

    def get_job_id(self, obj):
        return obj.jobs.id if hasattr(obj, 'jobs') else None
    
    def get_error_message(self, obj):  
        return obj.jobs.error_message if hasattr(obj, 'jobs') else None

    def validate(self, data):
        is_abr = data.get('is_abr', getattr(self.instance, 'is_abr', False))
        abr_profiles = self.initial_data.get('abr_profiles', [])
        
        # INPUT VALIDATION - Common for both ABR and non-ABR
        input_type = data.get('input_type')
        
        if not input_type:
            raise serializers.ValidationError({
                "input_type": "This field is required."
            })
        
        # Define input type requirements
        input_requirements = {
            'udp': ['input_network', 'input_multicast_ip'],
            'file': ['input_file'],
            'rtmp': ['input_rtmp_url'],
            'hls': ['input_hls_url'],
            'srt': ['input_srt_url'],
            # Add more input types as needed
        }
        
        if input_type not in input_requirements:
            raise serializers.ValidationError({
                'input_type': f"Unsupported input type: {input_type}"
            })
        
        # Validate input type specific fields
        for field in input_requirements[input_type]:
            if data.get(field) in (None, ''):
                raise serializers.ValidationError({
                    field: f"This field is required when input_type='{input_type}'."
                })

        # ABR VALIDATION (your existing code)
        # Fields that should be null when is_abr=True
        abr_null_fields = [
            'output_type', 'output_url', 'output_multicast_ip', 'output_file',
            'video_bitrate', 'audio_bitrate', 'buffer_size', 'resolution', 
            'service_id', 'video_pid', 'audio_pid', 'pmt_pid', 'pcr_pid'
        ]

        if is_abr:
            # Validate that we have ABR profiles
            if not abr_profiles and not (self.instance and self.instance.abr.exists()):
                raise serializers.ValidationError(
                    {"abr_profiles": "At least one ABR profile is required when is_abr=True."}
                )
            
            # Check that ABR-specific fields are null
            for field in abr_null_fields:
                if data.get(field) is not None:
                    raise serializers.ValidationError({
                        field: f"This field must be null when is_abr=True. Use ABR profiles instead."
                    })
        else:
            # For non-ABR channels, require the main output and encoding fields
            # Base required fields for non-ABR channels
            required_fields = [
                'output_type', 'video_bitrate', 'audio_bitrate', 'buffer_size', 
                'resolution', 'service_id', 'video_pid', 'audio_pid', 'pmt_pid', 'pcr_pid'
            ]
            
            # Conditionally add fields based on output_type
            output_type = data.get('output_type')
            
            if output_type == 'udp':
                required_fields.extend(['output_network', 'output_multicast_ip'])
            elif output_type == 'file':
                required_fields.extend(['output_file'])
            elif output_type == 'hls':
                required_fields.extend(['output_url'])
            elif output_type == 'rtmp':
                required_fields.extend(['output_rtmp_url'])
            # Add more output types as needed
            
            for field in required_fields:
                if data.get(field) in (None, ''):
                    raise serializers.ValidationError({
                        field: "This field is required when is_abr=False."
                    })

        return data

    def create(self, validated_data):
        abr_data = validated_data.pop('abr_profiles', [])
        channel = Channel.objects.create(**validated_data)
        
        # Create ABR profiles if provided
        for abr_profile in abr_data:
            ABR.objects.create(channel=channel, **abr_profile)
            
        # Reload the channel with ABR profiles for response
        channel = Channel.objects.prefetch_related('abr').get(id=channel.id)
        return channel

    def update(self, instance, validated_data):
        abr_data = validated_data.pop('abr_profiles', [])
        
        # Update main channel fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update ABR profiles if provided
        if abr_data is not None:  # Only update if abr_profiles was in the request
            instance.abr.all().delete()  # Remove existing profiles
            for abr_profile in abr_data:
                ABR.objects.create(channel=instance, **abr_profile)
        
        # Reload the instance with ABR profiles for response
        instance = Channel.objects.prefetch_related('abr').get(id=instance.id)
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Ensure ABR profiles are included in the response
        if instance.is_abr and 'abr_profiles' not in representation:
            representation['abr_profiles'] = ABRSerializer(instance.abr.all(), many=True).data
        return representation