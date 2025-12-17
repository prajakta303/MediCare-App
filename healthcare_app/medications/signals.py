# medications/signals.py

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import PatientMedication, MedicationReminder
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=PatientMedication)
def create_default_reminders(sender, instance, created, **kwargs):
    """Create default reminders when a new medication is added"""
    if created and instance.frequency != 'as_needed':
        try:
            # Create reminders based on frequency
            if instance.frequency == 'once_daily':
                MedicationReminder.objects.create(
                    medication=instance,
                    reminder_time=timezone.now().time().replace(hour=9, minute=0, second=0),
                    days_of_week=[0, 1, 2, 3, 4, 5, 6]  # Every day
                )
            elif instance.frequency == 'twice_daily':
                MedicationReminder.objects.create(
                    medication=instance,
                    reminder_time=timezone.now().time().replace(hour=9, minute=0, second=0),
                    days_of_week=[0, 1, 2, 3, 4, 5, 6]
                )
                MedicationReminder.objects.create(
                    medication=instance,
                    reminder_time=timezone.now().time().replace(hour=21, minute=0, second=0),
                    days_of_week=[0, 1, 2, 3, 4, 5, 6]
                )
            elif instance.frequency == 'thrice_daily':
                for hour in [8, 14, 20]:
                    MedicationReminder.objects.create(
                        medication=instance,
                        reminder_time=timezone.now().time().replace(hour=hour, minute=0, second=0),
                        days_of_week=[0, 1, 2, 3, 4, 5, 6]
                    )
            
            logger.info(f"Created default reminders for medication: {instance.name}")
            
        except Exception as e:
            logger.error(f"Error creating reminders for medication {instance.name}: {str(e)}")


@receiver(pre_save, sender=PatientMedication)
def check_expiration(sender, instance, **kwargs):
    """Check if medication is expired and update status"""
    if instance.end_date and instance.end_date < timezone.now().date():
        instance.is_active = False
        instance.reason_for_discontinuation = "Expired"
        
        # Deactivate all reminders
        instance.reminders.update(is_active=False)
        
        logger.info(f"Medication {instance.name} marked as expired and deactivated")