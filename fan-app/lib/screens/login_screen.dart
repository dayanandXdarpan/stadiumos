import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:camera/camera.dart';
import 'dart:async';
import 'dart:math' as math;

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _ticketController = TextEditingController();
  final _emailController = TextEditingController();
  
  late AnimationController _pulseController;
  late AnimationController _particleController;
  late AnimationController _laserController;

  // Scanning State
  bool _isScanning = false;
  CameraController? _cameraController;
  bool _cameraInitialized = false;
  List<CameraDescription> _cameras = [];
  
  // Auth/Welcome State
  bool _isValidating = false;
  double _validationProgress = 0.0;
  bool _showWelcomeModal = false;
  Timer? _validationTimer;
  
  // Role State
  bool _isStaffMode = false;

  static const _background = Color(0xFF0A0F1E);
  static const _surface = Color(0xFF111827);
  static const _primary = Color(0xFF00D4FF);
  static const _success = Color(0xFF00FF88);
  static const _textColor = Color(0xFFE2E8F0);
  static const _danger = Color(0xFFFF4444);

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _particleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();

    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _particleController.dispose();
    _laserController.dispose();
    _cameraController?.dispose();
    _ticketController.dispose();
    _emailController.dispose();
    _validationTimer?.cancel();
    super.dispose();
  }

  // Camera Initialization for QR Scanner
  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        _cameraController = CameraController(
          _cameras.first,
          ResolutionPreset.medium,
          enableAudio: false,
        );
        await _cameraController!.initialize();
        if (mounted) {
          setState(() => _cameraInitialized = true);
        }
      }
    } catch (e) {
      debugPrint('Camera init error: $e');
    }
  }

  // Toggle QR Scan Mode
  void _toggleScanning(bool scan) {
    setState(() {
      _isScanning = scan;
      _isValidating = false;
      _validationProgress = 0.0;
    });

    if (scan) {
      _initCamera();
    } else {
      _cameraController?.dispose();
      _cameraController = null;
      _cameraInitialized = false;
    }
  }

  // Simulate scanning code and validate
  void _startQRScanValidation() {
    if (_isValidating) return;
    
    setState(() {
      _isValidating = true;
      _validationProgress = 0.0;
    });

    // Simulated scanning sequence with haptics
    int ticks = 0;
    _validationTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      setState(() {
        _validationProgress = ticks / 20.0;
      });

      // Quick haptic pulse to feel like scan laser locking
      if (ticks % 4 == 0) {
        HapticFeedback.lightImpact();
      }

      ticks++;
      if (ticks > 20) {
        timer.cancel();
        _onScanSuccess();
      }
    });
  }

  void _onScanSuccess() {
    // Authenticate and trigger success beep chime (visualized)
    HapticFeedback.heavyImpact();
    SystemSound.play(SystemSoundType.click);

    setState(() {
      _isValidating = false;
      _showWelcomeModal = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Animated gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0A0F1E),
                  Color(0xFF0D1B35),
                  Color(0xFF0A0F1E),
                ],
              ),
            ),
          ),
          
          // Particle effects
          AnimatedBuilder(
            animation: _particleController,
            builder: (context, child) => CustomPaint(
              painter: _ParticlePainter(_particleController.value),
              size: Size.infinite,
            ),
          ),

          // Main view router: form vs scanner
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: _isScanning ? _buildScannerLayout() : _buildFormLayout(),
              ),
            ),
          ),

          // AI Agent Concierge Modal Overlay
          if (_showWelcomeModal) _buildAIWelcomeModal(),
        ],
      ),
    );
  }

  // Form Layout
  Widget _buildFormLayout() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 20),
        _buildLogo(),
        const SizedBox(height: 12),
        Text(
          'Stadium Intelligence System',
          style: GoogleFonts.inter(
            color: _textColor.withOpacity(0.5),
            fontSize: 14,
            letterSpacing: 1.5,
            fontWeight: FontWeight.w600,
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 600.ms).slideY(begin: 0.2),
        const SizedBox(height: 32),

        // Segmented Role Selector in Flutter Form
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _primary.withOpacity(0.12)),
          ),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    setState(() => _isStaffMode = false);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: !_isStaffMode ? _primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        'Fan Attendee',
                        style: GoogleFonts.inter(
                          color: !_isStaffMode ? Colors.black : _textColor.withOpacity(0.5),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    setState(() => _isStaffMode = true);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: _isStaffMode ? const Color(0xFFFFaa00) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        'Staff Responder',
                        style: GoogleFonts.inter(
                          color: _isStaffMode ? Colors.black : _textColor.withOpacity(0.5),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: 350.ms),

        const SizedBox(height: 20),
        _buildInputCard(),
        const SizedBox(height: 24),
        _buildManualEnterButton(),
        const SizedBox(height: 16),
        
        // Scan QR code divider/alternate route
        Row(
          children: [
            Expanded(child: Divider(color: _primary.withOpacity(0.15), thickness: 1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              style: GoogleFonts.inter(fontSize: 11, color: _primary.withOpacity(0.4), fontWeight: FontWeight.bold, letterSpacing: 1),
              child: Text(_isStaffMode ? 'OR SCAN STAFF BADGE' : 'OR SCAN TICKET'),
            ),
            Expanded(child: Divider(color: _primary.withOpacity(0.15), thickness: 1)),
          ],
        ).animate().fadeIn(delay: 800.ms),
        
        const SizedBox(height: 16),
        _buildQRScannerToggleButton(),
        const SizedBox(height: 40),
        
        Text(
          'Powered by StadiumOS Multi-Agent Swarm',
          style: GoogleFonts.inter(
            color: _primary.withOpacity(0.4),
            fontSize: 11,
            letterSpacing: 0.8,
          ),
        ).animate().fadeIn(delay: 1000.ms),
        const SizedBox(height: 20),
      ],
    );
  }

  // Scanner Layout
  Widget _buildScannerLayout() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: _textColor, size: 18),
              onPressed: () => _toggleScanning(false),
            ),
            Text(
              _isStaffMode ? 'STAFF CREDS SCANNER' : 'TICKET ENTRY SCANNER',
              style: GoogleFonts.inter(
                color: _textColor,
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(width: 40), // spacer
          ],
        ).animate().fadeIn(duration: 400.ms),
        
        const SizedBox(height: 40),

        // Glowing Scanning frame viewport
        Container(
          width: 280,
          height: 280,
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.6),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: _isValidating 
                  ? _success.withOpacity(0.8) 
                  : (_isStaffMode ? const Color(0xFFFFaa00).withOpacity(0.3) : _primary.withOpacity(0.3)),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: (_isValidating 
                    ? _success 
                    : (_isStaffMode ? const Color(0xFFFFaa00) : _primary)).withOpacity(0.15),
                blurRadius: 30,
                spreadRadius: 2,
              )
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Camera Preview
              if (_cameraInitialized && _cameraController != null)
                SizedBox.expand(child: CameraPreview(_cameraController!))
              else
                // High-fidelity fallback scanner grid
                Positioned.fill(
                  child: Container(
                    color: const Color(0xFF0F172A),
                    child: CustomPaint(painter: _ScannerFallbackGridPainter()),
                  ),
                ),

              // Scanning laser sweep bar
              AnimatedBuilder(
                animation: _laserController,
                builder: (context, child) {
                  final position = _laserController.value * 280;
                  return Positioned(
                    top: position,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: _isValidating 
                                ? _success 
                                : (_isStaffMode ? const Color(0xFFFFaa00) : _primary),
                            blurRadius: 12,
                            spreadRadius: 3,
                          )
                        ],
                      ),
                    ),
                  );
                },
              ),

              // Scanner HUD/Overlay
              _buildScannerReticleHUD(),

              // Validating indicator
              if (_isValidating)
                Positioned.fill(
                  child: Container(
                    color: Colors.black.withOpacity(0.5),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(
                            value: _validationProgress,
                            color: _isStaffMode ? const Color(0xFFFFaa00) : _success,
                            strokeWidth: 4.5,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _isStaffMode ? 'AUDITING STAFF PROFILE...' : 'AUDITING SIGNATURE...',
                            style: GoogleFonts.inter(
                              color: _isStaffMode ? const Color(0xFFFFaa00) : _success,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),

        const SizedBox(height: 36),

        Text(
          _isStaffMode 
              ? 'Hold up your Staff badge to authenticate Secure Edge Node' 
              : 'Hold your printed QR code ticket up to the screen',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            color: _textColor.withOpacity(0.6),
            fontSize: 13,
          ),
        ),

        const SizedBox(height: 30),

        // Simulate Scanner shortcut button
        ElevatedButton(
          onPressed: _startQRScanValidation,
          style: ElevatedButton.styleFrom(
            backgroundColor: (_isStaffMode ? const Color(0xFFFFaa00) : _primary).withOpacity(0.12),
            foregroundColor: _isStaffMode ? const Color(0xFFFFaa00) : _primary,
            side: BorderSide(color: _isStaffMode ? const Color(0xFFFFaa00) : _primary, width: 1),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.qr_code_scanner, size: 20),
              const SizedBox(width: 10),
              Text(
                _isStaffMode ? 'Hold Up Badge (Simulate)' : 'Hold Up Ticket (Simulate)',
                style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ],
          ),
        ).animate(onPlay: (c) => c.repeat(reverse: true))
         .shimmer(duration: 2000.ms, color: (_isStaffMode ? const Color(0xFFFFaa00) : _primary).withOpacity(0.3)),

        const SizedBox(height: 30),
      ],
    );
  }

  // Scanner corner brackets reticle
  Widget _buildScannerReticleHUD() {
    return Positioned.fill(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: CustomPaint(
          painter: _ScannerHUDCornerPainter(_isValidating 
              ? _success 
              : (_isStaffMode ? const Color(0xFFFFaa00) : _primary)),
        ),
      ),
    );
  }

  // AI Welcome Concierge Modal Card (Updated with Staff-mode credentials support)
  Widget _buildAIWelcomeModal() {
    final welcomeThemeColor = _isStaffMode ? const Color(0xFFFFaa00) : _success;

    return Container(
      color: Colors.black.withOpacity(0.85),
      alignment: Alignment.bottomCenter,
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
          border: Border.all(color: welcomeThemeColor.withOpacity(0.3), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: welcomeThemeColor.withOpacity(0.1),
              blurRadius: 40,
              spreadRadius: 5,
            )
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // AI Assistant Header badge
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [welcomeThemeColor, _isStaffMode ? const Color(0xFFD97706) : const Color(0xFF00AA55)],
                    ),
                  ),
                  child: const Center(
                    child: Icon(Icons.support_agent, color: Color(0xFF0A0F1E), size: 20),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isStaffMode ? 'AI Staff Coordinator Agent' : 'AI Fan Assistant Swarm',
                      style: GoogleFonts.inter(
                        color: welcomeThemeColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Text(
                      _isStaffMode ? 'Security Command Grid' : 'Localized Context Agent',
                      style: GoogleFonts.inter(
                        color: _textColor.withOpacity(0.4),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: welcomeThemeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: welcomeThemeColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    _isStaffMode ? 'STAFF SECURE' : 'TICKET VALID',
                    style: GoogleFonts.inter(color: welcomeThemeColor, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),
            
            // Personalized Greeting Speech text
            Text(
              _isStaffMode ? 'Access Granted, Officer.' : 'Welcome, Deepak.',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            
            // Speech text bubble
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0F1E).withOpacity(0.5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _textColor.withOpacity(0.08)),
              ),
              child: Text(
                _isStaffMode 
                    ? 'Security Responder Deepak successfully logged in.\n\nAssigned Grid: Zone B & C (North Stand).\n\n⚠️ Dispatch Advisory:\n1. Your device location has been broadcasted to the PostgreSQL/PostGIS spatial database.\n2. Local SQLite Edge-Sync is online. Scans are cached locally if venue networks fail.'
                    : 'Your ticket is validated at turnstile G! Your seat is located in Block C (Covered stand).\n\n⚠️ Operational Notice:\nI noticed it is currently raining at the venue—I have custom-mapped a sheltered route through concourse junction G4 to keep you completely dry.',
                style: GoogleFonts.inter(
                  color: _textColor.withOpacity(0.85),
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ),
            
            const SizedBox(height: 28),

            // DYNAMIC BUTTON INTERFACES BASED ON ROLE
            if (_isStaffMode)
              // Staff Mode Action button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFaa00), Color(0xFFD97706)],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFaa00).withOpacity(0.25),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() => _showWelcomeModal = false);
                      Navigator.pushReplacementNamed(context, '/staff-home');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.security, color: Color(0xFF0A0F1E), size: 20),
                        const SizedBox(width: 10),
                        Text(
                          'Open Staff Command Console',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF0A0F1E),
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              // Two separate Fan buttons
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: _primary.withOpacity(0.4)),
                      ),
                      child: InkWell(
                        onTap: () {
                          setState(() => _showWelcomeModal = false);
                          Navigator.pushReplacementNamed(context, '/seat-view');
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.view_in_ar, color: _primary, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                '3D Seat Map',
                                style: GoogleFonts.inter(
                                  color: _textColor,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [_success, Color(0xFF0088FF)],
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: _success.withOpacity(0.25),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: InkWell(
                        onTap: () {
                          setState(() => _showWelcomeModal = false);
                          Navigator.pushReplacementNamed(context, '/ar');
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.navigation_outlined, color: Color(0xFF0A0F1E), size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'AR Camera Guide',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF0A0F1E),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    ).animate().slideY(begin: 1.0, duration: 400.ms, curve: Curves.easeOutCubic);
  }

  // Header Logo
  Widget _buildLogo() {
    return Column(
      children: [
        AnimatedBuilder(
          animation: _pulseController,
          builder: (context, child) => Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: _isStaffMode 
                    ? [const Color(0xFFFFaa00), const Color(0xFFB45309)] 
                    : [_primary, const Color(0xFF0077CC)],
              ),
              boxShadow: [
                BoxShadow(
                  color: (_isStaffMode ? const Color(0xFFFFaa00) : _primary).withOpacity(0.25 + 0.15 * _pulseController.value),
                  blurRadius: 25 + 15 * _pulseController.value,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Center(
              child: Text(_isStaffMode ? '🛡️' : '🏟️', style: const TextStyle(fontSize: 42)),
            ),
          ),
        ),
        const SizedBox(height: 18),
        ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            colors: _isStaffMode ? [const Color(0xFFFFaa00), const Color(0xFFF97316)] : [_primary, _success],
          ).createShader(bounds),
          child: Text(
            'StadiumOS',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.85, 0.85), duration: 600.ms, curve: Curves.easeOutCubic);
  }

  // Input Card (Form details)
  Widget _buildInputCard() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: _surface.withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: (_isStaffMode ? const Color(0xFFFFaa00) : _primary).withOpacity(0.15),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          _buildTextField(
            controller: _ticketController,
            hint: _isStaffMode ? 'Staff Security Badge Serial' : 'Ticket Confirmation ID (e.g. TICK-7392)',
            icon: _isStaffMode ? Icons.security : Icons.qr_code_outlined,
          ),
          const SizedBox(height: 14),
          _buildTextField(
            controller: _emailController,
            hint: 'Email address registered',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms, duration: 600.ms).slideY(begin: 0.2);
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    final activeThemeColor = _isStaffMode ? const Color(0xFFFFaa00) : _primary;

    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: GoogleFonts.inter(color: _textColor, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.inter(
          color: _textColor.withOpacity(0.3),
          fontSize: 14,
        ),
        prefixIcon: Icon(icon, color: activeThemeColor.withOpacity(0.6), size: 18),
        filled: true,
        fillColor: const Color(0xFF0A0F1E).withOpacity(0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: activeThemeColor.withOpacity(0.15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: activeThemeColor.withOpacity(0.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: activeThemeColor, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  // Normal Sign in button
  Widget _buildManualEnterButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: (_isStaffMode ? const Color(0xFFFFaa00) : _primary).withOpacity(0.2)),
        ),
        child: ElevatedButton(
          onPressed: () {
            // Setup default credentials
            setState(() {
              _showWelcomeModal = true;
            });
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: Text(
            _isStaffMode ? 'Sign In as Staff' : 'Manual Sign In',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: _textColor,
            ),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 600.ms, duration: 600.ms).slideY(begin: 0.2);
  }

  // QR entry toggle option
  Widget _buildQRScannerToggleButton() {
    final activeThemeColor = _isStaffMode ? const Color(0xFFFFaa00) : _primary;

    return SizedBox(
      width: double.infinity,
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: _isStaffMode 
                ? [const Color(0xFFFFaa00), const Color(0xFFEab308)] 
                : [_primary, const Color(0xFF0077FF)],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: activeThemeColor.withOpacity(0.2),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: () => _toggleScanning(true),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.qr_code_scanner, color: const Color(0xFF0A0F1E), size: 18),
              const SizedBox(width: 10),
              Text(
                _isStaffMode ? 'Scan Staff Badge' : 'Scan Ticket QR code',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0A0F1E),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 700.ms, duration: 600.ms).slideY(begin: 0.2);
  }
}


// Custom painter to draw corner brackets on QR Scanner Overlay
class _ScannerHUDCornerPainter extends CustomPainter {
  final Color color;
  _ScannerHUDCornerPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const length = 24.0;

    // Top Left Corner
    canvas.beginPath();
    canvas.moveTo(0, length);
    canvas.lineTo(0, 0);
    canvas.lineTo(length, 0);
    canvas.stroke();

    // Top Right Corner
    canvas.beginPath();
    canvas.moveTo(size.width - length, 0);
    canvas.lineTo(size.width, 0);
    canvas.lineTo(size.width, length);
    canvas.stroke();

    // Bottom Right Corner
    canvas.beginPath();
    canvas.moveTo(size.width, size.height - length);
    canvas.lineTo(size.width, size.height);
    canvas.lineTo(size.width - length, size.height);
    canvas.stroke();

    // Bottom Left Corner
    canvas.beginPath();
    canvas.moveTo(length, size.height);
    canvas.lineTo(0, size.height);
    canvas.lineTo(0, size.height - length);
    canvas.stroke();
  }

  @override
  bool shouldRepaint(_ScannerHUDCornerPainter old) => old.color != color;
}

// Fallback grid in case camera isn't accessible
class _ScannerFallbackGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00D4FF).withOpacity(0.08)
      ..strokeWidth = 1;

    const spacing = 20.0;
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    final targetPaint = Paint()
      ..color = const Color(0xFF00D4FF).withOpacity(0.2)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width / 4, targetPaint);
  }

  @override
  bool shouldRepaint(_ScannerFallbackGridPainter old) => false;
}

