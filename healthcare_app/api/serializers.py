"""
Serializers for healthcare API endpoints.

Converts model instances to/from JSON for REST API communication.
"""

from rest_framework import serializers
from users.models import CustomUser, PatientProfile, DoctorProfile, FamilyMember
from health.models import HealthProfile


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomUser model.
    
    Includes basic user information and role. Passwords are write-only.
    """
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone', 'date_of_birth', 'address',
            'profile_picture', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomUserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new CustomUser.
    
    Includes password field (write-only) for registration.
    """
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'user_type', 'phone',
            'date_of_birth', 'address'
        ]

    def validate(self, data):
        """Ensure both passwords match."""
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        """Create user with hashed password."""
        user = CustomUser.objects.create_user(**validated_data)
        return user


class PatientProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for PatientProfile model.
    
    Includes nested user information for context.
    """
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'user_id', 'blood_type',
            'allergies', 'chronic_conditions',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for DoctorProfile model.
    
    Includes nested user information and professional details.
    """
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'user_id', 'specialization',
            'license_number', 'consultation_fee', 'availability',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HealthProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for HealthProfile model.
    
    Includes comprehensive health information and calculated BMI.
    """
    user = CustomUserSerializer(read_only=True)
    bmi = serializers.SerializerMethodField()
    bmi_category = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = HealthProfile
        fields = [
              'id', 'user', 'gender', 'height', 'weight', 'blood_type',
              'allergies', 'current_medications', 'medical_conditions',
              'surgical_history', 'family_history', 'smoking_status',
              'alcohol_consumption', 'exercise_frequency', 'bmi', 'bmi_category',
              'primary_doctor_name', 'primary_doctor_phone', 'primary_doctor_clinic',
              'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
              'insurance_provider', 'insurance_id', 'insurance_group', 'additional_notes', 'is_complete',
              'completion_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'bmi', 'bmi_category', 'completion_percentage', 'created_at', 'updated_at']

    def get_bmi(self, obj):
        """Calculate and return BMI."""
        return obj.calculate_bmi()

    def get_bmi_category(self, obj):
        """Get BMI category."""
        return obj.get_bmi_category()

    def get_completion_percentage(self, obj):
        """Calculate completion percentage of profile."""
        # Count filled fields (not None and not empty string)
        required_fields = [
              'gender', 'height', 'weight', 'blood_type',
              'allergies', 'current_medications', 'medical_conditions'
        ]
        filled = sum(1 for field in required_fields if getattr(obj, field))
        return int((filled / len(required_fields)) * 100)


class FamilyMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for FamilyMember model.
    
    Includes family relationship information and permissions.
    """
    class Meta:
        model = FamilyMember
        fields = [
            'id', 'main_user', 'name', 'relationship', 'email',
            'phone', 'date_of_birth', 'can_view', 'can_edit',
            'emergency_contact_priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'main_user', 'created_at', 'updated_at']
