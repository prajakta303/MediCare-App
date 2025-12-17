# medications/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import *

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'generic_name', 'strength', 'dosage_form', 'drug_class', 'requires_prescription')
    list_filter = ('dosage_form', 'requires_prescription', 'controlled_substance')
    search_fields = ('name', 'generic_name', 'brand_name', 'drug_class')
    readonly_fields = ('medication_id', 'created_at', 'updated_at')


@admin.register(PatientMedication)
class PatientMedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'patient_name', 'dosage', 'frequency', 'is_active', 'adherence_rate')
    list_filter = ('frequency', 'is_active', 'safety_checked')
    search_fields = ('name', 'patient__username', 'patient__email')
    readonly_fields = ('medication_id', 'created_at', 'updated_at', 'safety_checked', 'safety_warnings')
    
    def patient_name(self, obj):
        return obj.patient.get_full_name()
    patient_name.short_description = 'Patient'
    
    def adherence_rate(self, obj):
        logs = obj.logs.all()
        if logs:
            taken = logs.filter(status__in=['taken', 'late']).count()
            rate = (taken / logs.count()) * 100
            color = 'green' if rate >= 90 else 'orange' if rate >= 75 else 'red'
            return format_html('<span style="color: {};">{:.1f}%</span>', color, rate)
        return 'No logs'
    adherence_rate.short_description = 'Adherence'


@admin.register(MedicationReminder)
class MedicationReminderAdmin(admin.ModelAdmin):
    list_display = ('medication_name', 'patient_name', 'reminder_time', 'days_display', 'is_active')
    list_filter = ('is_active', 'notification_type')
    search_fields = ('medication__name', 'medication__patient__username')
    readonly_fields = ('reminder_id', 'created_at', 'updated_at')
    
    def medication_name(self, obj):
        return obj.medication.name
    
    def patient_name(self, obj):
        return obj.medication.patient.get_full_name()
    patient_name.short_description = 'Patient'
    
    def days_display(self, obj):
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return ', '.join([day_names[day] for day in obj.days_of_week])
    days_display.short_description = 'Days'


@admin.register(MedicationLog)
class MedicationLogAdmin(admin.ModelAdmin):
    list_display = ('medication_name', 'patient_name', 'scheduled_time', 'status', 'actual_time')
    list_filter = ('status',)
    search_fields = ('medication__name', 'medication__patient__username')
    readonly_fields = ('log_id', 'created_at')
    
    def medication_name(self, obj):
        return obj.medication.name
    
    def patient_name(self, obj):
        return obj.medication.patient.get_full_name()
    patient_name.short_description = 'Patient'


@admin.register(DrugInteraction)
class DrugInteractionAdmin(admin.ModelAdmin):
    list_display = ('medication_1', 'medication_2', 'severity', 'created_at')
    list_filter = ('severity',)
    search_fields = ('medication_1', 'medication_2')
    readonly_fields = ('interaction_id', 'created_at')


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('prescription_id_short', 'patient_name', 'doctor_name', 'issue_date', 'status')
    list_filter = ('status', 'source', 'safety_scan_performed')
    search_fields = ('patient__username', 'doctor__username')
    readonly_fields = ('prescription_id', 'created_at', 'updated_at')
    
    def prescription_id_short(self, obj):
        return str(obj.prescription_id)[:8]
    prescription_id_short.short_description = 'Prescription ID'
    
    def patient_name(self, obj):
        return obj.patient.get_full_name()
    
    def doctor_name(self, obj):
        return obj.doctor.get_full_name()