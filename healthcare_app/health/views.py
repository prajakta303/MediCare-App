# health/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from .models import HealthProfile
from .forms import HealthProfileForm

@login_required
def health_profile_view(request):
    """Display user's health profile"""
    profile = get_object_or_404(HealthProfile, user=request.user)
    return render(request, 'health/profile.html', {'profile': profile})

@login_required
@require_http_methods(["GET", "POST"])
def health_profile_edit(request):
    """Edit health profile - handles both display and update"""
    profile = get_object_or_404(HealthProfile, user=request.user)
    
    if request.method == 'POST':
        form = HealthProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Health profile updated successfully!')
            return redirect('health_profile')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = HealthProfileForm(instance=profile)
    
    return render(request, 'health/profile_edit.html', {'form': form})

# health/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.health_profile_view, name='health_profile'),
    path('profile/edit/', views.health_profile_edit, name='health_profile_edit'),
]