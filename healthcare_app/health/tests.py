from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import HealthProfile

User = get_user_model()

class HealthProfileTestCase(TestCase):
    def setUp(self):
        """Create test user"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_health_profile_auto_created(self):
        """Test if health profile is auto-created when user is created"""
        # Profile should be created via signal
        self.assertTrue(HealthProfile.objects.filter(user=self.user).exists())
    
    def test_health_profile_update(self):
        """Test updating health profile"""
        profile = self.user.health_profile
        profile.blood_type = 'O+'
        profile.allergies = 'Peanuts, Shellfish'
        profile.save()
        
        updated_profile = HealthProfile.objects.get(user=self.user)
        self.assertEqual(updated_profile.blood_type, 'O+')
        self.assertEqual(updated_profile.allergies, 'Peanuts, Shellfish')
    
    def test_health_profile_string_representation(self):
        """Test __str__ method"""
        profile = self.user.health_profile
        expected = f"Health Profile - {self.user.username}"
        self.assertEqual(str(profile), expected)
    
    def test_emergency_contact_fields(self):
        """Test emergency contact fields"""
        profile = self.user.health_profile
        profile.emergency_contact_name = 'Jane Doe'
        profile.emergency_contact_phone = '123-456-7890'
        profile.emergency_contact_relation = 'Spouse'
        profile.save()
        
        updated_profile = HealthProfile.objects.get(user=self.user)
        self.assertEqual(updated_profile.emergency_contact_name, 'Jane Doe')
        self.assertEqual(updated_profile.emergency_contact_phone, '123-456-7890')
