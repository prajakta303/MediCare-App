from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Authentication
    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='users/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/update/', views.ProfileUpdateView.as_view(), name='profile_update'),
    
    # User type specific profile updates
    path('profile/patient/update/', views.PatientProfileUpdateView.as_view(), name='patient_profile_update'),
    path('profile/doctor/update/', views.DoctorProfileUpdateView.as_view(), name='doctor_profile_update'),
    
    # Family Members
    path('family-members/', views.FamilyMemberListView.as_view(), name='family_members'),
    path('family-members/add/', views.FamilyMemberCreateView.as_view(), name='family_member_add'),
    path('family-members/<int:pk>/edit/', views.FamilyMemberUpdateView.as_view(), name='family_member_edit'),
    path('family-members/<int:pk>/delete/', views.FamilyMemberDeleteView.as_view(), name='family_member_delete'),
    
    # Dashboard
    path('dashboard/', views.dashboard, name='dashboard'),
    path('redirect/', views.user_type_redirect, name='user_type_redirect'),
    
    # Password Reset
    path('password-reset/', 
         auth_views.PasswordResetView.as_view(template_name='users/password_reset.html'), 
         name='password_reset'),
    path('password-reset/done/', 
         auth_views.PasswordResetDoneView.as_view(template_name='users/password_reset_done.html'), 
         name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(template_name='users/password_reset_confirm.html'), 
         name='password_reset_confirm'),
    path('password-reset-complete/', 
         auth_views.PasswordResetCompleteView.as_view(template_name='users/password_reset_complete.html'), 
         name='password_reset_complete'),
]