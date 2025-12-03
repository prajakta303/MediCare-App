from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.exceptions import ValidationError
from .models import PatientProfile, DoctorProfile, FamilyMember

User = get_user_model()

class UserModelTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='patient'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.user_type, 'patient')
        self.assertTrue(hasattr(user, 'patient_profile'))
    
    def test_create_doctor(self):
        user = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            password='testpass123',
            user_type='doctor'
        )
        self.assertEqual(user.user_type, 'doctor')
        self.assertTrue(hasattr(user, 'doctor_profile'))
    
    def test_create_caregiver(self):
        """Test caregiver user creation"""
        user = User.objects.create_user(
            username='caregiver',
            email='caregiver@example.com',
            password='testpass123',
            user_type='caregiver'
        )
        self.assertEqual(user.user_type, 'caregiver')
    
    def test_create_admin_user(self):
        """Test admin user creation"""
        user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='testpass123',
            user_type='admin'
        )
        self.assertEqual(user.user_type, 'admin')
    
    def test_duplicate_username(self):
        """Test that duplicate usernames are rejected"""
        User.objects.create_user(username='testuser', password='pass123')
        with self.assertRaises(Exception):
            User.objects.create_user(username='testuser', password='pass456')
    
    def test_user_str_representation(self):
        """Test __str__ method of CustomUser"""
        user = User.objects.create_user(
            username='john_doe',
            email='john@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        self.assertIn('john_doe', str(user))
    
    def test_family_member_creation(self):
        user = User.objects.create_user(username='parent', password='test123')
        family_member = FamilyMember.objects.create(
            main_user=user,
            name='Child Name',
            relationship='child'
        )
        self.assertEqual(family_member.main_user, user)
        self.assertEqual(family_member.relationship, 'child')
    
    def test_family_member_permissions(self):
        """Test family member permission flags"""
        user = User.objects.create_user(username='parent', password='test123')
        family_member = FamilyMember.objects.create(
            main_user=user,
            name='Family Member',
            relationship='parent',
            can_view=True,
            can_edit=False
        )
        self.assertTrue(family_member.can_view)
        self.assertFalse(family_member.can_edit)
    
    def test_family_member_emergency_contact(self):
        """Test emergency contact flag on family member"""
        user = User.objects.create_user(username='parent', password='test123')
        family_member = FamilyMember.objects.create(
            main_user=user,
            name='Emergency Contact',
            relationship='spouse',
            emergency_contact_priority=1
        )
        self.assertEqual(family_member.emergency_contact_priority, 1)


# Commented out until signup views/URLs are implemented
# class UserViewsTests(TestCase):
#     def test_signup_view(self):
#         response = self.client.get(reverse('signup'))
#         self.assertEqual(response.status_code, 200)
#         self.assertTemplateUsed(response, 'users/signup.html')
#     
#     def test_signup_post(self):
#         response = self.client.post(reverse('signup'), {
#             'username': 'newuser',
#             'email': 'new@example.com',
#             'password1': 'ComplexPass123',
#             'password2': 'ComplexPass123',
#             'user_type': 'patient',
#             'first_name': 'John',
#             'last_name': 'Doe',
#         })
#         # Should redirect to login
#         self.assertEqual(response.status_code, 302)