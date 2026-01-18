import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import 'dart:convert';

class DoctorDashboard extends StatefulWidget {
  const DoctorDashboard({super.key});

  @override
  State<DoctorDashboard> createState() => _DoctorDashboardState();
}

class _DoctorDashboardState extends State<DoctorDashboard> {
  int _selectedIndex = 0;
  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      DoctorDashboardTab(onTabChange: (index) => setState(() => _selectedIndex = index)),
      const AppointmentsTab(),
      const PatientsTab(),
      const AvailabilityTab(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/images/logo.png', height: 32),
            const SizedBox(width: 8),
            Text(
              'DOCTOR TERMINAL',
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                letterSpacing: 1.2,
                color: const Color(0xFF0B4F87),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF0B4F87)),
            onPressed: () {},
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle_outlined, color: Color(0xFF0B4F87)),
            itemBuilder: (context) => <PopupMenuEntry<String>>[
              PopupMenuItem<String>(
                enabled: false,
                child: ListTile(
                  leading: const Icon(Icons.medical_services_outlined, color: Color(0xFF0B4F87)),
                  title: Text(
                    authService.username ?? 'Doctor',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    'Verification ID: Verified',
                    style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF1E8449)),
                  ),
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem<String>(
                value: 'logout',
                child: ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: Text('Logout', style: GoogleFonts.outfit(color: Colors.red)),
                ),
              ),
            ],
            onSelected: (value) async {
              if (value == 'logout') {
                await authService.logout();
                if (!context.mounted) return;
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.grey.shade100, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF0B4F87),
          unselectedItemColor: Colors.grey.shade400,
          selectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 11),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 11),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'DASHBOARD'),
            BottomNavigationBarItem(icon: Icon(Icons.event_outlined), activeIcon: Icon(Icons.event), label: 'APPTS'),
            BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'PATIENTS'),
            BottomNavigationBarItem(icon: Icon(Icons.event_busy_outlined), activeIcon: Icon(Icons.event_busy), label: 'LEAVE'),
          ],
        ),
      ),
    );
  }
}

class DoctorDashboardTab extends StatelessWidget {
  final Function(int) onTabChange;
  const DoctorDashboardTab({super.key, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      children: [
        Text(
          'WELCOME, DOCTOR',
          style: GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF0B4F87).withOpacity(0.5),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'CLINICAL COMMAND',
          style: GoogleFonts.outfit(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF0B4F87),
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 32),
        _buildQuickAccessCard(
          context,
          'MANAGE APPOINTMENTS',
          'Coordinate schedules & patient visits',
          Icons.calendar_today_outlined,
          const Color(0xFF0B4F87),
          () => onTabChange(1),
        ),
        _buildQuickAccessCard(
          context,
          'PATIENT RECORDS',
          'Deploy diagnosis & health history',
          Icons.assignment_outlined,
          const Color(0xFF1E8449),
          () => onTabChange(2),
        ),
        _buildQuickAccessCard(
          context,
          'MANAGE AVAILABILITY',
          'Set unavailability & leave periods',
          Icons.event_busy_outlined,
          const Color(0xFFD68910),
          () => onTabChange(3),
        ),
      ],
    );
  }

  Widget _buildQuickAccessCard(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color accentColor,
    VoidCallback onTap,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade100, width: 1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(4),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(icon, color: accentColor, size: 28),
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
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: Colors.grey.shade300),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class AppointmentsTab extends StatefulWidget {
  const AppointmentsTab({super.key});

  @override
  State<AppointmentsTab> createState() => _AppointmentsTabState();
}

