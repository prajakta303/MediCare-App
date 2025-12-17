from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import *
from users.models import PatientProfile, DoctorProfile
import uuid

User = get_user_model()

class MedicationModelTests(TestCase):
    def setUp(self):
        self.medication = Medication.objects.create(
            name="Test Medication",
            generic_name="Test Generic",
            strength="500mg",
            dosage_form="tablet",
            requires_prescription=True
        )
    
    def test_medication_creation(self):
        self.assertEqual(self.medication.name, "Test Medication")
        self.assertEqual(self.medication.strength, "500mg")
        self.assertTrue(self.medication.requires_prescription)
    
    def test_medication_str(self):
        self.assertEqual(str(self.medication), "Test Medication (500mg)")


class PrescriptionAPITests(APITestCase):
    def setUp(self):
        # Create test users
        self.patient_user = User.objects.create_user(
            email='patient@test.com',
            password='testpass123',
            first_name='John',
            last_name='Patient'
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            patient_id=uuid.uuid4()
        )
        
        self.doctor_user = User.objects.create_user(
            email='doctor@test.com',
            password='testpass123',
            first_name='Jane',
            last_name='Doctor',
            is_doctor=True
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            doctor_id=uuid.uuid4(),
            specialization='General Medicine'
        )
        
        # Create medication
        self.medication = Medication.objects.create(
            name="Test Drug",
            strength="100mg",
            dosage_form="tablet"
        )
        
        # Authenticate as doctor
        self.client.force_authenticate(user=self.doctor_user)
    
    def test_create_prescription(self):
        url = '/api/medications/prescriptions/'
        data = {
            'patient': str(self.patient_profile.patient_id),
            'issue_date': '2024-01-15T10:00:00Z',
            'instructions': 'Take once daily with food',
            'diagnosis': 'Hypertension'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['doctor_name'], 'Jane Doctor')
        self.assertEqual(response.data['status'], 'active')
    
    def test_patient_can_view_own_prescriptions(self):
        # Create prescription
        prescription = Prescription.objects.create(
            patient=self.patient_profile,
            doctor=self.doctor_profile,
            issue_date=timezone.now(),
            instructions='Test instructions'
        )
        
        # Switch to patient user
        self.client.force_authenticate(user=self.patient_user)
        
        url = f'/api/medications/prescriptions/{prescription.prescription_id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['patient_name'], 'John Patient')
    
    def test_unauthorized_access(self):
        # Create another patient
        other_patient_user = User.objects.create_user(
            email='other@test.com',
            password='testpass123'
        )
        other_patient_profile = PatientProfile.objects.create(
            user=other_patient_user,
            patient_id=uuid.uuid4()
        )
        
        # Create prescription for other patient
        prescription = Prescription.objects.create(
            patient=other_patient_profile,
            doctor=self.doctor_profile,
            issue_date=timezone.now(),
            instructions='Private prescription'
        )
        
        # Try to access as first patient
        self.client.force_authenticate(user=self.patient_user)
        
        url = f'/api/medications/prescriptions/{prescription.prescription_id}/'
        response = self.client.get(url)
        
        # Should return 404 (not 403) for privacy
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MedicationSafetyTests(TestCase):
    def setUp(self):
        # Create medications
        self.med1 = Medication.objects.create(name="Medication A", strength="50mg")
        self.med2 = Medication.objects.create(name="Medication B", strength="100mg")
        
        # Create interaction
        self.interaction = DrugInteraction.objects.create(
            medication_1=self.med1,
            medication_2=self.med2,
            severity='major',
            description='Serious interaction risk',
            mechanism='Pharmacokinetic interaction'
        )
    
    def test_interaction_detection(self):
        # Test bidirectional interaction
        interactions1 = DrugInteraction.objects.filter(medication_1=self.med1)
        interactions2 = DrugInteraction.objects.filter(medication_2=self.med1)
        
        self.assertTrue(interactions1.exists() or interactions2.exists())
    
    def test_interaction_str(self):
        expected = f"{self.med1.name} + {self.med2.name} (major)"
        self.assertEqual(str(self.interaction), expected)


