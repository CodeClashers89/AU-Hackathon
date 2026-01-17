from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Service, ServiceRequest, SystemMetrics, ServiceProvider
from accounts.models import CustomUser
from datetime import timedelta
import random
import uuid

class Command(BaseCommand):
    help = 'Seeds real analytics data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding real analytics data...')
        
        # Ensure services exist
        healthcare, _ = Service.objects.get_or_create(service_type='healthcare', defaults={'name': 'Healthcare', 'description': 'Healthcare', 'icon': '🏥'})
        city, _ = Service.objects.get_or_create(service_type='city', defaults={'name': 'City Services', 'description': 'City Services', 'icon': '🏙️'})
        agriculture, _ = Service.objects.get_or_create(service_type='agriculture', defaults={'name': 'Agriculture', 'description': 'Agriculture', 'icon': '🌾'})
        
        # Get or create a citizen for requests
        citizen, _ = CustomUser.objects.get_or_create(username='test_citizen', defaults={'role': 'citizen', 'email': 'test@example.com'})
        
        # Clear existing requests to start fresh
        ServiceRequest.objects.all().delete()
        
        # Create requests for the last 7 days
        for i in range(7):
            date = timezone.now() - timedelta(days=i)
            # Random volume per day
            for _ in range(random.randint(5, 15)):
                service = random.choice([healthcare, city, agriculture])
                created_at = date - timedelta(hours=random.randint(1, 10))
                
                # Create completed requests with varied duration
                # Durations: Healthcare (30-120m), City (60-300m), Agri (45-180m)
                if service.service_type == 'healthcare':
                    duration = random.randint(30, 120)
                elif service.service_type == 'city':
                    duration = random.randint(60, 300)
                else:
                    duration = random.randint(45, 180)
                
                sr = ServiceRequest.objects.create(
                    service=service,
                    citizen=citizen,
                    title=f"Sample Request {uuid.uuid4().hex[:6]}",
                    description="Real data testing",
                    status='completed',
                    reference_id=uuid.uuid4().hex[:12].upper(),
                )
                # Override auto_now_add
                sr.created_at = created_at
                sr.completed_at = created_at + timedelta(minutes=duration)
                sr.save()

        # Create some pending requests today
        for _ in range(5):
            ServiceRequest.objects.create(
                service=random.choice([healthcare, city, agriculture]),
                citizen=citizen,
                title="Pending Request",
                description="Testing pending",
                status='pending',
                reference_id=uuid.uuid4().hex[:12].upper(),
            )

        # Create system metrics
        SystemMetrics.objects.all().delete()
        SystemMetrics.objects.create(
            cpu_usage=random.randint(20, 45),
            memory_usage=random.randint(40, 70),
            avg_response_time=random.uniform(0.045, 0.120),
            total_requests=ServiceRequest.objects.count()
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {ServiceRequest.objects.count()} requests and metrics!'))