class _ParticlePainter extends CustomPainter {
  final double progress;

  _ParticlePainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final random = math.Random(42);

    for (int i = 0; i < 20; i++) {
      final baseX = random.nextDouble() * size.width;
      final baseY = random.nextDouble() * size.height;
      final offset = math.sin((progress * 2 * math.pi) + i * 0.7) * 12;
      final opacity = (0.03 + random.nextDouble() * 0.05) *
          (0.5 + 0.5 * math.sin((progress * 2 * math.pi) + i));

      paint.color = const Color(0xFF00D4FF).withOpacity(opacity);
      canvas.drawCircle(
        Offset(baseX + offset, baseY + offset * 0.5),
        1.5 + random.nextDouble() * 2.0,
        paint,
      );
    }

    // Floating orbs
    final orbPaint = Paint()
      ..style = PaintingStyle.fill
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 50);

    orbPaint.color = const Color(0xFF00D4FF).withOpacity(0.03);
    canvas.drawCircle(
      Offset(size.width * 0.2, size.height * 0.2 + math.sin(progress * math.pi * 2) * 15),
      100,
      orbPaint,
    );
    orbPaint.color = const Color(0xFF00FF88).withOpacity(0.02);
    canvas.drawCircle(
      Offset(size.width * 0.8, size.height * 0.8 + math.cos(progress * math.pi * 2) * 20),
      120,
      orbPaint,
    );
  }

  @override
  bool shouldRepaint(_ParticlePainter old) => old.progress != progress;
}
