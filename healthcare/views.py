from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Doctor, Appointment, MedicalRecord, Prescription, FollowUp, DoctorUnavailability
from .serializers import (
    DoctorSerializer, AppointmentSerializer, MedicalRecordSerializer,
    PrescriptionSerializer, FollowUpSerializer, DoctorUnavailabilitySerializer
)
from dpi_platform.forms import PatientForm
from dpi_platform.utils import diabetes_model, heart_model, cancer_model, scaler
import numpy as np

@login_required
def doctor_dashboard(request):
    """Doctor dashboard view"""
    if request.user.role != 'doctor':
        return render(request, 'error.html', {'message': 'Access denied. Doctor role required.'})
    return render(request, 'healthcare/doctor_dashboard.html')

class DoctorViewSet(viewsets.ModelViewSet):
    """Doctor management"""
    queryset = Doctor.objects.filter(user__is_approved=True)
    serializer_class = DoctorSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'available']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available doctors"""
        doctors = Doctor.objects.filter(is_available=True, user__is_approved=True)
        serializer = self.get_serializer(doctors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current doctor's profile"""
        try:
            doctor = Doctor.objects.get(user=request.user)
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)

class AppointmentViewSet(viewsets.ModelViewSet):
    """Appointment management"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        print(f"DEBUG: AppointmentViewSet.get_queryset - User: {user}, Role: {getattr(user, 'role', 'None')}, Auth: {user.is_authenticated}")
        if not user.is_authenticated:
            return Appointment.objects.all()
        if user.role == 'doctor':
            return Appointment.objects.filter(doctor__user=user)
        elif user.role == 'citizen':
            return Appointment.objects.filter(patient=user)
        return Appointment.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark appointment as completed"""
        appointment = self.get_object()
        appointment.status = 'completed'
        appointment.save()
        return Response({'message': 'Appointment completed'})

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.http import HttpResponse
from io import BytesIO

# ... existing imports ...

class MedicalRecordViewSet(viewsets.ModelViewSet):
    """Medical record management"""
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'patient_history', 'prescription_pdf']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        doctor = Doctor.objects.get(user=self.request.user)
        serializer.save(doctor=doctor)
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return MedicalRecord.objects.filter(doctor__user=user)
        elif user.role == 'citizen':
            return MedicalRecord.objects.filter(patient=user)
        return MedicalRecord.objects.all()
    
    @action(detail=False, methods=['get'])
    def patient_history(self, request):
        """Get patient medical history"""
        patient_id = request.query_params.get('patient_id')
        if patient_id:
            records = MedicalRecord.objects.filter(patient_id=patient_id).order_by('-created_at')
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data)
        return Response({'error': 'patient_id required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def prescription_pdf(self, request, pk=None):
        """Generate a professionally styled PDF for prescription"""
        from reportlab.lib.colors import HexColor
        
        medical_record = self.get_object()
        doctor = medical_record.doctor
        patient = medical_record.patient
        prescriptions = medical_record.prescriptions.all()
        
        # Theme Colors
        GOV_BLUE = HexColor('#0B4F87')
        CIVIC_GREEN = HexColor('#1e8449')
        LIGHT_GRAY = HexColor('#f8fafc')
        
        buffer = BytesIO()
        # Custom margins
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=GOV_BLUE,
            spaceAfter=5
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.grey,
            spaceAfter=20
        )
        section_header = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=CIVIC_GREEN,
            borderPadding=2,
            spaceBefore=15,
            spaceAfter=10
        )
        label_style = ParagraphStyle(
            'LabelStyle',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            textColor=GOV_BLUE
        )
        value_style = ParagraphStyle(
            'ValueStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.black
        )
        
        # Header - Doctor Info
        header_data = [
            [Paragraph(f"Dr. {doctor.user.get_full_name().upper()}", title_style)],
            [Paragraph(f"{doctor.specialization} | License: {doctor.license_number}", subtitle_style)]
        ]
        header_table = Table(header_data, colWidths=[450])
        header_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(header_table)
        
        # Horizontal Line
        elements.append(Spacer(1, 5))
        elements.append(Table([['']], colWidths=[500], rowHeights=[2], style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), GOV_BLUE),
        ])))
        elements.append(Spacer(1, 20))
        
        # Patient & Record Info (Two columns)
        info_data = [
            [Paragraph("PATIENT NAME:", label_style), Paragraph(patient.get_full_name(), value_style),
             Paragraph("RECORD DATE:", label_style), Paragraph(str(medical_record.created_at.date()), value_style)],
            [Paragraph("PATIENT EMAIL:", label_style), Paragraph(patient.email, value_style),
             Paragraph("RECORD ID:", label_style), Paragraph(f"#{medical_record.id:05d}", value_style)]
        ]
        info_table = Table(info_data, colWidths=[100, 150, 100, 150])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(info_table)
        
        # Diagnosis
        elements.append(Paragraph("DIAGNOSIS & CLINICAL NOTES", section_header))
        elements.append(Paragraph(medical_record.diagnosis or "No specific diagnosis provided.", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Prescriptions
        elements.append(Paragraph("PRESCRIPTION", section_header))
        if prescriptions.exists():
            data = [[
                Paragraph('MEDICINE', label_style), 
                Paragraph('DOSAGE', label_style), 
                Paragraph('FREQUENCY', label_style), 
                Paragraph('DURATION', label_style)
            ]]
            for rx in prescriptions:
                data.append([
                    rx.medication_name, 
                    rx.dosage, 
                    rx.frequency, 
                    rx.duration
                ])
                if rx.instructions:
                    data.append([Paragraph(f"<i>Note: {rx.instructions}</i>", styles['Italic']), '', '', ''])
            
            table = Table(data, colWidths=[180, 100, 100, 100])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), LIGHT_GRAY),
                ('TEXTCOLOR', (0, 0), (-1, 0), GOV_BLUE),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LINEBELOW', (0, 0), (-1, 0), 1, GOV_BLUE),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("<i>No medications prescribed.</i>", styles['Normal']))
            
        # Footer / Branded Section
        elements.append(Spacer(1, 40))
        footer_line = Table([['']], colWidths=[500], rowHeights=[0.5], style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ]))
        elements.append(footer_line)
        elements.append(Spacer(1, 10))
        
        footer_data = [[
            Paragraph("Digital Public Infrastructure - Healthcare Portal", subtitle_style),
            Paragraph("Doctor's Digital Signature Authorized", subtitle_style)
        ]]
        footer_table = Table(footer_data, colWidths=[300, 200])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        elements.append(footer_table)
        
        doc.build(elements)
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

