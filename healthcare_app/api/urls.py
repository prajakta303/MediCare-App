"""
URL configuration for API endpoints.

Defines routes for user management, health profiles, and JWT authentication.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    LogoutView,
    CustomUserViewSet,
    PatientProfileViewSet,
    DoctorProfileViewSet,
    HealthProfileViewSet,
    FamilyMemberViewSet
)

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'patients', PatientProfileViewSet, basename='patient-profile')
router.register(r'doctors', DoctorProfileViewSet, basename='doctor-profile')
router.register(r'health', HealthProfileViewSet, basename='health-profile')
router.register(r'family-members', FamilyMemberViewSet, basename='family-member')

# Define additional URL patterns
urlpatterns = [
    # JWT token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Include router URLs
    path('', include(router.urls)),
]
