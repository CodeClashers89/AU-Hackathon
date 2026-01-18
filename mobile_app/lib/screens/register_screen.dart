import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../services/auth_service.dart';
import 'dart:io';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  String _selectedRole = 'citizen';
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;
  XFile? _faceImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _errorMessage = 'Passwords do not match');
      return;
    }

    if (_faceImage == null) {
      setState(() => _errorMessage = 'Face photo is required for biometric ID');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final authService = Provider.of<AuthService>(context, listen: false);
    
    final faceBytes = await _faceImage!.readAsBytes();

    final result = await authService.register({
      'username': _usernameController.text.trim(),
      'email': _emailController.text.trim(),
      'first_name': _firstNameController.text.trim(),
      'last_name': _lastNameController.text.trim(),
      'phone_number': _phoneController.text.trim(),
      'role': _selectedRole,
      'address': _addressController.text.trim(),
      'password': _passwordController.text,
      'password_confirm': _confirmPasswordController.text,
    }, faceImageBytes: faceBytes);

    setState(() => _isLoading = false);

    if (result['success']) {
      setState(() {
        if (result['requires_approval']) {
          _successMessage = 'Deployment successful! Your account is pending administrative approval.';
        } else {
          _successMessage = 'Registration successful! Synchronizing with login terminal...';
        }
      });
      
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/login');
        }
      });
    } else {
      setState(() => _errorMessage = result['error'].toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0B4F87)),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Hero(
                tag: 'app_logo',
                child: Image.asset('assets/images/logo.png', height: 60),
              ),
              const SizedBox(height: 24),
              Text(
                'ESTABLISH.IDENTITY',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 4,
                  color: const Color(0xFF0B4F87).withValues(alpha: 0.1),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'REGISTER',
                style: GoogleFonts.outfit(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0B4F87),
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Join the National Digital Public Infrastructure network.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 40),
              if (_errorMessage != null)
                _buildMessage(text: _errorMessage!, isError: true),
              if (_successMessage != null)
                _buildMessage(text: _successMessage!, isError: false),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('FIRST NAME'),
                              _buildTextField(
                                controller: _firstNameController,
                                hint: 'E.g. John',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('LAST NAME'),
                              _buildTextField(
                                controller: _lastNameController,
                                hint: 'E.g. Doe',
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('USERNAME'),
                    _buildTextField(
                      controller: _usernameController,
                      hint: 'Choose a unique ID',
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('EMAIL ADDRESS'),
                    _buildTextField(
                      controller: _emailController,
                      hint: 'name@example.com',
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('PHONE NUMBER'),
                    _buildTextField(
                      controller: _phoneController,
                      hint: '1234567890',
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 20),
                    // Role is fixed to citizen for this application version
                    const SizedBox(height: 20),
                    _buildLabel('RESIDENTIAL ADDRESS'),
                    _buildTextField(
                      controller: _addressController,
                      hint: 'Full address particulars',
                      maxLines: 3,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('FACE PHOTO (BIOMETRIC ID)'),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.grey.shade200, width: 1),
                        ),
                        child: _faceImage != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: Image.file(File(_faceImage!.path), fit: BoxFit.cover),
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.add_a_photo_outlined, size: 48, color: Color(0xFF1E8449)),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Upload Face Image',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF1E8449),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('SECURITY PASSWORD'),
                    _buildTextField(
                      controller: _passwordController,
                      hint: 'Min. 8 characters',
                      isPassword: true,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('CONFIRM SECURITY PASSWORD'),
                    _buildTextField(
                      controller: _confirmPasswordController,
                      hint: 'Repeat password',
                      isPassword: true,
                    ),
                    const SizedBox(height: 40),
                    _buildRegisterButton(),
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
                      child: GestureDetector(
                        onTap: () => Navigator.of(context).pushReplacementNamed('/login'),
                        child: RichText(
                          text: TextSpan(
                            text: 'Already established? ',
                            style: GoogleFonts.outfit(color: Colors.grey.shade600),
                            children: [
                              TextSpan(
                                text: 'Access Portal',
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF0B4F87),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: TextButton(
                        onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
                        child: Text(
                          '← Return to Public Terminal',
                          style: GoogleFonts.outfit(
                            color: Colors.grey.shade500,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
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
    bool isPassword = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: GoogleFonts.outfit(fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.outfit(color: Colors.grey.shade400, fontWeight: FontWeight.w400),
        filled: true,
        fillColor: Colors.grey.shade50,
        contentPadding: const EdgeInsets.all(16),
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
      validator: (value) {
        if (value == null || value.isEmpty) {
          if (hint.contains('E.g.') || hint.contains('Choose') || hint.contains('name@') || hint.contains('password')) {
             return 'Required field';
          }
        }
        return null;
      },
    );
  }


  Widget _buildRegisterButton() {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleRegister,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0B4F87),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          elevation: 0,
        ),
        child: _isLoading
            ? const CircularProgressIndicator(color: Colors.white)
            : Text(
                'INITIALIZE REGISTRATION',
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
            'SIGN UP WITH GOOGLE',
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

  Widget _buildMessage({required String text, required bool isError}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: isError ? Colors.red.shade50 : Colors.green.shade50,
        border: Border(left: BorderSide(color: isError ? Colors.red : Colors.green, width: 4)),
      ),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          color: isError ? Colors.red.shade800 : Colors.green.shade800,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
