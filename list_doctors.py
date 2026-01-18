import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_platform.settings')
django.setup()

from healthcare.models import Doctor

print(f"{'ID':<5} | {'Name':<30} | {'Specialization':<20} | {'User ID':<8}")
print("-" * 70)
for doctor in Doctor.objects.all():
    name = doctor.user.get_full_name()
    if not name:
        name = doctor.user.username
    print(f"{doctor.id:<5} | {name:<30} | {doctor.specialization:<20} | {doctor.user.id:<8}")