class MedicationScheduleTests(APITestCase):
    def setUp(self):
        # Create patient
        self.patient_user = User.objects.create_user(
            email='patient@test.com',
            password='testpass123'
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            patient_id=uuid.uuid4()
        )
        
        # Create medication and prescription
        self.medication = Medication.objects.create(
            name="Schedule Test Drug",
            strength="10mg"
        )
        
        self.doctor_user = User.objects.create_user(
            email='doc@test.com',
            password='testpass123',
            is_doctor=True
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            doctor_id=uuid.uuid4()
        )
        
        self.prescription = Prescription.objects.create(
            patient=self.patient_profile,
            doctor=self.doctor_profile,
            issue_date=timezone.now(),
            instructions='Test'
        )
        
        self.prescribed_med = PrescribedMedication.objects.create(
            prescription=self.prescription,
            medication=self.medication,
            dosage="1 tablet",
            frequency="twice daily",
            quantity_prescribed=60,
            quantity_remaining=60
        )
        
        # Authenticate as patient
        self.client.force_authenticate(user=self.patient_user)
    
    def test_create_medication_schedule(self):
        url = '/api/medications/schedules/'
        data = {
            'patient': str(self.patient_profile.patient_id),
            'prescribed_med': str(self.prescribed_med.prescribed_med_id),
            'scheduled_time': '08:00:00',
            'days_of_week': [0, 1, 2, 3, 4],  # Weekdays
            'start_date': '2024-01-01',
            'reminder_offset_minutes': 15,
            'reminder_channels': ['push', 'email']
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'active')
        self.assertEqual(len(response.data['days_of_week']), 5)
    
    def test_get_todays_schedule(self):
        # Create schedule for today
        schedule = MedicationSchedule.objects.create(
            patient=self.patient_profile,
            prescribed_med=self.prescribed_med,
            scheduled_time='08:00:00',
            days_of_week=[timezone.now().weekday()],
            start_date=timezone.now().date()
        )
        
        url = '/api/medications/schedules/today/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['schedule_id'], str(schedule.schedule_id))
    
    def test_log_dose(self):
        # Create schedule
        schedule = MedicationSchedule.objects.create(
            patient=self.patient_profile,
            prescribed_med=self.prescribed_med,
            scheduled_time='08:00:00',
            days_of_week=[0, 1, 2, 3, 4],
            start_date=timezone.now().date()
        )
        
        url = f'/api/medications/schedules/{schedule.schedule_id}/log_dose/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(response.data['status'], ['taken', 'late'])
        
        # Check schedule stats updated
        schedule.refresh_from_db()
        self.assertEqual(schedule.taken_doses, 1)
        self.assertEqual(schedule.total_doses, 1)


class AdverseEventReportingTests(APITestCase):
    def setUp(self):
        self.patient_user = User.objects.create_user(
            email='patient@test.com',
            password='testpass123'
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            patient_id=uuid.uuid4()
        )
        
        self.medication = Medication.objects.create(
            name="Test Drug AE",
            strength="20mg"
        )
        
        self.client.force_authenticate(user=self.patient_user)
    
    def test_report_adverse_event(self):
        url = '/api/medications/adverse-events/'
        data = {
            'medication': str(self.medication.medication_id),
            'severity': 'moderate',
            'symptoms': ['rash', 'itching', 'nausea'],
            'onset_date': '2024-01-10',
            'action_taken': 'Stopped medication and took antihistamine'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['severity'], 'moderate')
        self.assertEqual(len(response.data['symptoms']), 3)
    
    def test_report_to_doctor(self):
        # Create adverse event first
        adverse_event = AdverseEvent.objects.create(
            patient=self.patient_profile,
            medication=self.medication,
            severity='moderate',
            symptoms=['headache', 'dizziness'],
            onset_date='2024-01-10'
        )
        
        url = f'/api/medications/adverse-events/{adverse_event.event_id}/report_to_doctor/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check updated
        adverse_event.refresh_from_db()
        self.assertTrue(adverse_event.reported_to_doctor)