class _AppointmentsTabState extends State<AppointmentsTab> {
  List<dynamic> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    try {
      final response = await authService.get('/healthcare/appointments/');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _appointments = data is List ? data : data['results'] ?? [];
        });
      }
    } catch (e) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    
    return RefreshIndicator(
      onRefresh: _loadAppointments,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildHeading('ASSIGNED APPOINTMENTS'),
          const SizedBox(height: 16),
          if (_appointments.isEmpty)
            _buildEmptyState('No appointments assigned')
          else
            ..._appointments.map((apt) => _buildAppointmentCard(apt)).toList(),
        ],
      ),
    );
  }

  Widget _buildHeading(String text) {
    return Text(
      text,
      style: GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 2,
        color: const Color(0xFF0B4F87).withOpacity(0.5),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Icon(Icons.inbox_outlined, color: Colors.grey.shade300, size: 48),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.outfit(color: Colors.grey.shade400)),
        ],
      ),
    );
  }

  Widget _buildAppointmentCard(dynamic apt) {
    final status = apt['status'] ?? 'scheduled';
    final statusColor = status == 'completed' ? Colors.green : (status == 'cancelled' ? Colors.red : Colors.blue);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade100),
        borderRadius: BorderRadius.circular(4),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                apt['patient_name'] ?? 'Citizen ID: ${apt['patient']}',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: const Color(0xFF0B4F87)),
              ),
            ),
            _buildBadge(status.toUpperCase(), statusColor),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade400),
                const SizedBox(width: 4),
                Text(apt['appointment_date'] ?? '', style: GoogleFonts.outfit(fontSize: 12)),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 14, color: Colors.grey.shade400),
                const SizedBox(width: 4),
                Text(apt['appointment_time'] ?? '', style: GoogleFonts.outfit(fontSize: 12)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              apt['reason'] ?? 'Routine Checkup',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey.shade600),
            ),
          ],
        ),
        onTap: () => _showAppointmentActions(apt),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: color),
      ),
    );
  }

  Future<void> _cancelAppointment(int id) async {
    final authService = Provider.of<AuthService>(context, listen: false);
    try {
      final response = await authService.post('/healthcare/appointments/$id/cancel/', {});
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Appointment Cancelled')));
        _loadAppointments();
      }
    } catch (e) {}
  }

  void _showAppointmentActions(dynamic apt) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('APPOINTMENT ACTIONS', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, letterSpacing: 1.5, color: const Color(0xFF0B4F87).withOpacity(0.5), fontSize: 11)),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.add_task, color: Colors.green),
              title: Text('GENERATE MEDICAL RECORD', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (context) => MedicalRecordForm(appointment: apt)));
              },
            ),
            ListTile(
              leading: const Icon(Icons.history, color: Color(0xFF0B4F87)),
              title: Text('VIEW PATIENT HISTORY', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              onTap: () {
                Navigator.pop(context);
                // Patient history filtering logic could be added here
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Patient history loaded in Records tab')));
              },
            ),
            ListTile(
              leading: const Icon(Icons.cancel_outlined, color: Colors.red),
              title: Text('CANCEL APPOINTMENT', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              onTap: () {
                Navigator.pop(context);
                _cancelAppointment(apt['id']);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class PatientsTab extends StatefulWidget {
  const PatientsTab({super.key});

  @override
  State<PatientsTab> createState() => _PatientsTabState();
}

class _PatientsTabState extends State<PatientsTab> {
  List<dynamic> _records = [];
  List<dynamic> _filteredRecords = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadHistoricalRecords();
    _searchController.addListener(_filterRecords);
  }

  void _filterRecords() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredRecords = _records.where((rec) {
        final citizenId = rec['patient'].toString();
        final diagnosis = (rec['diagnosis'] ?? '').toString().toLowerCase();
        return citizenId.contains(query) || diagnosis.contains(query);
      }).toList();
    });
  }

  Future<void> _loadHistoricalRecords() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    try {
      final response = await authService.get('/healthcare/medical-records/');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _records = data is List ? data : data['results'] ?? [];
          _filteredRecords = _records;
        });
      }
    } catch (e) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeading('HISTORICAL PATIENT RECORDS'),
        const SizedBox(height: 16),
        _buildSearchBar(),
        const SizedBox(height: 16),
        if (_filteredRecords.isEmpty)
          _buildEmptyState('No matching records found')
        else
          ..._filteredRecords.map((rec) => _buildRecordCard(rec)).toList(),
      ],
    );
  }

  Widget _buildSearchBar() {
    return TextFormField(
      controller: _searchController,
      decoration: InputDecoration(
        hintText: 'Search by Citizen ID or Diagnosis...',
        hintStyle: GoogleFonts.outfit(fontSize: 13, color: Colors.grey.shade400),
        prefixIcon: const Icon(Icons.search, size: 20),
        filled: true,
        fillColor: Colors.grey.shade50,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.grey.shade100)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.grey.shade100)),
      ),
    );
  }

  Widget _buildHeading(String text) {
    return Text(
      text,
      style: GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 2,
        color: const Color(0xFF0B4F87).withOpacity(0.5),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Icon(Icons.history, color: Colors.grey.shade300, size: 48),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.outfit(color: Colors.grey.shade400)),
        ],
      ),
    );
  }

  Widget _buildRecordCard(dynamic rec) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade100),
        borderRadius: BorderRadius.circular(4),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(
          'Citizen ID: ${rec['patient']}',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: const Color(0xFF0B4F87)),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text('Diagnosis: ${rec['diagnosis']}', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
            const SizedBox(height: 4),
            Text('Symptoms: ${rec['symptoms']}', style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade600)),
            const SizedBox(height: 8),
            Text('Recorded on ${rec['created_at'].toString().split('T')[0]}', style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey.shade400)),
          ],
        ),
      ),
    );
  }
}

