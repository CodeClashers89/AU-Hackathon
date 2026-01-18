# Seva Setu

## Project Overview
The **Seva Setu** platform is a unified government service portal designed to provide citizens with seamless access to essential services like Healthcare, Agriculture, and City Management. Built with a modular architecture, it features a robust Django backend and a modern Flutter mobile application, enabling secure data exchange and real-time service tracking for citizens, service providers, and government administrators.


## Key Features
- **Citizen-Centric Mobile Experience**: A dedicated Flutter application for citizens to access healthcare, agriculture, and civic services.
- **Unified Healthcare**: Appointment booking, professional digital prescriptions, and personal health record tracking.
- **Biometric Security**: Face recognition authentication with automatic token refreshing for seamless mobile access.
- **Multi-role Backend**: Specialized web portals for Doctors, City Staff, Agricultural Officers, and Government Admins.
- **Smart City Hub**: Civic complaint reporting with location tracking and automated resolution workflows.
- **Advanced Admin Analytics**: Comprehensive dashboard for system health monitoring and service performance metrics.

## AI & Machine Learning Capabilities
The Seva Setu platform leverages state-of-the-art AI and ML to empower citizens:
- **Predictive Healthcare**: Built-in specialized ML models (Diabetes, Heart Disease, and Cancer) to assess health risks based on patient demographics and clinical parameters.
- **Smart Agriculture**: Data-driven crop recommendation engine and yield level predictors based on soil type, rainfall, and location.
- **Intelligent City Services**: Integrated **OpenAI GPT-4o-mini** to automatically analyze and prioritize municipal complaints based on public safety impact and urgency.

## Tech Stack
### Backend
- **Framework**: Django 5.1
- **API**: Django REST Framework (DRF)
- **Security**: SimpleJWT (JWT Authentication)
- **Database**: SQLite (Development)
- **Utilities**: django-cors-headers, Pillow, python-decouple

### Mobile
- **Framework**: Flutter
- **Language**: Dart
- **Storage**: Secure Local Caching

## Local Setup Guide

### 1. Prerequisites
- Python 3.10+
- Flutter SDK (for mobile)
- pip

### 2. Backend Installation
```bash
# Clone the repository and navigate to the root
cd "AU hackathon"

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (if not already done)
python manage.py createsuperuser
```

### 3. Run Development Server
```bash
python manage.py runserver
```
The backend will be available at: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

### 4. Mobile App Setup
```bash
cd mobile_app
flutter pub get
flutter run
```
*Note: See `mobile_app/QUICK_SETUP.md` for physical device testing.*

## Test Credentials

### Admin Access
- **URL**: [http://127.0.0.1:8000/admin-dashboard/](http://127.0.0.1:8000/admin-dashboard/)
- **Username**: `admin`
- **Password**: `admin123` (or as set during superuser creation)

### Demo Users (Password: `password123`)
| Role | Username | Access Type |
| :--- | :--- | :--- |
| **Citizen** | `citizen1` | Mobile App & Web Portal |
| **Doctor** | `doctor1` | Web Portal Exclusive |
| **City Staff** | `citystaff1` | Web Portal Exclusive |
| **Agri Officer** | `agriofficer1` | Web Portal Exclusive |

---
**Built for AU Hackathon 2026** 🚀
