from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import IntegrityError
from .models import CustomUser, PatientProfile, DoctorProfile


@receiver(post_save, sender=CustomUser)
def ensure_user_profiles(sender, instance, created, **kwargs):
    """
    Ensure appropriate profile exists for the user_type.
    """
    if not created:
        return
    
    try:
        if instance.user_type == 'patient':
            PatientProfile.objects.get_or_create(user=instance)
            # Also create HealthProfile for patients
            from health.models import HealthProfile
            HealthProfile.objects.get_or_create(user=instance)
        elif instance.user_type == 'doctor':
            DoctorProfile.objects.get_or_create(user=instance)
    except IntegrityError:
        # In rare race conditions, ignore; profile likely created by concurrent process
        pass
