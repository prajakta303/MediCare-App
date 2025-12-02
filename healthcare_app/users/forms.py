from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import CustomUser, PatientProfile, DoctorProfile, FamilyMember
from django.core.exceptions import ValidationError
import re


class CustomUserCreationForm(UserCreationForm):
    """Form for creating new users with extended fields."""
    email = forms.EmailField(required=True, help_text="Required. Enter a valid email address.")
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password1', 'password2',
            'first_name', 'last_name', 'user_type', 'phone',
            'date_of_birth'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make user_type required
        self.fields['user_type'].required = True
    
    def clean_email(self):
        email = self.cleaned_data.get('email').lower().strip()
        if CustomUser.objects.filter(email=email).exists():
            raise ValidationError("A user with this email already exists.")
        return email
    
    def clean_phone(self):
        phone = self.cleaned_data.get('phone', '')
        if phone:
            # Basic phone validation
            phone = re.sub(r'\D', '', phone)
            if len(phone) < 10:
                raise ValidationError("Phone number must be at least 10 digits.")
        return phone


class CustomUserUpdateForm(UserChangeForm):
    """Form for updating existing users."""
    password = None  # Remove password field
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'phone', 'date_of_birth', 'profile_picture',
            'address', 'city', 'state', 'zip_code'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make email required
        self.fields['email'].required = True
    
    def clean_email(self):
        email = self.cleaned_data.get('email').lower().strip()
        if CustomUser.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise ValidationError("A user with this email already exists.")
        return email


class PatientProfileForm(forms.ModelForm):
    """Form for patient profile updates."""
    class Meta:
        model = PatientProfile
        fields = [
            'emergency_contact', 'blood_type',
            'allergies', 'chronic_conditions'
        ]
        widgets = {
            'allergies': forms.Textarea(attrs={'rows': 3}),
            'chronic_conditions': forms.Textarea(attrs={'rows': 3}),
        }


class DoctorProfileForm(forms.ModelForm):
    """Form for doctor profile updates."""
    class Meta:
        model = DoctorProfile
        fields = [
            'specialization', 'license_number',
            'hospital_affiliation', 'years_of_experience',
            'consultation_fee', 'is_available',
            'available_days', 'available_hours'
        ]
        widgets = {
            'consultation_fee': forms.NumberInput(attrs={'step': '0.01'}),
        }
    
    def clean_license_number(self):
        license_number = self.cleaned_data.get('license_number', '').strip()
        if license_number:
            if DoctorProfile.objects.filter(
                license_number=license_number
            ).exclude(pk=self.instance.pk).exists():
                raise ValidationError("This license number is already registered.")
        return license_number


class FamilyMemberForm(forms.ModelForm):
    """Form for adding/updating family members."""
    class Meta:
        model = FamilyMember
        fields = [
            'name', 'relationship', 'date_of_birth',
            'phone', 'email', 'is_emergency_contact',
            'emergency_contact_priority'
        ]
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set priority choices
        self.fields['emergency_contact_priority'].widget = forms.Select(
            choices=[(i, str(i)) for i in range(1, 6)]
        )