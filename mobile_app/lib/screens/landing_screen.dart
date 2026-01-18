import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scanAnimation;
  bool _showContent = false;
  bool _scanning = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _scanAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutQuart),
    );

    _controller.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() {
            _scanning = false;
          });
          Future.delayed(const Duration(milliseconds: 300), () {
            if (mounted) {
              setState(() {
                _showContent = true;
              });
            }
          });
        }
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Background Grid
          Positioned.fill(
            child: Opacity(
              opacity: 0.03,
              child: Image.network(
                'https://www.transparenttextures.com/patterns/cubes.png',
                repeat: ImageRepeat.repeat,
              ),
            ),
          ),
          
          if (_scanning) _buildScanner(),
          
          if (_showContent) _buildMainContent(),
        ],
      ),
    );
  }

  Widget _buildScanner() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            children: [
              Text(
                'SEVA SETU',
                style: GoogleFonts.outfit(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 8,
                  color: Colors.grey.shade100,
                ),
              ),
              AnimatedBuilder(
                animation: _scanAnimation,
                builder: (context, child) {
                  return ClipRect(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      widthFactor: _scanAnimation.value,
                      child: Text(
                        'SEVA SETU',
                        style: GoogleFonts.outfit(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 8,
                          color: const Color(0xFF1E8449),
                          shadows: [
                            Shadow(
                              color: const Color(0xFF1E8449).withOpacity(0.5),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'NATIONAL DPI TERMINAL',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 4,
              color: const Color(0xFF0B4F87).withOpacity(0.3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 80.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBadge('GOVERNMENT OF INDIA'),
            const SizedBox(height: 16),
            Text(
              'Digital Public\nInfrastructure',
              style: GoogleFonts.outfit(
                fontSize: 42,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0B4F87),
                height: 1.1,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Empowering citizens through unified digital services for healthcare, agriculture, and municipal governance.',
              style: GoogleFonts.outfit(
                fontSize: 16,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 48),
            _buildActionButtons(),
            const SizedBox(height: 64),
            _buildSectionHeader('CORE SERVICES'),
            const SizedBox(height: 24),
            _buildServiceItem(
              'HEALTHCARE',
              'Integrated medical registry & appointments.',
              Icons.monitor_heart_outlined,
              const Color(0xFF0B4F87),
            ),
            _buildServiceItem(
              'AGRICULTURE',
              'Direct advisory & market intelligence.',
              Icons.eco_outlined,
              const Color(0xFF1E8449),
            ),
            _buildServiceItem(
              'CITY SERVICES',
              'Unified grievance & civic resolutions.',
              Icons.account_balance_outlined,
              const Color(0xFFD68910),
            ),
            const SizedBox(height: 40),
            Center(
              child: Text(
                '© 2026 Seva Setu DPI. All rights reserved.',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: Colors.grey.shade400,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF1E8449).withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.5,
          color: const Color(0xFF1E8449),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 64,
          child: ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0B4F87),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              elevation: 0,
            ),
            child: Text(
              'ACCESS TERMINAL',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                letterSpacing: 2,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 64,
          child: OutlinedButton(
            onPressed: () => Navigator.pushNamed(context, '/register'),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF0B4F87), width: 1.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: Text(
              'ESTABLISH IDENTITY',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                letterSpacing: 2,
                color: const Color(0xFF0B4F87),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 2,
          color: const Color(0xFF1E8449),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: Colors.grey.shade400,
          ),
        ),
      ],
    );
  }

  Widget _buildServiceItem(String title, String desc, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.05),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0B4F87),
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  desc,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: Colors.grey.shade500,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
