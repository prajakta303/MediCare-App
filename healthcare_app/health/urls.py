from django.urls import path
from . import views

app_name = 'health'

urlpatterns = [
    path('profile/', views.health_profile_view, name='health_profile'),
    path('profile/edit/', views.health_profile_edit, name='health_profile_edit'),
    path('profile/json/', views.health_profile_json, name='health_profile_json'),

]