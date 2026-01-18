import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/citizen_home.dart';
import 'screens/doctor_dashboard.dart';
import 'screens/city_staff_dashboard.dart';
import 'screens/agri_officer_dashboard.dart';
import 'services/auth_service.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const DPIApp(),
    ),
  );
}

class DPIApp extends StatelessWidget {
  const DPIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Seva Setu',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        primaryColor: const Color(0xFF0B4F87),
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
      ),
      home: const AuthWrapper(),
      routes: {
        '/landing': (context) => const LandingScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/citizen': (context) => const CitizenHome(),
        '/doctor': (context) => const DoctorDashboard(),
        '/city-staff': (context) => const CityStaffDashboard(),
        '/agri-officer': (context) => const AgriOfficerDashboard(),
      },
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, _) {
        if (authService.isAuthenticated) {
          // Route based on user role
          switch (authService.userRole) {
            case 'citizen':
              return const CitizenHome();
            case 'doctor':
              return const DoctorDashboard();
            case 'city_staff':
              return const CityStaffDashboard();
            case 'agri_officer':
              return const AgriOfficerDashboard();
            default:
              return const LandingScreen();
          }
        }
        return const LandingScreen();
      },
    );
  }
}
