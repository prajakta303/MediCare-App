from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator


class CustomUser(AbstractUser):
    class UserType(models.TextChoices):
        PATIENT = 'patient', 'Patient'
        DOCTOR = 'doctor', 'Doctor'
        CAREGIVER = 'caregiver', 'Caregiver'
        ADMIN = 'admin', 'Admin'
    
    class Relationship(models.TextChoices):
        SPOUSE = 'spouse', 'Spouse'
        CHILD = 'child', 'Child'
        PARENT = 'parent', 'Parent'
        SIBLING = 'sibling', 'Sibling'
        GRANDPARENT = 'grandparent', 'Grandparent'
        GRANDCHILD = 'grandchild', 'Grandchild'
        UNCLE = 'uncle', 'Uncle'
        AUNT = 'aunt', 'Aunt'
        COUSIN = 'cousin', 'Cousin'
        OTHER = 'other', 'Other'
    
    # Core fields
    user_type = models.CharField(
        max_length=10, 
        choices=UserType.choices, 
        default=UserType.PATIENT
    )
    phone = models.CharField(max_length=15, blank=True, validators=[MinLengthValidator(10)])
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pics/%Y/%m/%d/', 
        null=True, 
        blank=True
    )
    
    # Address fields
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['email']),
        ]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    @property
    def full_name(self):
        """Return the full name of the user."""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def age(self):
        """Calculate age from date of birth."""
        if not self.date_of_birth:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class FamilyMember(models.Model):
    main_user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='family_members'
    )
    name = models.CharField(max_length=100)
    relationship = models.CharField(
        max_length=20, 
        choices=CustomUser.Relationship.choices
    )
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    
    # Health profile reference (if they have one in the system)
    health_profile = models.ForeignKey(
        'health.HealthProfile', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Permissions
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    
    # Emergency contact flag
    is_emergency_contact = models.BooleanField(default=False)
    emergency_contact_priority = models.PositiveSmallIntegerField(
        default=1,
        help_text="Priority order for emergency contacts (1 = primary)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Family Member"
        verbose_name_plural = "Family Members"
        ordering = ['-is_emergency_contact', 'emergency_contact_priority', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['main_user', 'name', 'relationship'],
                name='unique_family_member'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()}) - {self.main_user.username}"
    
    @property
    def full_info(self):
        """Return complete family member information."""
        return f"{self.name} ({self.get_relationship_display()}) - Phone: {self.phone or 'N/A'}"


class PatientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='patient_profile'
    )
    emergency_contact = models.CharField(max_length=100, blank=True)
    
    # Medical fields
    blood_type = models.CharField(
        max_length=5, 
        blank=True,
        choices=[
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
        ]
    )
    allergies = models.TextField(blank=True, help_text="List all allergies separated by commas")
    chronic_conditions = models.TextField(blank=True, help_text="List chronic conditions")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Patient Profile"
        verbose_name_plural = "Patient Profiles"

    def __str__(self):
        return f"Patient Profile: {self.user.username}"
    
    @property
    def primary_emergency_contact(self):
        """Get the primary emergency contact from family members."""
        emergency_contact = self.user.family_members.filter(
            is_emergency_contact=True
        ).order_by('emergency_contact_priority').first()
        return emergency_contact


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='doctor_profile'
    )
    specialization = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(
        max_length=50, 
        blank=True,
        unique=True,
        null=True
    )
    
    # Professional details
    hospital_affiliation = models.CharField(max_length=200, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00
    )
    
    # Availability
    is_available = models.BooleanField(default=True)
    available_days = models.CharField(
        max_length=50, 
        blank=True,
        help_text="Days available (e.g., Mon-Fri)"
    )
    available_hours = models.CharField(
        max_length=50, 
        blank=True,
        help_text="Working hours (e.g., 9AM-5PM)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Doctor Profile"
        verbose_name_plural = "Doctor Profiles"

    def __str__(self):
        return f"Dr. {self.user.last_name} - {self.specialization}"
    
    @property
    def full_title(self):
        """Return doctor's full professional title."""
        return f"Dr. {self.user.get_full_name()} - {self.specialization}"