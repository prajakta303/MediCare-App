from django import forms
from .models import HealthProfile

class HealthProfileForm(forms.ModelForm):
    class Meta:
        model = HealthProfile
        fields = [
            # Basic Information
            'gender', 'height', 'weight', 'blood_type',
            
            # Medical Information
            'allergies', 'current_medications', 'medical_conditions',
            'surgical_history', 'family_history',
            
            # Lifestyle
            'smoking_status', 'alcohol_consumption', 'exercise_frequency',
            
            # Emergency Contacts
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            
            # Medical Provider
            'primary_doctor_name', 'primary_doctor_phone', 'primary_doctor_clinic',
            
            # Insurance
            'insurance_provider', 'insurance_id', 'insurance_group',
            
            # Additional
            'additional_notes'
        ]
        widgets = {
            'gender': forms.Select(attrs={'class': 'form-select'}),
            'blood_type': forms.Select(attrs={'class': 'form-select'}),
            'height': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1', 'placeholder': 'Height in cm'}),
            'weight': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1', 'placeholder': 'Weight in kg'}),
            'allergies': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3, 
                'placeholder': 'List all allergies separated by commas (e.g., Penicillin, Peanuts, Dust)'
            }),
            'current_medications': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3, 
                'placeholder': 'List current medications with dosage (e.g., Metformin 500mg twice daily, Lisinopril 10mg once daily)'
            }),
            'medical_conditions': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3, 
                'placeholder': 'List any chronic conditions or diagnoses (e.g., Type 2 Diabetes, Hypertension)'
            }),
            'surgical_history': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3, 
                'placeholder': 'List previous surgeries with dates if known'
            }),
            'family_history': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3, 
                'placeholder': 'List relevant family medical history'
            }),
            'smoking_status': forms.Select(attrs={'class': 'form-select'}),
            'alcohol_consumption': forms.Select(attrs={'class': 'form-select'}),
            'exercise_frequency': forms.Select(attrs={'class': 'form-select'}),
            'emergency_contact_name': forms.TextInput(attrs={'class': 'form-control'}),
            'emergency_contact_phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Phone number'}),
            'emergency_contact_relation': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Relationship'}),
            'primary_doctor_name': forms.TextInput(attrs={'class': 'form-control'}),
            'primary_doctor_phone': forms.TextInput(attrs={'class': 'form-control'}),
            'primary_doctor_clinic': forms.TextInput(attrs={'class': 'form-control'}),
            'insurance_provider': forms.TextInput(attrs={'class': 'form-control'}),
            'insurance_id': forms.TextInput(attrs={'class': 'form-control'}),
            'insurance_group': forms.TextInput(attrs={'class': 'form-control'}),
            'additional_notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
        labels = {
            'height': 'Height (cm)',
            'weight': 'Weight (kg)',
        }

    def clean_height(self):
        height = self.cleaned_data.get('height')
        if height and (height < 50 or height > 250):
            raise forms.ValidationError("Please enter a valid height between 50 and 250 cm.")
        return height

    def clean_weight(self):
        weight = self.cleaned_data.get('weight')
        if weight and (weight < 10 or weight > 300):
            raise forms.ValidationError("Please enter a valid weight between 10 and 300 kg.")
        return weight

    def clean_emergency_contact_phone(self):
        phone = self.cleaned_data.get('emergency_contact_phone')
        if phone and len(phone) < 10:
            raise forms.ValidationError("Please enter a valid phone number.")
        return phone