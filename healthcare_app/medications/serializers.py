# medications/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import *
from users.serializers import CustomUserSerializer

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'
        read_only_fields = ('medication_id', 'created_at', 'updated_at')


class PatientMedicationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    is_expired = serializers.SerializerMethodField()
    adherence_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientMedication
        fields = '__all__'
        read_only_fields = ('medication_id', 'created_at', 'updated_at', 'safety_checked', 'safety_warnings')
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_adherence_rate(self, obj):
        # Calculate adherence rate for this medication
        logs = obj.logs.all()
        if not logs:
            return 0
        
        taken_logs = logs.filter(status__in=['taken', 'late']).count()
        return (taken_logs / logs.count()) * 100 if logs.count() > 0 else 0
    
    def validate(self, data):
        # Validate end date is after start date
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })
        
        # Validate remaining quantity
        if data.get('remaining_quantity') is not None and data.get('total_quantity') is not None:
            if data['remaining_quantity'] > data['total_quantity']:
                raise serializers.ValidationError({
                    'remaining_quantity': 'Remaining quantity cannot exceed total quantity'
                })
        
        return data


class MedicationReminderSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    
    class Meta:
        model = MedicationReminder
        fields = '__all__'
        read_only_fields = ('reminder_id', 'created_at', 'updated_at', 'last_triggered', 'next_trigger')
    
    def validate_days_of_week(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("days_of_week must be a list")
        if not all(isinstance(day, int) for day in value):
            raise serializers.ValidationError("All days must be integers")
        if not all(0 <= day <= 6 for day in value):
            raise serializers.ValidationError("Days must be between 0 (Monday) and 6 (Sunday)")
        return value


class MedicationLogSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    patient_name = serializers.CharField(source='medication.patient.get_full_name', read_only=True)
    
    class Meta:
        model = MedicationLog
        fields = '__all__'
        read_only_fields = ('log_id', 'created_at')
    
    def validate(self, data):
        # Validate actual time is not in the future
        if data.get('actual_time') and data['actual_time'] > timezone.now():
            raise serializers.ValidationError({
                'actual_time': 'Actual time cannot be in the future'
            })
        
        # Validate scheduled time is not in the future for new logs
        if not self.instance and data.get('scheduled_time') and data['scheduled_time'] > timezone.now():
            raise serializers.ValidationError({
                'scheduled_time': 'Scheduled time cannot be in the future for new logs'
            })
        
        return data


class DrugInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrugInteraction
        fields = '__all__'
        read_only_fields = ('interaction_id', 'created_at')


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('prescription_id', 'created_at', 'updated_at')
    
    def validate(self, data):
        # Validate expiry date is after issue date
        if data.get('expiry_date') and data.get('issue_date'):
            if data['expiry_date'] <= data['issue_date']:
                raise serializers.ValidationError({
                    'expiry_date': 'Expiry date must be after issue date'
                })
        
        return data


class MedicationCheckSerializer(serializers.Serializer):
    """Serializer for medication safety check"""
    medications = serializers.ListField(
        child=serializers.CharField(max_length=200),
        min_length=1
    )
    patient_id = serializers.IntegerField(required=False)
    existing_conditions = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False,
        default=list
    )


class MedicationAdherenceSerializer(serializers.Serializer):
    """Serializer for medication adherence data"""
    medication_id = serializers.UUIDField()
    medication_name = serializers.CharField()
    total_doses = serializers.IntegerField()
    taken_doses = serializers.IntegerField()
    missed_doses = serializers.IntegerField()
    adherence_rate = serializers.FloatField()
    last_taken = serializers.DateTimeField(allow_null=True)


class PrescriptionUploadSerializer(serializers.Serializer):
    """Serializer for prescription upload with OCR"""
    prescription_image = serializers.ImageField()
    patient_id = serializers.IntegerField()
    
    def validate(self, data):
        # Validate patient exists
        from users.models import CustomUser
        try:
            patient = CustomUser.objects.get(id=data['patient_id'], user_type='patient')
            data['patient'] = patient
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({
                'patient_id': 'Patient not found'
            })
        
        return data