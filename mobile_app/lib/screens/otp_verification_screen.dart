import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String username;
  final String purpose; // 'registration' or 'password_reset'

  const OtpVerificationScreen({
    Key? key,
    required this.username,
    required this.purpose,
  }) : super(key: key);

  @override
  _OtpVerificationScreenState createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _verify() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final authService = Provider.of<AuthService>(context, listen: false);

    if (widget.purpose == 'registration') {
      final result = await authService.verifyOtp(
        widget.username,
        _otpController.text,
        'registration',
      );

      setState(() => _isLoading = false);

      if (result['success']) {
        final message = result['requires_approval']
            ? 'Email verified! Your account is now pending administrative approval.'
            : 'Email verified! You can now login.';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
        Navigator.popUntil(context, (route) => route.isFirst);
      } else {
        setState(() => _errorMessage = result['error']);
      }
    } else {
      // Password Reset
      if (_newPasswordController.text.length < 8) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Password must be at least 8 characters';
        });
        return;
      }

      final result = await authService.resetPassword(
        widget.username,
        _otpController.text,
        _newPasswordController.text,
      );

      setState(() => _isLoading = false);

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset successfully!')),
        );
        Navigator.popUntil(context, (route) => route.isFirst);
      } else {
        setState(() => _errorMessage = result['error']);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.mark_email_unread_outlined, size: 80, color: Colors.blue),
            const SizedBox(height: 24),
            Text(
              'Enter the 6-digit code sent to your email for ${widget.username}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _otpController,
              decoration: const InputDecoration(
                labelText: 'OTP Code',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.lock_clock),
              ),
              keyboardType: TextInputType.number,
              maxLength: 6,
            ),
            if (widget.purpose == 'password_reset') ...[
              const SizedBox(height: 16),
              TextField(
                controller: _newPasswordController,
                decoration: const InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.password),
                ),
                obscureText: true,
              ),
            ],
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _verify,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(widget.purpose == 'registration' ? 'Verify Registration' : 'Reset Password'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
