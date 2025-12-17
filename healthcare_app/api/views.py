"""
API views for healthcare application.

DRF ViewSets for user management, health profiles, and authentication.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import CustomUser, PatientProfile, DoctorProfile, FamilyMember
from health.models import HealthProfile

from .serializers import (
    CustomUserSerializer, CustomUserCreateSerializer,
    PatientProfileSerializer, DoctorProfileSerializer,
    HealthProfileSerializer, FamilyMemberSerializer
)
from .permissions import (
    IsPatient, IsDoctor, IsAdminUser,
    IsPatientOrDoctor, IsOwnerOrReadOnly
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user information.
    """
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['user_id'] = user.id
        token['username'] = user.username
        token['user_type'] = user.user_type
        token['email'] = user.email

        return token

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = user.id
        token['username'] = user.username
        token['user_type'] = user.user_type
        token['email'] = user.email
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token endpoint with user information.
    
    POST /api/token/
    - username: str
    - password: str
    
    Returns:
    - access: JWT access token (5 min lifetime)
    - refresh: JWT refresh token (1 day lifetime)
    """
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    Logout endpoint that blacklists the refresh token.
    
    POST /api/logout/
    - refresh: str (refresh token to blacklist)
    
    Returns:
    - success: Logout successful message
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Blacklist the refresh token on logout."""
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'success': 'Logout successful. Token blacklisted.'},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CustomUser model.
    
    List, create, retrieve, update, and delete users.
    Only admins can list all users; patients/doctors see only their own profile.
    """
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'create':
            return CustomUserCreateSerializer
        return CustomUserSerializer

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        
        # Admins can see all users
        if user.user_type == CustomUser.UserType.ADMIN:
            return CustomUser.objects.all()
        
        # Patients and doctors can only see themselves
        return CustomUser.objects.filter(id=user.id)

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == 'create':
            # Allow unauthenticated registration
            return [permissions.AllowAny()]
        elif self.action == 'destroy':
            # Only admins can delete
            return [IsAdminUser()]
        elif self.action == 'list':
            # Allow any authenticated user to list (queryset is filtered)
            return [permissions.IsAuthenticated()]
        else:
            # Authenticated users can retrieve/update
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user's profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change user password."""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': 'Both old and new passwords are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'success': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )


class PatientProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PatientProfile model.
    
    Patients can view/edit their own profile.
    Doctors can view patient profiles they are associated with.
    """
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientOrDoctor]

    def get_queryset(self):
        """Filter based on user role."""
        user = self.request.user

        if user.user_type == CustomUser.UserType.PATIENT:
            # Patients can only see their own profile
            return PatientProfile.objects.filter(user=user)
        elif user.user_type == CustomUser.UserType.DOCTOR:
            # Doctors can see all patient profiles (in real app, restrict to assigned patients)
            return PatientProfile.objects.all()
        elif user.user_type == CustomUser.UserType.ADMIN:
            # Admins can see all profiles
            return PatientProfile.objects.all()

        return PatientProfile.objects.none()

    def perform_create(self, serializer):
        """Create profile for current user."""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Update profile."""
        serializer.save()


class DoctorProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for DoctorProfile model.
    
    Doctors can view/edit their own profile.
    Patients and admins can view doctor profiles.
    """
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter based on user role."""
        user = self.request.user

        if user.user_type == CustomUser.UserType.DOCTOR:
            # Doctors can only see their own profile
            return DoctorProfile.objects.filter(user=user)
        else:
            # Patients, admins can see all doctor profiles
            return DoctorProfile.objects.all()

    def perform_create(self, serializer):
        """Create profile for current user."""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Update profile."""
        serializer.save()


class HealthProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for HealthProfile model.
    
    Patients manage their own health profile.
    Doctors can view assigned patient health profiles.
    """
    queryset = HealthProfile.objects.all()
    serializer_class = HealthProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientOrDoctor]

    def get_queryset(self):
        """Filter based on user role."""
        user = self.request.user

        if user.user_type == CustomUser.UserType.PATIENT:
            # Patients can only see their own profile
            return HealthProfile.objects.filter(user=user)
        elif user.user_type == CustomUser.UserType.DOCTOR:
            # Doctors can see all patient health profiles
            return HealthProfile.objects.all()
        elif user.user_type == CustomUser.UserType.ADMIN:
            # Admins can see all profiles
            return HealthProfile.objects.all()

        return HealthProfile.objects.none()

    def perform_create(self, serializer):
        """Create profile for current user."""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Update profile."""
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def summary(self, request):
        """Get health profile summary with calculated metrics."""
        try:
            # HealthProfile related_name is `health_profile` on the user model
            profile = request.user.health_profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except HealthProfile.DoesNotExist:
            return Response(
                {'error': 'Health profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class FamilyMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FamilyMember model.
    
    Patients can manage their family member contacts.
    """
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get_queryset(self):
        """Only show family members for the current user."""
        return FamilyMember.objects.filter(main_user=self.request.user)

    def perform_create(self, serializer):
        """Create family member for current user."""
        serializer.save(main_user=self.request.user)
