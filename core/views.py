from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Service, ServiceProvider, ServiceRequest, SystemMetrics
from .serializers import (
    ServiceSerializer, ServiceProviderSerializer, 
    ServiceRequestSerializer, SystemMetricsSerializer
)

class ServiceViewSet(viewsets.ModelViewSet):
    """Service registry management"""
    serializer_class = ServiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'admin':
            return Service.objects.all()
        return Service.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ServiceRequestViewSet(viewsets.ModelViewSet):
    """Unified service request tracking"""
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'citizen':
            return ServiceRequest.objects.filter(citizen=user)
        elif user.role == 'admin':
            return ServiceRequest.objects.all()
        else:
            # Service providers see assigned requests
            return ServiceRequest.objects.filter(provider__user=user)
    
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """Get dashboard statistics"""
    from django.db.models import Count
    from accounts.models import CustomUser
    from healthcare.models import Appointment
    from city_services.models import Complaint
    from agriculture.models import FarmerQuery
    
    stats = {
        'total_users': CustomUser.objects.count(),
        'total_services': Service.objects.filter(is_active=True).count(),
        'total_requests': ServiceRequest.objects.count(),
        'pending_approvals': 0,
        'healthcare': {
            'total_appointments': Appointment.objects.count(),
            'pending_appointments': Appointment.objects.filter(status='scheduled').count(),
        },
        'city_services': {
            'total_complaints': Complaint.objects.count(),
            'pending_complaints': Complaint.objects.filter(status='submitted').count(),
        },
        'agriculture': {
            'total_queries': FarmerQuery.objects.count(),
            'pending_queries': FarmerQuery.objects.filter(status='submitted').count(),
        }
    }
    
    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role == 'admin':
        from accounts.models import ApprovalRequest
        from django.utils import timezone
        from django.db.models import Avg, F, ExpressionWrapper, DurationField
        from .models import SystemMetrics
        
        stats['pending_approvals'] = ApprovalRequest.objects.filter(status='pending').count()
        
        # Add role breakdown for admin
        stats['role_breakdown'] = {
            role: CustomUser.objects.filter(role=role).count()
            for role, _ in CustomUser.ROLE_CHOICES
        }
        
        # Add service usage metrics
        stats['service_usage'] = {
            'healthcare': Appointment.objects.count(),
            'city_services': Complaint.objects.count(),
            'agriculture': FarmerQuery.objects.count()
        }

        # Daily activity for the last 7 days
        daily_activity = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timezone.timedelta(days=i)
            count = ServiceRequest.objects.filter(created_at__date=date).count()
            daily_activity.append({
                'date': date.strftime('%b %d'),
                'count': count
            })
        stats['daily_activity'] = daily_activity

        # Calculate REAL performance metrics (average completion time in minutes)
        # We group by service type and calculate the diff between created_at and completed_at
        performance = {}
        service_types = ['healthcare', 'city', 'agriculture']
        
        for stype in service_types:
            avg_duration = ServiceRequest.objects.filter(
                service__service_type=stype,
                status='completed',
                completed_at__isnull=False
            ).annotate(
                duration=ExpressionWrapper(F('completed_at') - F('created_at'), output_field=DurationField())
            ).aggregate(avg_time=Avg('duration'))['avg_time']
            
            if avg_duration:
                # Convert duration to total minutes
                performance[stype if stype != 'city' else 'city_services'] = int(avg_duration.total_seconds() / 60)
            else:
                # Fallback to a placeholder if no data exists yet, or 0
                performance[stype if stype != 'city' else 'city_services'] = 0
        
        stats['performance'] = performance

        # Fetch latest system metrics
        latest_metrics = SystemMetrics.objects.first()
        if latest_metrics:
            stats['system_health'] = {
                'cpu_usage': latest_metrics.cpu_usage,
                'memory_usage': latest_metrics.memory_usage,
                'avg_response_time': int(latest_metrics.avg_response_time * 1000) # Convert to ms
            }
        else:
            stats['system_health'] = {
                'cpu_usage': 0,
                'memory_usage': 0,
                'avg_response_time': 0
            }
    
    return Response(stats)
