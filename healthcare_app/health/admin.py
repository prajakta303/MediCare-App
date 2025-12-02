from django.contrib import admin
from .models import HealthProfile

@admin.register(HealthProfile)
class HealthProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'blood_type', 'is_complete', 'created_at', 'updated_at')
    list_filter = ('blood_type', 'is_complete', 'gender', 'created_at')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'allergies', 'medical_conditions')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'is_complete', 'last_updated_by')
        }),
        ('Demographic Information', {
            'fields': ('gender', 'height', 'weight', 'blood_type')
        }),
        ('Medical Information', {
            'fields': ('allergies', 'current_medications', 'medical_conditions')
        }),
        ('Medical History', {
            'fields': ('surgical_history', 'family_history')
        }),
        ('Lifestyle', {
            'fields': ('smoking_status', 'alcohol_consumption', 'exercise_frequency')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation')
        }),
        ('Medical Provider', {
            'fields': ('primary_doctor_name', 'primary_doctor_phone', 'primary_doctor_clinic')
        }),
        ('Insurance', {
            'fields': ('insurance_provider', 'insurance_id', 'insurance_group')
        }),
        ('Additional Information', {
            'fields': ('additional_notes',)
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )