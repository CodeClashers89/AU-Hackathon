"""
URL configuration for dpi_platform project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from accounts.views import user_logout
import healthcare.views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('logout/', user_logout, name='logout'),
    
    # API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/core/', include('core.urls')),
    path('api/healthcare/', include('healthcare.urls')),
    path('api/city/', include('city_services.urls')),
    path('api/agriculture/', include('agriculture.urls')),
    
    path('social-auth/', include('social_django.urls', namespace='social')),
    
    # Frontend views
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('register/', TemplateView.as_view(template_name='register.html'), name='register'),
    path('forgot-password/', TemplateView.as_view(template_name='forgot_password.html'), name='forgot-password'),
    path('citizen/', TemplateView.as_view(template_name='citizen/portal.html'), name='citizen-portal'),
    path('doctor/', include([
        path('', healthcare.views.doctor_dashboard, name='doctor-dashboard'),
    ])),
    path('city-staff/', TemplateView.as_view(template_name='city/staff_dashboard.html'), name='city-staff-dashboard'),
    path('agri-officer/', TemplateView.as_view(template_name='agriculture/officer_dashboard.html'), name='agri-officer-dashboard'),
    path('admin-dashboard/', TemplateView.as_view(template_name='admin/dashboard.html'), name='admin-dashboard'),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

