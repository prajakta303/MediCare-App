# medications/models.py

from django.db import models
from users.models import CustomUser

class Medication(models.Model):
    FREQUENCY_CHOICES = (
        ('once_daily', 'Once Daily'),
        ('twice_daily', 'Twice Daily'),
        ('thrice_daily', 'Three Times Daily'),
        ('four_times_daily', 'Four Times Daily'),
        ('as_needed', 'As Needed'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.username}"

class MedicationReminder(models.Model):
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE)
    reminder_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.medication.name} at {self.reminder_time}"