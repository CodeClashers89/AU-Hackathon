from django.shortcuts import render, redirect
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, logout, login as auth_login
from .models import CustomUser, UserProfile, ApprovalRequest
from .serializers import (
    CustomUserSerializer, UserRegistrationSerializer, 
    LoginSerializer, ApprovalRequestSerializer
)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Registration successful',
            'user': CustomUserSerializer(user).data,
            'requires_approval': user.role in ['doctor', 'city_staff', 'agri_officer']
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        auth_login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CustomUserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get current user profile"""
    return Response(CustomUserSerializer(request.user).data)

@api_view(['POST', 'GET'])
def user_logout(request):
    """User logout endpoint"""
    logout(request)
    if request.path.startswith('/api/'):
        return Response({'message': 'Logged out successfully'})
    return redirect('login')

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    """Approval request management"""
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return ApprovalRequest.objects.all()
        return ApprovalRequest.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a service provider"""
        approval_request = self.get_object()
        approval_request.status = 'approved'
        approval_request.reviewed_by = request.user
        approval_request.save()
        
        # Approve the user
        approval_request.user.is_approved = True
        approval_request.user.save()
        
        return Response({'message': 'Approval request approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a service provider"""
        approval_request = self.get_object()
        approval_request.status = 'rejected'
        approval_request.reviewed_by = request.user
        approval_request.admin_notes = request.data.get('notes', '')
        approval_request.save()
        
        return Response({'message': 'Approval request rejected'})

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only user list"""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return CustomUser.objects.none()
        return CustomUser.objects.all().order_by('-created_at')
