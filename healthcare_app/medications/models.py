# medications/models.py

from django.db import models
from djongo import models as djongo_models
from users.models import CustomUser
import uuid

class Medication(djongo_models.Model):
    """Master medication database"""
    medication_id = djongo_models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = djongo_models.CharField(max_length=200)
    generic_name = djongo_models.CharField(max_length=200, null=True, blank=True)
    brand_name = djongo_models.CharField(max_length=200, null=True, blank=True)
    dosage_form = djongo_models.CharField(max_length=100)  # tablet, capsule, liquid, injection
    strength = djongo_models.CharField(max_length=100)  # 500mg, 10mg/5ml
    
    # Classification
    drug_class = djongo_models.CharField(max_length=200, null=True, blank=True)
    atc_code = djongo_models.CharField(max_length=20, null=True, blank=True)
    
    # Safety information
    pregnancy_category = djongo_models.CharField(max_length=10, null=True, blank=True)
    controlled_substance = djongo_models.BooleanField(default=False)
    requires_prescription = djongo_models.BooleanField(default=True)
    
    created_at = djongo_models.DateTimeField(auto_now_add=True)
    updated_at = djongo_models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'medications'
        indexes = [
            djongo_models.Index(fields=['name']),
            djongo_models.Index(fields=['generic_name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.strength})"


class PatientMedication(djongo_models.Model):
    """Patient's personal medication records"""
    FREQUENCY_CHOICES = (
        ('once_daily', 'Once Daily'),
        ('twice_daily', 'Twice Daily'),
        ('thrice_daily', 'Three Times Daily'),
        ('four_times_daily', 'Four Times Daily'),
        ('as_needed', 'As Needed'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    )
    
    medication_id = djongo_models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = djongo_models.ForeignKey(CustomUser, on_delete=djongo_models.CASCADE, related_name='patient_medications')
    
    # Medication details
    name = djongo_models.CharField(max_length=200)
    dosage = djongo_models.CharField(max_length=100)
    frequency = djongo_models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Timing
    start_date = djongo_models.DateField()
    end_date = djongo_models.DateField(null=True, blank=True)
    
    # Instructions and status
    instructions = djongo_models.TextField(blank=True)
    prescribing_doctor = djongo_models.CharField(max_length=200, blank=True)
    pharmacy = djongo_models.CharField(max_length=200, blank=True)
    
    # Status
    is_active = djongo_models.BooleanField(default=True)
    reason_for_discontinuation = djongo_models.TextField(blank=True)
    
    # Tracking
    total_quantity = djongo_models.PositiveIntegerField(null=True, blank=True)
    remaining_quantity = djongo_models.PositiveIntegerField(null=True, blank=True)
    refills_remaining = djongo_models.PositiveIntegerField(default=0)
    
    # AI Safety
    safety_checked = djongo_models.BooleanField(default=False)
    safety_warnings = djongo_models.JSONField(default=list)
    
    created_at = djongo_models.DateTimeField(auto_now_add=True)
    updated_at = djongo_models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.patient.username}"
    
    def is_expired(self):
        from django.utils import timezone
        return self.end_date and self.end_date < timezone.now().date()


class MedicationReminder(djongo_models.Model):
    """Medication reminder schedule"""
    reminder_id = djongo_models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medication = djongo_models.ForeignKey(PatientMedication, on_delete=djongo_models.CASCADE, related_name='reminders')
    
    # Timing
    reminder_time = djongo_models.TimeField()
    days_of_week = djongo_models.JSONField(default=list)  # [0,1,2,3,4,5,6] where 0=Monday
    
    # Notification settings
    notification_type = djongo_models.CharField(max_length=20, choices=[
        ('push', 'Push Notification'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('all', 'All'),
    ], default='push')
    
    # Status
    is_active = djongo_models.BooleanField(default=True)
    
    # Tracking
    last_triggered = djongo_models.DateTimeField(null=True, blank=True)
    next_trigger = djongo_models.DateTimeField(null=True, blank=True)
    
    created_at = djongo_models.DateTimeField(auto_now_add=True)
    updated_at = djongo_models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.medication.name} at {self.reminder_time}"


class MedicationLog(djongo_models.Model):
    """Log of medication intake"""
    LOG_STATUS = (
        ('taken', 'Taken'),
        ('missed', 'Missed'),
        ('skipped', 'Skipped'),
        ('late', 'Taken Late'),
    )
    
    log_id = djongo_models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medication = djongo_models.ForeignKey(PatientMedication, on_delete=djongo_models.CASCADE, related_name='logs')
    reminder = djongo_models.ForeignKey(MedicationReminder, on_delete=djongo_models.SET_NULL, null=True, blank=True)
    
    # Timing
    scheduled_time = djongo_models.DateTimeField()
    actual_time = djongo_models.DateTimeField(null=True, blank=True)
    
    # Status
    status = djongo_models.CharField(max_length=20, choices=LOG_STATUS)
    
    # Details
    dosage_taken = djongo_models.CharField(max_length=100, blank=True)
    notes = djongo_models.TextField(blank=True)
    
    # Confirmation
    confirmed_by = djongo_models.ForeignKey(CustomUser, on_delete=djongo_models.SET_NULL, null=True, blank=True)
    confirmation_method = djongo_models.CharField(max_length=50, blank=True)  # 'app', 'manual', 'caregiver'
    
    created_at = djongo_models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'medication_logs'
        indexes = [
            djongo_models.Index(fields=['medication', 'scheduled_time']),
            djongo_models.Index(fields=['scheduled_time']),
        ]
    
    def __str__(self):
        return f"{self.medication.name} - {self.status} at {self.scheduled_time}"


class DrugInteraction(djongo_models.Model):
    """Drug interaction database"""
    interaction_id = djongo_models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medication_1 = djongo_models.CharField(max_length=200)  # Generic or brand name
    medication_2 = djongo_models.CharField(max_length=200)  # Generic or brand name
    
    SEVERITY_CHOICES = [
        ('minor', 'Minor'),
        ('moderate', 'Moderate'),
        ('major', 'Major'),
        ('contraindicated', 'Contraindicated'),
    ]
    
    severity = djongo_models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    description = djongo_models.TextField()
    mechanism = djongo_models.TextField(blank=True)
    recommendation = djongo_models.TextField(blank=True)
    
    created_at = djongo_models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'drug_interactions'
    
    def __str__(self):
        return f"{self.medication_1} + {self.medication_2} ({self.severity})"


class Prescription(djongo_models.Model):
    """Digital prescriptions"""
    prescription_id = djongo_models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = djongo_models.ForeignKey(CustomUser, on_delete=djongo_models.CASCADE, related_name='prescriptions_received')
    doctor = djongo_models.ForeignKey(CustomUser, on_delete=djongo_models.CASCADE, related_name='prescriptions_written')
    
    # Prescription details
    issue_date = djongo_models.DateTimeField()
    expiry_date = djongo_models.DateTimeField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    status = djongo_models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Medical context
    diagnosis = djongo_models.TextField(blank=True)
    instructions = djongo_models.TextField()
    notes = djongo_models.TextField(blank=True)
    
    # AI Safety Scan results
    safety_scan_performed = djongo_models.BooleanField(default=False)
    safety_warnings = djongo_models.JSONField(default=list)
    scan_timestamp = djongo_models.DateTimeField(null=True, blank=True)
    
    # Prescription source
    SOURCE_CHOICES = [
        ('manual', 'Manual Entry'),
        ('ocr', 'OCR Scan'),
        ('electronic', 'Electronic Rx'),
    ]
    source = djongo_models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    
    created_at = djongo_models.DateTimeField(auto_now_add=True)
    updated_at = djongo_models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prescriptions'
    
    def __str__(self):
        return f"Prescription {self.prescription_id} - {self.patient.username}"