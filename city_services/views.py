from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CityStaff, ComplaintCategory, Complaint, ComplaintResponse
from .serializers import (
    CityStaffSerializer, ComplaintCategorySerializer,
    ComplaintSerializer, ComplaintResponseSerializer
)

class ComplaintCategoryViewSet(viewsets.ModelViewSet):
    """Complaint category management"""
    queryset = ComplaintCategory.objects.all()
    serializer_class = ComplaintCategorySerializer
    permission_classes = [IsAuthenticated]

class ComplaintViewSet(viewsets.ModelViewSet):
    """Complaint management"""
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Complaint.objects.none()
        if user.role == 'city_staff':
            # Staff should be able to see all complaints to pick them up, 
            # or just those assigned to them. Seeing all is better for picking.
            return Complaint.objects.all().order_by('-created_at')
        elif user.role == 'citizen':
            return Complaint.objects.filter(citizen=user).order_by('-created_at')
        return Complaint.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Add response to complaint"""
        complaint = self.get_object()
        
        # Ensure staff profile exists
        staff, created = CityStaff.objects.get_or_create(
            user=request.user,
            defaults={
                'department': 'Operations',
                'designation': 'Field Officer',
                'employee_id': f"CITY-{request.user.username}",
                'jurisdiction': 'Central'
            }
        )
        
        response_serializer = ComplaintResponseSerializer(data=request.data)
        if response_serializer.is_valid():
            try:
                response_serializer.save(complaint=complaint, staff=staff)
                
                # Update complaint status
                complaint.status = 'in_progress'
                complaint.save()
                
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(response_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark complaint as resolved"""
        complaint = self.get_object()
        complaint.status = 'resolved'
        complaint.save()
        return Response({'message': 'Complaint resolved'})

@api_view(['GET'])
def dashboard_stats(request):
    """Get staff dashboard statistics"""
    if not request.user.is_authenticated or request.user.role != 'city_staff':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    staff, created = CityStaff.objects.get_or_create(
        user=request.user,
        defaults={
            'department': 'Operations',
            'designation': 'Field Officer',
            'employee_id': f"CITY-{request.user.username}",
            'jurisdiction': 'Central'
        }
    )
    
    stats = {
        'pending_complaints': Complaint.objects.filter(status='submitted').count(),
        'in_progress': Complaint.objects.filter(status='in_progress').count(),
        'resolved_this_month': Complaint.objects.filter(status='resolved').count(), # Simplified for now
    }
    
    return Response(stats)

class ComplaintResponseViewSet(viewsets.ModelViewSet):
    """Complaint response management"""
    queryset = ComplaintResponse.objects.all()
    serializer_class = ComplaintResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'city_staff':
            return ComplaintResponse.objects.filter(staff__user=user).order_by('-created_at')
        return ComplaintResponse.objects.none()
