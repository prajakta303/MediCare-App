# users/models.py
from django.db import models

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('family', 'Family Member'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='patient')
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.user_type})"

# health/models.py
from django.db import models
from users.models import CustomUser

class HealthProfile(models.Model):
    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
    )
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True)
    height = models.FloatField(null=True, blank=True)  # in cm
    weight = models.FloatField(null=True, blank=True)  # in kg
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # QR Code for emergency access
    emergency_qr_code = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Health Profile - {self.user.username}"

class FamilyMember(models.Model):
    RELATIONSHIP_CHOICES = (
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('sibling', 'Sibling'),
        ('other', 'Other'),
    )
    
    main_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='family_members')
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=10, choices=RELATIONSHIP_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    health_profile = models.OneToOneField(HealthProfile, on_delete=models.CASCADE, null=True, blank=True)
    can_edit = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.main_user.username}"