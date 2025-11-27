# health/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.health_profile_view, name='health_profile'),
    path('profile/edit/', views.health_profile_edit, name='health_profile_edit'),
]