from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import HealthProfile
from .forms import HealthProfileForm
from django.urls import reverse

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
    
    def test_bmi_calculation(self):
        profile = self.user.health_profile
        profile.height = 180  # cm
        profile.weight = 81   # kg
        profile.save()
        self.assertAlmostEqual(profile.calculate_bmi(), 25.0, places=1)
    
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

class HealthProfileFormTests(TestCase):
    def test_form_valid_data(self):
        user = User.objects.create_user('u1', password='pw', user_type='patient')
        # Get the auto-created profile
        profile = user.health_profile
        form = HealthProfileForm(data={
            'blood_type': 'O+',
            'allergies': 'Peanut',
            'current_medications': 'None',
            'medical_conditions': 'None',
            'emergency_contact_name': 'Jane',
            'emergency_contact_phone': '+1-555-123-4567',
            'emergency_contact_relation': 'Spouse',
        }, instance=profile)
        if not form.is_valid():
            print(f"Form errors: {form.errors}")
        self.assertTrue(form.is_valid())

class HealthProfileViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('vuser', password='pw', user_type='patient')
        self.client.login(username='vuser', password='pw')

    def test_profile_view_get(self):
        url = reverse('health:health_profile')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'health/profile.html')
        self.assertIn('profile', resp.context)

    def test_profile_edit_post(self):
        url = reverse('health:health_profile_edit')
        resp = self.client.post(url, {
            'blood_type': 'A+',
            'allergies': 'None',
            'current_medications': '',
            'medical_conditions': '',
            'emergency_contact_name': 'John',
            'emergency_contact_phone': '+1-555-123-4567',
            'emergency_contact_relation': 'Spouse',
        }, follow=True)
        self.assertRedirects(resp, reverse('health:health_profile'))
        self.user.refresh_from_db()
        self.assertEqual(self.user.health_profile.blood_type, 'A+')