class PrescriptionViewSet(viewsets.ModelViewSet):
    """Prescription management"""
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

class DoctorUnavailabilityViewSet(viewsets.ModelViewSet):
    """Doctor unavailability management"""
    queryset = DoctorUnavailability.objects.all()
    serializer_class = DoctorUnavailabilitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'doctor':
            return DoctorUnavailability.objects.filter(doctor__user=self.request.user)
        return DoctorUnavailability.objects.all()

    def perform_create(self, serializer):
        doctor = Doctor.objects.get(user=self.request.user)
        serializer.save(doctor=doctor)

@api_view(['POST'])
@permission_classes([permissions.AllowAny]) # Making it accessible as per flow, security can be tightened later
def predict_disease(request):
    """Predict disease risks based on patient data"""
    form = PatientForm(request.data)
    if form.is_valid():
        data = form.cleaned_data
        
        # Encode input
        # Validation for smoking, alcohol, activity mapping is handled by form choice field but we need to map to int
        smoking_map = {"low": 0, "moderate": 1, "high": 2}
        alcohol_map = {"low": 0, "moderate": 1, "high": 2}
        activity_map = {"low": 0, "moderate": 1, "high": 2}

        try:
            input_vector = np.array([[
                data["age"],
                1 if data["gender"] == "M" else 0,
                data["bmi"],
                smoking_map[data["smoking"]],
                alcohol_map[data["alcohol"]],
                activity_map[data["activity"]],
                int(data["family_diabetes"]),
                int(data["family_heart"]),
                int(data["family_cancer"])
            ]])

            # Scale input
            X_scaled = scaler.transform(input_vector)

            # Predict risks
            diabetes_risk = diabetes_model.predict_proba(X_scaled)[0][1]
            heart_risk = heart_model.predict_proba(X_scaled)[0][1]
            cancer_risk = cancer_model.predict_proba(X_scaled)[0][1]

            # Recommendations
            checkups = []
            if diabetes_risk > 0.6:
                checkups.append("Blood Sugar Test (Fasting / HbA1c)")
            if heart_risk > 0.5:
                checkups.extend(["Blood Pressure Test", "ECG"])
            if cancer_risk > 0.4:
                checkups.append("Cancer Screening Consultation")
            if data["bmi"] > 25:
                checkups.append("Lipid Profile")

            # Lifestyle Advice
            advice = []
            if data["smoking"] == "high":
                advice.append("Reduce smoking gradually")
            if data["alcohol"] == "high":
                advice.append("Limit alcohol consumption")
            if data["activity"] == "low":
                advice.append("Increase physical activity to at least 30 minutes daily")
            if data["bmi"] > 25:
                advice.append("Maintain a healthy weight through balanced diet")

            result = {
                "diabetes": round(diabetes_risk * 100, 2),
                "heart": round(heart_risk * 100, 2),
                "cancer": round(cancer_risk * 100, 2),
                "checkups": checkups,
                "advice": advice
            }
            return Response(result)
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
