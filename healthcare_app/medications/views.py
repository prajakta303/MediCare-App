# medications/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
import logging

from .models import *
from .serializers import *
from users.models import CustomUser

logger = logging.getLogger(__name__)

class PatientMedicationViewSet(viewsets.ModelViewSet):
    """ViewSet for patient medications"""
    serializer_class = PatientMedicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Patients can see their own medications
        if user.user_type == 'patient':
            return PatientMedication.objects.filter(patient=user, is_active=True)
        
        # Doctors can see medications of their patients
        elif user.user_type == 'doctor':
            # Assuming doctor-patient relationship exists
            # You may need to adjust this based on your actual relationship model
            patient_ids = []  # Get patient IDs from doctor-patient relationship
            return PatientMedication.objects.filter(patient_id__in=patient_ids)
        
        return PatientMedication.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active medications"""
        medications = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(medications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired medications"""
        medications = self.get_queryset().filter(
            end_date__lt=timezone.now().date()
        )
        serializer = self.get_serializer(medications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a medication"""
        medication = self.get_object()
        medication.is_active = False
        medication.save()
        
        # Also deactivate all reminders
        medication.reminders.update(is_active=False)
        
        serializer = self.get_serializer(medication)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def refill(self, request, pk=None):
        """Refill medication"""
        medication = self.get_object()
        
        # Update remaining quantity
        if medication.total_quantity and medication.remaining_quantity is not None:
            medication.remaining_quantity = medication.total_quantity
            
            # Decrease refills if applicable
            if medication.refills_remaining > 0:
                medication.refills_remaining -= 1
            
            medication.save()
        
        serializer = self.get_serializer(medication)
        return Response(serializer.data)


class MedicationReminderViewSet(viewsets.ModelViewSet):
    """ViewSet for medication reminders"""
    serializer_class = MedicationReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'patient':
            return MedicationReminder.objects.filter(
                medication__patient=user,
                is_active=True
            )
        
        return MedicationReminder.objects.none()
    
    @action(detail=False, methods=['get'])
    def todays_reminders(self, request):
        """Get today's reminders"""
        today_weekday = timezone.now().weekday()  # Monday=0, Sunday=6
        
        reminders = self.get_queryset().filter(
            days_of_week__contains=today_weekday
        ).order_by('reminder_time')
        
        serializer = self.get_serializer(reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def trigger(self, request, pk=None):
        """Mark reminder as triggered"""
        reminder = self.get_object()
        reminder.last_triggered = timezone.now()
        reminder.save()
        
        # Create medication log entry
        MedicationLog.objects.create(
            medication=reminder.medication,
            reminder=reminder,
            scheduled_time=timezone.now(),
            status='taken',
            dosage_taken=reminder.medication.dosage,
            confirmation_method='reminder',
            confirmed_by=request.user
        )
        
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)


class MedicationLogViewSet(viewsets.ModelViewSet):
    """ViewSet for medication logs"""
    serializer_class = MedicationLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'patient':
            return MedicationLog.objects.filter(
                medication__patient=user
            ).order_by('-scheduled_time')
        
        return MedicationLog.objects.none()
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's medication logs"""
        today = timezone.now().date()
        
        logs = self.get_queryset().filter(
            scheduled_time__date=today
        )
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def log_manual(self, request):
        """Log medication intake manually"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Set actual time to now if not provided
            if not serializer.validated_data.get('actual_time'):
                serializer.validated_data['actual_time'] = timezone.now()
            
            serializer.save(confirmed_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MedicationCheckView(APIView):
    """Check medication safety and interactions"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MedicationCheckSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            medications = serializer.validated_data['medications']
            patient_id = serializer.validated_data.get('patient_id')
            existing_conditions = serializer.validated_data.get('existing_conditions', [])
            
            # Check for drug interactions
            interactions = []
            for i in range(len(medications)):
                for j in range(i + 1, len(medications)):
                    interaction = DrugInteraction.objects.filter(
                        Q(medication_1__iexact=medications[i], medication_2__iexact=medications[j]) |
                        Q(medication_1__iexact=medications[j], medication_2__iexact=medications[i])
                    ).first()
                    
                    if interaction:
                        interactions.append({
                            'medication_1': medications[i],
                            'medication_2': medications[j],
                            'severity': interaction.severity,
                            'description': interaction.description,
                            'recommendation': interaction.recommendation
                        })
            
            # Check for existing patient conditions
            warnings = []
            if patient_id:
                try:
                    patient = CustomUser.objects.get(id=patient_id, user_type='patient')
                    
                    # Get patient's current medications
                    current_meds = PatientMedication.objects.filter(
                        patient=patient,
                        is_active=True
                    ).values_list('name', flat=True)
                    
                    # Add current meds to interaction check
                    all_meds = list(current_meds) + medications
                    
                    for med in medications:
                        # Check for duplicates
                        if med in current_meds:
                            warnings.append({
                                'type': 'duplicate',
                                'medication': med,
                                'message': f'Patient is already taking {med}'
                            })
                
                except CustomUser.DoesNotExist:
                    pass
            
            return Response({
                'medications_checked': medications,
                'interactions': interactions,
                'warnings': warnings,
                'timestamp': timezone.now()
            })
            
        except Exception as e:
            logger.error(f"Medication check error: {str(e)}")
            return Response(
                {'error': 'Failed to perform medication check'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MedicationAdherenceView(APIView):
    """Get medication adherence statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.user_type != 'patient':
            return Response(
                {'error': 'Only patients can view adherence data'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all active medications
        medications = PatientMedication.objects.filter(
            patient=user,
            is_active=True
        )
        
        adherence_data = []
        overall_taken = 0
        overall_total = 0
        
        for med in medications:
            logs = med.logs.all()
            total = logs.count()
            taken = logs.filter(status__in=['taken', 'late']).count()
            missed = logs.filter(status='missed').count()
            
            adherence_rate = (taken / total * 100) if total > 0 else 0
            
            last_taken = logs.filter(status__in=['taken', 'late']).order_by('-scheduled_time').first()
            
            adherence_data.append({
                'medication_id': med.medication_id,
                'medication_name': med.name,
                'total_doses': total,
                'taken_doses': taken,
                'missed_doses': missed,
                'adherence_rate': round(adherence_rate, 2),
                'last_taken': last_taken.scheduled_time if last_taken else None
            })
            
            overall_taken += taken
            overall_total += total
        
        overall_adherence = (overall_taken / overall_total * 100) if overall_total > 0 else 0
        
        # Weekly adherence trend
        week_ago = timezone.now() - timezone.timedelta(days=7)
        weekly_logs = MedicationLog.objects.filter(
            medication__patient=user,
            scheduled_time__gte=week_ago
        )
        
        weekly_taken = weekly_logs.filter(status__in=['taken', 'late']).count()
        weekly_total = weekly_logs.count()
        weekly_adherence = (weekly_taken / weekly_total * 100) if weekly_total > 0 else 0
        
        return Response({
            'overall_adherence': round(overall_adherence, 2),
            'weekly_adherence': round(weekly_adherence, 2),
            'medications': adherence_data,
            'total_medications': medications.count(),
            'active_medications': medications.filter(is_active=True).count(),
            'summary': {
                'total_doses': overall_total,
                'taken_doses': overall_taken,
                'missed_doses': overall_total - overall_taken
            }
        })


class PrescriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for prescriptions"""
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'patient':
            return Prescription.objects.filter(patient=user)
        elif user.user_type == 'doctor':
            return Prescription.objects.filter(doctor=user)
        
        return Prescription.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if user.user_type != 'doctor':
            raise PermissionError("Only doctors can create prescriptions")
        
        serializer.save(doctor=user)
    
    @action(detail=True, methods=['post'])
    def safety_scan(self, request, pk=None):
        """Perform safety scan on prescription"""
        prescription = self.get_object()
        
        # TODO: Integrate with AI services for OCR and safety checking
        # This is a placeholder implementation
        
        prescription.safety_scan_performed = True
        prescription.scan_timestamp = timezone.now()
        prescription.save()
        
        return Response({
            'prescription_id': str(prescription.prescription_id),
            'safety_scan_performed': True,
            'scan_timestamp': prescription.scan_timestamp,
            'message': 'Safety scan completed (placeholder)'
        })


class DrugInteractionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for drug interactions"""
    serializer_class = DrugInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DrugInteraction.objects.all()
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check interaction between medications"""
        med1 = request.query_params.get('medication1')
        med2 = request.query_params.get('medication2')
        
        if not med1 or not med2:
            return Response(
                {'error': 'Both medication1 and medication2 parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        interaction = DrugInteraction.objects.filter(
            Q(medication_1__iexact=med1, medication_2__iexact=med2) |
            Q(medication_1__iexact=med2, medication_2__iexact=med1)
        ).first()
        
        if interaction:
            serializer = self.get_serializer(interaction)
            return Response(serializer.data)
        
        return Response({
            'medication1': med1,
            'medication2': med2,
            'interaction_found': False,
            'message': 'No known interaction found'
        })