class AvailabilityTab extends StatefulWidget {
  const AvailabilityTab({super.key});

  @override
  State<AvailabilityTab> createState() => _AvailabilityTabState();
}

class _AvailabilityTabState extends State<AvailabilityTab> {
  List<dynamic> _unavailability = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUnavailability();
  }

  Future<void> _loadUnavailability() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    try {
      final response = await authService.get('/healthcare/unavailability/');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _unavailability = data is List ? data : data['results'] ?? [];
        });
      }
    } catch (e) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeading('UNAVAILABILITY PERIODS'),
        const SizedBox(height: 16),
        if (_unavailability.isEmpty)
          _buildEmptyState('Working at 100% capacity')
        else
          ..._unavailability.map((u) => _buildUnavailabilityCard(u)).toList(),
      ],
    );
  }

  Widget _buildHeading(String text) {
    return Text(
      text,
      style: GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 2,
        color: const Color(0xFF0B4F87).withOpacity(0.5),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Icon(Icons.check_circle_outline, color: const Color(0xFF1E8449).withOpacity(0.3), size: 48),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.outfit(color: Colors.grey.shade400)),
        ],
      ),
    );
  }

  Widget _buildUnavailabilityCard(dynamic u) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(u['reason'] ?? 'On Leave', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: const Color(0xFFD68910))),
              Icon(Icons.warning_amber_rounded, color: const Color(0xFFD68910).withOpacity(0.5), size: 16),
            ],
          ),
          const SizedBox(height: 8),
          Text('${u['start_date']} — ${u['end_date']}', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class MedicalRecordForm extends StatefulWidget {
  final dynamic appointment;
  const MedicalRecordForm({super.key, required this.appointment});

  @override
  State<MedicalRecordForm> createState() => _MedicalRecordFormState();
}

class _MedicalRecordFormState extends State<MedicalRecordForm> {
  final _diagnosisController = TextEditingController();
  final _symptomsController = TextEditingController();
  final _treatmentController = TextEditingController();
  final _tempController = TextEditingController();
  final _bpController = TextEditingController();
  final _pulseController = TextEditingController();
  bool _isSaving = false;

  Future<void> _saveRecord() async {
    setState(() => _isSaving = true);
    final authService = Provider.of<AuthService>(context, listen: false);
    try {
      final response = await authService.post('/healthcare/medical-records/', {
        'patient': widget.appointment['patient'],
        'appointment': widget.appointment['id'],
        'diagnosis': _diagnosisController.text,
        'symptoms': _symptomsController.text,
        'treatment_plan': _treatmentController.text,
        'vital_signs': {
          'temperature': _tempController.text,
          'bp': _bpController.text,
          'pulse': _pulseController.text,
        }
      });

      if (response.statusCode == 201) {
        // Now complete the appointment
        await authService.post('/healthcare/appointments/${widget.appointment['id']}/complete/', {});
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Medical Record Finalized')));
          Navigator.pop(context);
        }
      }
    } catch (e) {}
    setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('GENERATE RECORD', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Color(0xFF0B4F87)), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildLabel('VITAL SIGNS'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField(_tempController, 'TEMP (°F)', TextInputType.number)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField(_bpController, 'BP (mmHg)', TextInputType.text)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField(_pulseController, 'PULSE', TextInputType.number)),
              ],
            ),
            const SizedBox(height: 24),
            _buildLabel('CLINICAL ASSESSMENT'),
            const SizedBox(height: 16),
            _buildTextField(_diagnosisController, 'FINAL DIAGNOSIS', TextInputType.text),
            const SizedBox(height: 16),
            _buildTextField(_symptomsController, 'OBSERVED SYMPTOMS', TextInputType.text, maxLines: 2),
            const SizedBox(height: 16),
            _buildTextField(_treatmentController, 'TREATMENT PLAN', TextInputType.text, maxLines: 3),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveRecord,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E8449),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text('FINALIZE RECORD & COMPLETE APPT', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, letterSpacing: 1, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1, color: Colors.grey.shade400),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, TextInputType type, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF0B4F87).withOpacity(0.5))),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: type,
          maxLines: maxLines,
          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey.shade50,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.grey.shade100)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.grey.shade100)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ],
    );
  }
}
