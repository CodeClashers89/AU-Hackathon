import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../services/auth_service.dart';
import 'dart:io';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  XFile? _faceImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      maxWidth: 800,
      maxHeight: 800,
    );
    if (image != null) {
      setState(() {
        _faceImage = image;
      });
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final authService = Provider.of<AuthService>(context, listen: false);
    
    List<int>? faceBytes;
    if (_faceImage != null) {
      faceBytes = await _faceImage!.readAsBytes();
    }

    final result = await authService.login(
      _usernameController.text.trim(),
      _passwordController.text,
      faceImageBytes: faceBytes,
    );

    setState(() => _isLoading = false);

    if (result['success']) {
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/${result['role']}');
    } else {
      setState(() => _errorMessage = result['error']);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        height: double.infinity,
        decoration: const BoxDecoration(
          color: Colors.white,
          image: DecorationImage(
            image: NetworkImage('https://www.transparenttextures.com/patterns/cubes.png'),
            opacity: 0.05,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'AUTHENTICATION',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4,
                      color: const Color(0xFF0B4F87).withOpacity(0.1),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'LOGIN',
                    style: GoogleFonts.outfit(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0B4F87),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Enter your credentials to access the National Digital Public Infrastructure.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 48),
                  if (_errorMessage != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        border: Border(left: BorderSide(color: Colors.red.shade800, width: 4)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: GoogleFonts.outfit(color: Colors.red.shade800, fontWeight: FontWeight.w600),
                      ),
                    ),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('USERNAME / ID'),
                        _buildTextField(
                          controller: _usernameController,
                          hint: 'Enter your username',
                          icon: Icons.person_outline,
                        ),
                        const SizedBox(height: 24),
                        _buildLabel('SECURITY KEY / PASSWORD'),
                        _buildTextField(
                          controller: _passwordController,
                          hint: '••••••••',
                          icon: Icons.lock_outline,
                          isPassword: true,
                        ),
                        const SizedBox(height: 24),
                        _buildLabel('IDENTITY VERIFICATION'),
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            height: 200,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300, width: 1),
                            ),
                            child: _faceImage != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.file(File(_faceImage!.path), fit: BoxFit.cover),
                                  )
                                : Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.camera_alt_outlined, size: 48, color: Color(0xFF0B4F87)),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Tap to Enable Camera',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF0B4F87),
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Face verification is required for login.',
                          style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade500),
                        ),
                        const SizedBox(height: 40),
                        _buildLoginButton(),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            const Expanded(child: Divider()),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'OR',
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.grey.shade400,
                                ),
                              ),
                            ),
                            const Expanded(child: Divider()),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildGoogleButton(),
                        const SizedBox(height: 32),
                        Center(
                          child: Column(
                            children: [
                              GestureDetector(
                                onTap: () => Navigator.pushNamed(context, '/register'),
                                child: RichText(
                                  text: TextSpan(
                                    text: 'New to the platform? ',
                                    style: GoogleFonts.outfit(color: Colors.grey.shade600),
                                    children: [
                                      TextSpan(
                                        text: 'Register Credentials',
                                        style: GoogleFonts.outfit(
                                          color: const Color(0xFF0B4F87),
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextButton(
                                onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
                                child: Text(
                                  '← Return to Public Terminal',
                                  style: GoogleFonts.outfit(
                                    color: Colors.grey.shade500,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
          color: const Color(0xFF0B4F87),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword,
      style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.outfit(color: Colors.grey.shade400, fontWeight: FontWeight.w400),
        prefixIcon: Icon(icon, color: const Color(0xFF0B4F87).withOpacity(0.5)),
        filled: true,
        fillColor: Colors.grey.shade50,
        contentPadding: const EdgeInsets.all(20),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: Color(0xFF1E8449), width: 2),
        ),
      ),
      validator: (value) => value == null || value.isEmpty ? 'Required field' : null,
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0B4F87),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          elevation: 0,
        ),
        child: _isLoading
            ? const CircularProgressIndicator(color: Colors.white)
            : Text(
                'SECURE LOGIN',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }

  Widget _buildGoogleButton() {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: OutlinedButton(
        onPressed: () {},
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.grey.shade200),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
        child: Center(
          child: Text(
            'LOGIN WITH GOOGLE',
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
              letterSpacing: 1,
            ),
          ),
        ),
      ),
    );
  }
}
