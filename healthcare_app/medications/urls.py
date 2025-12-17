# medications/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patient-medications', views.PatientMedicationViewSet, basename='patient-medication')
router.register(r'reminders', views.MedicationReminderViewSet, basename='reminder')
router.register(r'logs', views.MedicationLogViewSet, basename='log')
router.register(r'prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register(r'interactions', views.DrugInteractionViewSet, basename='interaction')

urlpatterns = [
    path('', include(router.urls)),
    
    # Safety checking
    path('check/', views.MedicationCheckView.as_view(), name='medication-check'),
    
    # Adherence tracking
    path('adherence/', views.MedicationAdherenceView.as_view(), name='medication-adherence'),
    
    # Today's reminders
    path('reminders/today/', views.MedicationReminderViewSet.as_view({'get': 'todays_reminders'}), name='todays-reminders'),
    
    # Manual log entry
    path('logs/manual/', views.MedicationLogViewSet.as_view({'post': 'log_manual'}), name='log-manual'),
]