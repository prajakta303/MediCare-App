# users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, HealthProfile, FamilyMember

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'date_of_birth', 'is_staff')
    list_filter = ('user_type', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone', 'date_of_birth')}),
    )

@admin.register(HealthProfile)
class HealthProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'blood_type', 'height', 'weight')
    search_fields = ('user__username', 'user__email')

@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'main_user', 'relationship', 'can_edit')
    list_filter = ('relationship', 'can_edit')