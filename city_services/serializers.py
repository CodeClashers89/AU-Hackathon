from rest_framework import serializers
from .models import CityStaff, ComplaintCategory, Complaint, ComplaintResponse

class CityStaffSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = CityStaff
        fields = '__all__'
    
    def get_user_details(self, obj):
        return {
            'username': obj.user.username,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email
        }

class ComplaintCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintCategory
        fields = '__all__'

class ComplaintResponseSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    
    class Meta:
        model = ComplaintResponse
        fields = '__all__'
        read_only_fields = ['created_at', 'staff', 'complaint']

class ComplaintSerializer(serializers.ModelSerializer):
    responses = ComplaintResponseSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)
    
    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['complaint_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Generate unique complaint ID
        import uuid
        validated_data['complaint_id'] = f"CMP-{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)
