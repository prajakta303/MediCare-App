# health/forms.py
from django import forms
from .models import HealthProfile

class HealthProfileForm(forms.ModelForm):
    class Meta:
        model = HealthProfile
        fields = [
            'blood_type', 
            'allergies', 
            'current_medications', 
            'medical_conditions',
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_relation'
        ]
        widgets = {
            'allergies': forms.Textarea(attrs={'rows': 3, 'placeholder': 'e.g., Penicillin, Peanuts, Dust'}),
            'current_medications': forms.Textarea(attrs={'rows': 3, 'placeholder': 'e.g., Metformin 500mg, Lisinopril 10mg'}),
            'medical_conditions': forms.Textarea(attrs={'rows': 3, 'placeholder': 'e.g., Diabetes, Hypertension'}),
        }