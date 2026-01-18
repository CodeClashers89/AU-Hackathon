from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('approvals', views.ApprovalRequestViewSet, basename='approval')
router.register('users', views.UserViewSet, basename='user')

urlpatterns = [
    path('register/', views.register, name='register'),
    path('api-register/', views.register, name='api-register'),
    path('api-login/', views.login, name='api-login'),
    
    # OTP and Password Reset
    path('verify-otp/', views.verify_otp, name='verify-otp'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
    
    path('login', views.login),
    path('login/face/', views.face_login, name='face-login'),
    path('profile/', views.profile, name='profile'),
    path('logout/', views.user_logout, name='logout'),
    path('', include(router.urls)),
]
