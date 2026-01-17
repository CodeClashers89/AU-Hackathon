from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """Extended user model with role-based access"""
    
    ROLE_CHOICES = (
        ('citizen', 'Citizen'),
        ('doctor', 'Doctor'),
        ('city_staff', 'City Staff'),
        ('agri_officer', 'Agricultural Officer'),
        ('admin', 'Government Admin'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    class Meta:
        ordering = ['-created_at']


class UserProfile(models.Model):
    """Additional user profile information"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    face_token = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"


class ApprovalRequest(models.Model):
    """Workflow for approving service providers"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='approval_requests')
    request_type = models.CharField(max_length=20)  # doctor, city_staff, agri_officer
    documents = models.FileField(upload_to='approval_docs/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_approvals')
    
    def __str__(self):
        return f"{self.user.username} - {self.request_type} ({self.status})"
    
    class Meta:
        ordering = ['-requested_at']


class OTP(models.Model):
    """OTP for email/phone verification"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otps')
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20)  # registration, password_reset
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"OTP for {self.user.username} - {self.purpose}"
    
    class Meta:
        ordering = ['-created_at']
