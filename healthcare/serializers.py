from rest_framework import serializers
from .models import Doctor, Appointment, MedicalRecord, Prescription, FollowUp, DoctorUnavailability

from accounts.models import CustomUser
from accounts.serializers import CustomUserSerializer

class DoctorSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_data = CustomUserSerializer(source='patient', read_only=True)
    medical_record_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['patient', 'created_at', 'updated_at']

    def get_medical_record_id(self, obj):
        record = obj.medical_record.last()
        return record.id if record else None

    def validate(self, data):
        doctor = data.get('doctor')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        
        # Check if doctor is unavailable
        if doctor and appointment_date:
            unavailability_qs = DoctorUnavailability.objects.filter(
                doctor=doctor,
                start_date__lte=appointment_date,
                end_date__gte=appointment_date
            )
            
            for period in unavailability_qs:
                # If it's a full day unavailability or no specific time range is set
                if not period.start_time or not period.end_time:
                    raise serializers.ValidationError("Doctor is unavailable at this time")
                
                # Check for time overlap if time is provided
                if appointment_time:
                    # Simple check: is the appointment time within the blocked window?
                    if period.start_time <= appointment_time <= period.end_time:
                        raise serializers.ValidationError("Doctor is unavailable at this time")
        
        return data

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['medical_record']

class MedicalRecordSerializer(serializers.ModelSerializer):
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    patient = CustomUserSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source='patient', write_only=True
    )
    doctor_profile = DoctorSerializer(source='doctor', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'doctor']

    def create(self, validated_data):
        prescriptions_data = self.context['request'].data.get('prescriptions', [])
        medical_record = MedicalRecord.objects.create(**validated_data)
        
        for prescription_data in prescriptions_data:
            Prescription.objects.create(medical_record=medical_record, **prescription_data)
            
        return medical_record

class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUp
        fields = '__all__'

class DoctorUnavailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorUnavailability
        fields = '__all__'
        read_only_fields = ['doctor']
