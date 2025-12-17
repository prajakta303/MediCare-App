"""
Tests for JWT authentication, permissions, and API endpoints.

Tests JWT token generation, permission enforcement, and API functionality.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import CustomUser, PatientProfile, DoctorProfile, FamilyMember
from health.models import HealthProfile


class JWTTokenTestCase(TestCase):
    """Test JWT token generation and refresh."""

    def setUp(self):
        """Create test users."""
        self.client = APIClient()
        self.patient_user = CustomUser.objects.create_user(
            username='patient_test',
            email='patient@test.com',
            password='testpass123',
            user_type=CustomUser.UserType.PATIENT,
            first_name='John',
            last_name='Doe'
        )
        self.doctor_user = CustomUser.objects.create_user(
            username='doctor_test',
            email='doctor@test.com',
            password='testpass123',
            user_type=CustomUser.UserType.DOCTOR,
            first_name='Jane',
            last_name='Smith'
        )

    def test_obtain_jwt_token(self):
        """Test obtaining JWT access and refresh tokens."""
        response = self.client.post('/api/token/', {
            'username': 'patient_test',
            'password': 'testpass123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_token_contains_user_info(self):
        """Test that JWT token includes user information."""
        response = self.client.post('/api/token/', {
            'username': 'patient_test',
            'password': 'testpass123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Token should be a valid JWT
        access_token = response.data['access']
        self.assertIsNotNone(access_token)

    def test_token_invalid_credentials(self):
        """Test token request with invalid credentials."""
        response = self.client.post('/api/token/', {
            'username': 'patient_test',
            'password': 'wrongpassword'
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        """Test refreshing an expired access token."""
        # First, get tokens
        token_response = self.client.post('/api/token/', {
            'username': 'patient_test',
            'password': 'testpass123'
        })

        refresh_token = token_response.data['refresh']

        # Then, use refresh token to get new access token
        refresh_response = self.client.post('/api/token/refresh/', {
            'refresh': refresh_token
        })

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_logout_blacklists_token(self):
        """Test that logout blacklists the refresh token."""
        # First, get tokens
        token_response = self.client.post('/api/token/', {
            'username': 'patient_test',
            'password': 'testpass123'
        })

        refresh_token = token_response.data['refresh']
        access_token = token_response.data['access']

        # Logout with the refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = self.client.post('/api/logout/', {
            'refresh': refresh_token
        })

        self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertIn('success', logout_response.data)

        # Try to refresh the blacklisted token (should fail)
        self.client.credentials()  # Clear auth
        refresh_response = self.client.post('/api/token/refresh/', {
            'refresh': refresh_token
        })

        # Should get 401 because token is blacklisted
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_without_refresh_token(self):
        """Test logout fails without refresh token."""
        token_response = self.client.post('/api/token/', {
            'username': 'patient_test',
            'password': 'testpass123'
        })

        access_token = token_response.data['access']

        # Try to logout without refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = self.client.post('/api/logout/', {})

        self.assertEqual(logout_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', logout_response.data)


class PermissionTestCase(TestCase):
    """Test permission classes enforce role-based access control."""

    def setUp(self):
        """Create test users and get tokens."""
        self.client = APIClient()

        # Create users with different roles
        self.patient_user = CustomUser.objects.create_user(
            username='patient1',
            email='patient1@test.com',
            password='testpass123',
            user_type=CustomUser.UserType.PATIENT
        )
        # Remove any auto-created health profile for test isolation
        from health.models import HealthProfile
        HealthProfile.objects.filter(user=self.patient_user).delete()
        self.doctor_user = CustomUser.objects.create_user(
            username='doctor1',
            email='doctor1@test.com',
            password='testpass123',
            user_type=CustomUser.UserType.DOCTOR
        )
        HealthProfile.objects.filter(user=self.doctor_user).delete()
        self.admin_user = CustomUser.objects.create_user(
            username='admin1',
            email='admin1@test.com',
            password='testpass123',
            user_type=CustomUser.UserType.ADMIN
        )
        HealthProfile.objects.filter(user=self.admin_user).delete()

        # Get tokens
        patient_token_response = self.client.post('/api/token/', {
            'username': 'patient1',
            'password': 'testpass123'
        })
        self.patient_token = patient_token_response.data['access']

        doctor_token_response = self.client.post('/api/token/', {
            'username': 'doctor1',
            'password': 'testpass123'
        })
        self.doctor_token = doctor_token_response.data['access']

        admin_token_response = self.client.post('/api/token/', {
            'username': 'admin1',
            'password': 'testpass123'
        })
        self.admin_token = admin_token_response.data['access']

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access protected endpoints."""
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_access_profile(self):
        """Test that authenticated users can access their own profile."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient_token}')
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'patient1')

    def test_patient_cannot_access_user_list(self):
        """Test that patients cannot list all users."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient_token}')
        response = self.client.get('/api/users/')
        # Patients should only see themselves
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_admin_can_list_all_users(self):
        """Test that admins can list all users."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all 3 users
        self.assertEqual(len(response.data['results']), 3)

    def test_doctor_can_view_health_profiles(self):
        """Test that doctors can view patient health profiles."""
        # Create a patient with health profile
        health_profile = HealthProfile.objects.create(
            user=self.patient_user,
            gender='male',
            blood_type='O+'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.doctor_token}')
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

    def test_patient_can_only_view_own_health_profile(self):
        """Test that patients can only see their own health profile."""
        # Create health profiles for multiple users
        HealthProfile.objects.create(user=self.patient_user, gender='male', blood_type='O+')
        HealthProfile.objects.create(user=self.doctor_user, gender='female', blood_type='A+')

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient_token}')
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Patient should only see their own profile
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['user']['id'], self.patient_user.id)

    def test_patient_permission_on_family_members(self):
        """Test that only patients can manage family members."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.doctor_token}')
        response = self.client.get('/api/family-members/')
        # Doctors don't have access to family members
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_can_create_family_member(self):
        """Test that patients can create family member entries."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.patient_token}')
        response = self.client.post('/api/family-members/', {
            'name': 'Emergency Contact',
            'relationship': 'other',
            'email': 'emergency@test.com',
            'phone': '+1-555-0001',
            'can_view': True,
            'can_edit': False,
            'emergency_contact_priority': 1
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class APIEndpointTestCase(TestCase):
    """Test API CRUD endpoints functionality."""

    def setUp(self):
        """Create test user and authenticate."""
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            user_type=CustomUser.UserType.PATIENT
        )
        # Ensure no pre-existing health profile from signals
        from health.models import HealthProfile
        HealthProfile.objects.filter(user=self.user).delete()

        token_response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_user_registration_without_auth(self):
        """Test that new users can register without authentication."""
        self.client.credentials()  # Clear auth
        response = self.client.post('/api/users/', {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'newpass123',
            'password2': 'newpass123',
            'user_type': 'patient',
            'first_name': 'New',
            'last_name': 'User'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_health_profile_creation(self):
        """Test creating a health profile."""
        response = self.client.post('/api/health/', {
            'gender': 'male',
            'height': 180,
            'weight': 75,
            'blood_type': 'O+',
            'allergies': 'Peanuts',
            'current_medications': 'None',
            'medical_conditions': 'None',
            'surgical_history': 'None',
            'family_history': 'None'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['gender'], 'male')

    def test_health_profile_update(self):
        """Test updating a health profile."""
        # Create initial profile
        profile = HealthProfile.objects.create(
            user=self.user,
            gender='male',
            blood_type='O+'
        )

        # Update profile
        response = self.client.patch(f'/api/health/{profile.id}/', {
            'blood_type': 'A+',
            'allergies': 'Updated allergy info'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['blood_type'], 'A+')

    def test_health_profile_summary(self):
        """Test health profile summary endpoint."""
        HealthProfile.objects.create(
            user=self.user,
            gender='male',
            height=180,
            weight=75,
            blood_type='O+'
        )

        response = self.client.get('/api/health/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('bmi', response.data)
        self.assertIn('bmi_category', response.data)

    def test_change_password(self):
        """Test change password endpoint."""
        response = self.client.post('/api/users/change_password/', {
            'old_password': 'testpass123',
            'new_password': 'newpass456'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try login with new password
        self.client.credentials()  # Clear auth
        token_response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'newpass456'
        })
        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
