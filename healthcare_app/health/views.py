from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.generic import UpdateView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin

from .models import HealthProfile
from .forms import HealthProfileForm

@login_required
def health_profile_view(request):
    """View to display the health profile"""
    try:
        profile = HealthProfile.objects.get(user=request.user)
    except HealthProfile.DoesNotExist:
        # Create a health profile if it doesn't exist
        profile = HealthProfile.objects.create(user=request.user)
        messages.info(request, "We've created a health profile for you. Please fill in your information.")
        return redirect('health:health_profile_edit')
    
    # Calculate BMI and category
    bmi = profile.calculate_bmi()
    bmi_category = profile.get_bmi_category()
    
    context = {
        'profile': profile,
        'bmi': bmi,
        'bmi_category': bmi_category,
        'completion_percentage': calculate_profile_completion(profile),
    }
    
    return render(request, 'health/profile.html', context)

@login_required
def health_profile_edit(request):
    """View to edit health profile"""
    profile, created = HealthProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        form = HealthProfileForm(request.POST, instance=profile)
        if form.is_valid():
            health_profile = form.save(commit=False)
            health_profile.last_updated_by = request.user
            health_profile.save()
            
            messages.success(request, 'Health profile updated successfully!')
            return redirect('health:health_profile')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = HealthProfileForm(instance=profile)
    
    context = {
        'form': form,
        'profile': profile,
    }
    
    return render(request, 'health/profile_edit.html', context)

@login_required
def health_profile_json(request):
    """API endpoint to get health profile as JSON"""
    profile = get_object_or_404(HealthProfile, user=request.user)
    
    fields = [
        'blood_type',
        'allergies',
        'current_medications',
        'medical_conditions',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
    ]
    filled = 0
    for f in fields:
        val = getattr(profile, f, None)
        if val:   # non-empty string or value counts as filled
            filled += 1

    # Avoid division by zero and clamp to 0-100
    total = len(fields) or 1
    completion_percentage = int((filled / total) * 100)
    if completion_percentage < 0:
        completion_percentage = 0
    if completion_percentage > 100:
        completion_percentage = 100

    data = {
        'user': {
            'name': profile.user.get_full_name(),
            'email': profile.user.email,
            'phone': profile.user.phone,
            'date_of_birth': profile.user.date_of_birth,
        },
        'demographics': {
            'gender': profile.gender,
            'height': float(profile.height) if profile.height else None,
            'weight': float(profile.weight) if profile.weight else None,
            'blood_type': profile.blood_type,
        },
        'medical': {
            'allergies': profile.allergies,
            'current_medications': profile.current_medications,
            'medical_conditions': profile.medical_conditions,
            'surgical_history': profile.surgical_history,
            'family_history': profile.family_history,
        },
        'lifestyle': {
            'smoking_status': profile.smoking_status,
            'alcohol_consumption': profile.alcohol_consumption,
            'exercise_frequency': profile.exercise_frequency,
        },
        'emergency_contact': {
            'name': profile.emergency_contact_name,
            'phone': profile.emergency_contact_phone,
            'relation': profile.emergency_contact_relation,
        },
        'bmi': profile.calculate_bmi(),
        'bmi_category': profile.get_bmi_category(),
    }
    return render(request, 'health/profile.html', {
        'profile': profile,
        'completion_percentage': completion_percentage,
    })
    

def calculate_profile_completion(profile):
    """Calculate what percentage of the health profile is complete"""
    important_fields = [
        'blood_type', 'allergies', 'current_medications', 'medical_conditions',
        'emergency_contact_name', 'emergency_contact_phone'
    ]
    
    completed = sum(1 for field in important_fields if getattr(profile, field))
    return int((completed / len(important_fields)) * 100)

# Class-based view for profile editing
class HealthProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = HealthProfile
    form_class = HealthProfileForm
    template_name = 'health/profile_edit.html'
    success_url = reverse_lazy('health_profile')
    
    def get_object(self):
        # Get or create health profile for the current user
        obj, created = HealthProfile.objects.get_or_create(user=self.request.user)
        return obj
    
    def form_valid(self, form):
        form.instance.last_updated_by = self.request.user
        messages.success(self.request, 'Health profile updated successfully!')
        return super().form_valid(form)