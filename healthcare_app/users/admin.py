from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, FamilyMember, PatientProfile, DoctorProfile
from django.utils.html import format_html


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'full_name', 'is_active', 'is_staff')
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': (
            'first_name', 'last_name', 'email', 'user_type',
            'phone', 'date_of_birth', 'profile_picture'
        )}),
        ('Address', {'fields': (
            'address', 'city', 'state', 'zip_code'
        )}),
        ('Permissions', {'fields': (
            'is_active', 'is_staff', 'is_superuser',
            'groups', 'user_permissions'
        )}),
        ('Important Dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ('last_login', 'date_joined', 'created_at', 'updated_at')
    
    def full_name(self, obj):
        return obj.get_full_name()
    full_name.short_description = 'Full Name'


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'blood_type', 'has_allergies', 'created_at')
    list_filter = ('blood_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'emergency_contact')
    raw_id_fields = ('user',)
    
    def has_allergies(self, obj):
        return bool(obj.allergies)
    has_allergies.boolean = True
    has_allergies.short_description = 'Has Allergies'


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'license_number', 'is_available', 'consultation_fee')
    list_filter = ('specialization', 'is_available', 'created_at')
    search_fields = ('user__username', 'user__email', 'license_number', 'specialization')
    raw_id_fields = ('user',)


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'main_user', 'relationship', 'is_emergency_contact', 'can_edit')
    list_filter = ('relationship', 'is_emergency_contact', 'can_edit', 'created_at')
    search_fields = ('name', 'main_user__username', 'email', 'phone')
    raw_id_fields = ('main_user', 'health_profile')