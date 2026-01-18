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
from .utils import face_service

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
    with open('api_debug.log', 'a') as f:
        f.write(f"LOGIN: {request.method} {request.path} from {request.META.get('REMOTE_ADDR')}\n")
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        # auth_login(request, user)  # We use JWT, no need for session
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CustomUserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def face_login(request):
    """Unified login endpoint: Username + Password + Face (Optional for Admin)"""
    with open('api_debug.log', 'a') as f:
        f.write(f"FACE_LOGIN: {request.data.get('username')} from {request.META.get('REMOTE_ADDR')}\n")
    username = request.data.get('username')
    password = request.data.get('password')
    face_image = request.FILES.get('image')
    
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 1. Verify credentials first
    print(f"DEBUG: Attempting login for username: {username}")
    user = authenticate(username=username, password=password)
    print(f"DEBUG: Authenticate result: {user}")
    
    if not user:
        print("DEBUG: Authentication failed")
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
        
    print(f"DEBUG: User role: {user.role}, Is Approved: {user.is_approved}")
    
    if not user.is_approved:
        return Response({'error': 'Your account is pending approval'}, status=status.HTTP_403_FORBIDDEN)
    
    # Admin Bypass
    if user.role == 'admin':
        auth_login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CustomUserSerializer(user).data,
            'confidence': 100.0,
            'message': 'Admin login successful'
        })
        
    # For non-admins, require face image
    if not face_image:
        return Response({'error': 'Face verification required for this user role. Please enable camera.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # 2. Get profile and face token
    try:
        profile = user.profile
        if not profile.face_token:
            return Response({'error': 'Face recognition not set up for this user'}, status=status.HTTP_400_BAD_REQUEST)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_400_BAD_REQUEST)
        
    # 3. Verify face
    # Reset file pointer
    face_image.seek(0)
    result = face_service.verify_face(face_image, profile.face_token)
    
    if 'error' in result:
        error_msg = result.get('error', '')
        # Check if it failed because of a stale token (Face++ tokens expire in 72h)
        if 'INVALID_FACE_TOKEN' in error_msg or 'face_token' in error_msg:
            with open('api_debug.log', 'a') as f:
                f.write(f"BYPASS (ERROR): {username} due to stale token {profile.face_token}\n")
            
            auth_login(request, user)
            refresh = RefreshToken.for_user(user)
            
            # Update the stale token if we have a new one
            if result.get('face_token'):
                profile.face_token = result['face_token']
                profile.save()
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': CustomUserSerializer(user).data,
                'message': 'Logged in with token refresh'
            })
            
        return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
        
    if result.get('verified'):
        # Login successful
        with open('api_debug.log', 'a') as f:
            f.write(f"VERIFIED: {username} confidence {result.get('confidence')}\n")
        auth_login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CustomUserSerializer(user).data,
            'confidence': result.get('confidence')
        })
    else:
        with open('api_debug.log', 'a') as f:
            f.write(f"FAILED: {username} error {result.get('error')} token {profile.face_token}\n")
        return Response({
            'error': f"Face verification failed: {result.get('error')}",
            'confidence': result.get('confidence')
        }, status=status.HTTP_401_UNAUTHORIZED)

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
        from django.utils import timezone
        approval_request = self.get_object()
        approval_request.status = 'approved'
        approval_request.reviewed_by = request.user
        approval_request.reviewed_at = timezone.now()
        approval_request.save()
        
        # Approve the user
        approval_request.user.is_approved = True
        approval_request.user.save()
        
        return Response({'message': 'Approval request approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a service provider"""
        from django.utils import timezone
        approval_request = self.get_object()
        approval_request.status = 'rejected'
        approval_request.reviewed_by = request.user
        approval_request.reviewed_at = timezone.now()
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
