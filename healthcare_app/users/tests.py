from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
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
    
    def test_family_member_creation(self):
        user = User.objects.create_user(username='parent', password='test123')
        family_member = FamilyMember.objects.create(
            main_user=user,
            name='Child Name',
            relationship='child'
        )
        self.assertEqual(family_member.main_user, user)
        self.assertEqual(family_member.relationship, 'child')


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