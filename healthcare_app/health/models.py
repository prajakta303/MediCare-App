# health/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class HealthProfile(models.Model):
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
        ('Unknown', 'Unknown')
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='health_profile')
    blood_type = models.CharField(max_length=10, choices=BLOOD_TYPE_CHOICES, blank=True)
    allergies = models.TextField(blank=True, help_text="List any allergies, separated by commas")
    current_medications = models.TextField(blank=True, help_text="List current medications, separated by commas")
    medical_conditions = models.TextField(blank=True, help_text="List any medical conditions")
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Health Profile - {self.user.username}"

# Create a signal to automatically create health profile when user is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_health_profile(sender, instance, created, **kwargs):
    if created:
        HealthProfile.objects.create(user=instance)