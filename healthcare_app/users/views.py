from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import CreateView, UpdateView, ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .forms import (
    CustomUserCreationForm, 
    CustomUserUpdateForm,
    PatientProfileForm,
    DoctorProfileForm,
    FamilyMemberForm
)
from .models import CustomUser, PatientProfile, DoctorProfile, FamilyMember
from django.views.generic import DeleteView


class SignUpView(CreateView):
    """User registration view."""
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'users/signup.html'
    
    def form_valid(self, form):
        """Auto-login after successful registration."""
        response = super().form_valid(form)
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password1')
        user = authenticate(username=username, password=password)
        login(self.request, user)
        messages.success(self.request, 'Registration successful!')
        return response


class ProfileView(LoginRequiredMixin, DetailView):
    """User profile detail view."""
    model = CustomUser
    template_name = 'users/profile.html'
    context_object_name = 'profile_user'
    
    def get_object(self):
        return self.request.user
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.get_object()
        
        # Add appropriate profile based on user type
        if hasattr(user, 'patient_profile'):
            context['user_profile'] = user.patient_profile
        elif hasattr(user, 'doctor_profile'):
            context['user_profile'] = user.doctor_profile
        
        # Add family members
        context['family_members'] = user.family_members.all()
        return context


class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    """Update user profile information."""
    model = CustomUser
    form_class = CustomUserUpdateForm
    template_name = 'users/profile_update.html'
    success_url = reverse_lazy('profile')
    
    def get_object(self):
        return self.request.user
    
    def form_valid(self, form):
        messages.success(self.request, 'Profile updated successfully!')
        return super().form_valid(form)


class PatientProfileUpdateView(LoginRequiredMixin, UpdateView):
    """Update patient-specific profile."""
    model = PatientProfile
    form_class = PatientProfileForm
    template_name = 'users/patient_profile_update.html'
    success_url = reverse_lazy('profile')
    
    def get_object(self):
        return get_object_or_404(PatientProfile, user=self.request.user)
    
    def form_valid(self, form):
        messages.success(self.request, 'Patient profile updated successfully!')
        return super().form_valid(form)


class DoctorProfileUpdateView(LoginRequiredMixin, UpdateView):
    """Update doctor-specific profile."""
    model = DoctorProfile
    form_class = DoctorProfileForm
    template_name = 'users/doctor_profile_update.html'
    success_url = reverse_lazy('profile')
    
    def get_object(self):
        return get_object_or_404(DoctorProfile, user=self.request.user)
    
    def form_valid(self, form):
        messages.success(self.request, 'Doctor profile updated successfully!')
        return super().form_valid(form)


class FamilyMemberListView(LoginRequiredMixin, ListView):
    """List all family members."""
    model = FamilyMember
    template_name = 'users/family_members.html'
    context_object_name = 'family_members'
    
    def get_queryset(self):
        return FamilyMember.objects.filter(main_user=self.request.user)


class FamilyMemberCreateView(LoginRequiredMixin, CreateView):
    """Add new family member."""
    model = FamilyMember
    form_class = FamilyMemberForm
    template_name = 'users/family_member_form.html'
    success_url = reverse_lazy('family_members')
    
    def form_valid(self, form):
        form.instance.main_user = self.request.user
        messages.success(self.request, 'Family member added successfully!')
        return super().form_valid(form)


class FamilyMemberUpdateView(LoginRequiredMixin, UpdateView):
    """Update family member information."""
    model = FamilyMember
    form_class = FamilyMemberForm
    template_name = 'users/family_member_form.html'
    success_url = reverse_lazy('family_members')
    
    def get_queryset(self):
        return FamilyMember.objects.filter(main_user=self.request.user)
    
    def form_valid(self, form):
        messages.success(self.request, 'Family member updated successfully!')
        return super().form_valid(form)


class FamilyMemberDeleteView(LoginRequiredMixin, DeleteView):
    """Delete family member."""
    model = FamilyMember
    template_name = 'users/family_member_confirm_delete.html'
    success_url = reverse_lazy('family_members')
    
    def get_queryset(self):
        return FamilyMember.objects.filter(main_user=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        messages.success(request, 'Family member deleted successfully!')
        return super().delete(request, *args, **kwargs)


# Additional views
@login_required
def dashboard(request):
    """User dashboard based on user type."""
    user = request.user
    
    if user.user_type == CustomUser.UserType.DOCTOR:
        template = 'users/doctor_dashboard.html'
        context = {
            'appointments_today': 0,  # Replace with actual logic
            'total_patients': 0,  # Replace with actual logic
        }
    elif user.user_type == CustomUser.UserType.PATIENT:
        template = 'users/patient_dashboard.html'
        context = {
            'upcoming_appointments': 0,  # Replace with actual logic
            'recent_records': [],  # Replace with actual logic
        }
    else:
        template = 'users/dashboard.html'
        context = {}
    
    return render(request, template, context)


def user_type_redirect(request):
    """Redirect users based on their type after login."""
    user = request.user
    if user.user_type == CustomUser.UserType.DOCTOR:
        return redirect('doctor_dashboard')
    elif user.user_type == CustomUser.UserType.PATIENT:
        return redirect('patient_dashboard')
    else:
        return redirect('dashboard')