"""
Permission classes for role-based access control in the healthcare API.

These permissions enforce that only users with specific roles can access
certain endpoints.
"""

from rest_framework import permissions
from users.models import CustomUser


class IsPatient(permissions.BasePermission):
    """
    Permission to check if the user is a patient.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == CustomUser.UserType.PATIENT
        )


class IsDoctor(permissions.BasePermission):
    """
    Permission to check if the user is a doctor.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == CustomUser.UserType.DOCTOR
        )


class IsAdminUser(permissions.BasePermission):
    """
    Permission to check if the user is an admin.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == CustomUser.UserType.ADMIN
        )


class IsPatientOrDoctor(permissions.BasePermission):
    """
    Permission to check if the user is either a patient or a doctor.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type in [
                CustomUser.UserType.PATIENT,
                CustomUser.UserType.DOCTOR
            ]
        )


class IsPatientOrAdmin(permissions.BasePermission):
    """
    Permission to check if the user is either a patient or an admin.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type in [
                CustomUser.UserType.PATIENT,
                CustomUser.UserType.ADMIN
            ]
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission to check if the user is the owner of the object.
    Allows read-only access for other authenticated users.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Write permissions are only allowed to the owner
        return obj.user == request.user
