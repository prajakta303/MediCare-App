from django.conf import settings
from rest_framework.test import APIClient
from users.models import CustomUser

# Ensure testserver is allowed when running outside test runner
settings.ALLOWED_HOSTS = ['testserver', '127.0.0.1', 'localhost']

client = APIClient()
# Create test user
user, created = CustomUser.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@test.com',
        'user_type': CustomUser.UserType.PATIENT,
    }
)
if created:
    user.set_password('testpass123')
    user.save()
# Obtain token
resp = client.post('/api/token/', {'username':'testuser','password':'testpass123'})
print('token status', resp.status_code, resp.data)
access = resp.data.get('access')
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
# Attempt to create health profile
payload = {
    'gender': 'M',
    'height': 180,
    'weight': 75,
    'blood_type': 'O+',
    'allergies': 'Peanuts',
    'current_medications': 'None',
    'medical_conditions': 'None',
    'surgical_history': 'None',
    'family_history': 'None'
}
response = client.post('/api/health/', payload)
print('create health status', response.status_code)
print(response.data)
