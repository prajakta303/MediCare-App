"""
URL configuration for healthcare_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health/', include('health.urls')),
]

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # Template-based URLs (keep for admin interface)
    path('users/', include('users.urls')),  # Your existing template URLs
    
    # API URLs
    path('api/auth/', include('users.api_urls')),  # New API endpoints
    path('api/health/', include('health.urls')),   # Your health app URLs
]
