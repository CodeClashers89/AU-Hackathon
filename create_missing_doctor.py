import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_platform.settings')
django.setup()

from accounts.models import CustomUser
from healthcare.models import Doctor

try:
    user = CustomUser.objects.get(username='poojan34')
    
    if hasattr(user, 'doctor_profile'):
        print(f"Doctor profile already exists for {user.username}")
    else:
        print(f"Creating doctor profile for {user.username}...")
        Doctor.objects.create(
            user=user,
            specialization='General Medicine',
            qualification='MBBS',
            license_number='REG-POOJAN-001',
            experience_years=5,
            consultation_fee=500.00,
            hospital_affiliation='City Hospital',
            is_available=True
        )
        print("Successfully created Doctor profile for Poojan Kamani.")
        
except CustomUser.DoesNotExist:
    print("User poojan34 not found.")
except Exception as e:
    print(f"Error: {e}")
