from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class HealthProfile(models.Model):
    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'), 
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), 
        ('O+', 'O+'), ('O-', 'O-'),
        ('unknown', 'Unknown'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    )
    
    # Core user reference
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='health_profile')
    
    # Basic demographic information
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Height in cm")
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Weight in kg")
    blood_type = models.CharField(max_length=10, choices=BLOOD_TYPE_CHOICES, blank=True)
    
    # Medical information
    allergies = models.TextField(blank=True, help_text="List all allergies separated by commas")
    current_medications = models.TextField(blank=True, help_text="List current medications with dosage")
    medical_conditions = models.TextField(blank=True, help_text="Chronic conditions or diagnoses")
    surgical_history = models.TextField(blank=True, help_text="Previous surgeries with dates")
    family_history = models.TextField(blank=True, help_text="Family medical history")
    
    # Lifestyle information
    smoking_status = models.CharField(max_length=50, blank=True, choices=(
        ('never', 'Never smoked'),
        ('former', 'Former smoker'),
        ('current', 'Current smoker'),
    ))
    alcohol_consumption = models.CharField(max_length=50, blank=True, choices=(
        ('never', 'Never'),
        ('occasional', 'Occasional'),
        ('regular', 'Regular'),
    ))
    exercise_frequency = models.CharField(max_length=50, blank=True, choices=(
        ('sedentary', 'Sedentary'),
        ('light', '1-2 times per week'),
        ('moderate', '3-4 times per week'),
        ('active', '5+ times per week'),
    ))
    
    # Emergency contacts
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # Primary care physician
    primary_doctor_name = models.CharField(max_length=100, blank=True)
    primary_doctor_phone = models.CharField(max_length=20, blank=True)
    primary_doctor_clinic = models.CharField(max_length=200, blank=True)
    
    # Insurance information
    insurance_provider = models.CharField(max_length=100, blank=True)
    insurance_id = models.CharField(max_length=50, blank=True)
    insurance_group = models.CharField(max_length=50, blank=True)
    
    # Additional notes
    additional_notes = models.TextField(blank=True)
    
    # System fields
    is_complete = models.BooleanField(default=False)
    last_updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='modified_profiles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Health Profile - {self.user.username}"

    def calculate_bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight:
            height_in_meters = float(self.height) / 100  # Convert cm to meters
            return round(float(self.weight) / (height_in_meters ** 2), 1)
        return None

    def get_bmi_category(self):
        """Get BMI category"""
        bmi = self.calculate_bmi()
        if not bmi:
            return None
        
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"

    def save(self, *args, **kwargs):
        # Check if profile is complete (basic validation)
        required_fields = ['blood_type', 'allergies', 'emergency_contact_name', 'emergency_contact_phone']
        self.is_complete = all(getattr(self, field) for field in required_fields)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Health Profile"
        verbose_name_plural = "Health Profiles"