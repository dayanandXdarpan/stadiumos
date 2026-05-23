import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:video_player/video_player.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:math' as math;

import '../services/websocket_service.dart';
import '../widgets/glass_container.dart';

class ARNavScreen extends StatefulWidget {
  const ARNavScreen({super.key});

  @override
  State<ARNavScreen> createState() => _ARNavScreenState();
}

class _ARNavScreenState extends State<ARNavScreen>
    with TickerProviderStateMixin {
  
  // Camera & Video player states
  CameraController? _cameraController;
  bool _cameraInitialized = false;
  List<CameraDescription> _cameras = [];

  VideoPlayerController? _videoController;
  bool _videoInitialized = false;
  bool _useVideoMode = true; // Toggle for Loop Video vs Live Camera vs Wireframe

  // Animation Controllers
  late AnimationController _arrowPulseController;
  late AnimationController _arrowRotateController;
  late AnimationController _pulseController;
  late AnimationController _wsIndicatorController;
  late AnimationController _tunnelTickController;

  StreamSubscription? _wsSubscription;
  String _currentRoute = 'Main corridor to Block C via junction G4 (Sheltered)';
  String _estimatedTime = '3 min';
  String _alternativeRoute = 'Concourse North (East gate bypass active)';
  
  bool _wsConnected = false;
  int _cpsLevel = 1; // 0-3: low, medium, high, critical

  static const _primary = Color(0xFF00D4FF);
  static const _success = Color(0xFF00FF88);
  static const _warning = Color(0xFFFFAA00);
  static const _danger = Color(0xFFFF4444);
  static const _textColor = Color(0xFFE2E8F0);
  static const _surface = Color(0xFF111827);

  @override
  void initState() {
    super.initState();
    
    _arrowPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    
    _arrowRotateController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    _wsIndicatorController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);

    _tunnelTickController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat();

    _initVideoPlayer();
    _initCamera();
    _connectWebSocket();
  }

  // Initialize pre-recorded looping hallway video with robust 3-stage self-healing fallback
  Future<void> _initVideoPlayer() async {
    // ── STAGE 1: Attempt to load local asset video ──
    try {
      debugPrint('[AR Engine] Attempting Stage 1: Local asset video ...');
      _videoController = VideoPlayerController.asset('assets/videos/hallway.mp4');
      await _videoController!.initialize();
      _onVideoInitSuccess();
      return;
    } catch (e) {
      debugPrint('[AR Engine] Stage 1 failed (expected if hallway.mp4 not bundled): $e');
    }

    // ── STAGE 2: Attempt network stream (download from anywhere) ──
    try {
      debugPrint('[AR Engine] Attempting Stage 2: Streaming from CDN ...');
      // Public high-speed CDN sample of walking down a futuristic sci-fi corridor
      const networkUrl = 'https://assets.mixkit.co/videos/preview/mixkit-walking-in-a-futuristic-tunnel-31846-large.mp4';
      _videoController = VideoPlayerController.networkUrl(Uri.parse(networkUrl));
      await _videoController!.initialize();
      _onVideoInitSuccess();
      return;
    } catch (e) {
      debugPrint('[AR Engine] Stage 2 failed (expected if device is completely offline): $e');
    }

    // ── STAGE 3: Engage completely offline procedural 3D wireframe tunnel ──
    debugPrint('[AR Engine] Engaging Stage 3: Offline procedural 3D wireframe tunnel fallback.');
    if (mounted) {
      setState(() {
        _videoInitialized = false;
        _useVideoMode = false; // Toggles animated wireframe grid fallback
      });
    }
  }

  void _onVideoInitSuccess() {
    if (mounted) {
      setState(() {
        _videoInitialized = true;
        _useVideoMode = true;
      });
      _videoController!.setLooping(true);
      _videoController!.setVolume(0.0); // Muted for safety
      _videoController!.play();
      debugPrint('[AR Engine] Video playback initialized and running successfully.');
    }
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        _cameraController = CameraController(
          _cameras.first,
          ResolutionPreset.high,
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

  void _connectWebSocket() {
    final wsService = WebSocketService();
    wsService.connect();
    setState(() => _wsConnected = wsService.isConnected);

    _wsSubscription = wsService.getStream().listen(
      (data) {
        if (!mounted) return;
        setState(() => _wsConnected = true);

        // Fix JSON structure parsing (check within data['payload'])
        final payload = data['payload'] as Map<String, dynamic>?;
        
        if (data['type'] == 'agent_action' && payload != null) {
          final action = payload['action'] ?? payload['actionType'];
          if (action == 'REROUTE') {
            final sector = payload['sector'] ?? 'C3';
            
            setState(() {
              _currentRoute = 'Route diverted: Safe path via Concourse East (Block D)';
              _estimatedTime = '5 min';
              _alternativeRoute = 'Avoid sector $sector — Crowd surge detected!';
              _cpsLevel = 3; // CRITICAL RED
            });

            // Spin the AR directional arrow to point RIGHT
            _arrowRotateController.forward();

            // Long haptic vibration trigger for the pitch demo buzz!
            HapticFeedback.vibrate();
            Future.delayed(const Duration(milliseconds: 300), () {
              HapticFeedback.vibrate();
            });

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.alt_route, color: _primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '🔄 AI Reroute: Diverting around surge in $sector',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                backgroundColor: _surface,
                duration: const Duration(seconds: 5),
              ),
            );
          }
        }
      },
      onError: (_) => setState(() => _wsConnected = false),
      onDone: () => setState(() => _wsConnected = false),
    );
  }

  @override
  void dispose() {
    _arrowPulseController.dispose();
    _arrowRotateController.dispose();
    _pulseController.dispose();
    _wsIndicatorController.dispose();
    _tunnelTickController.dispose();
    _cameraController?.dispose();
    _videoController?.dispose();
    _wsSubscription?.cancel();
    super.dispose();
  }

  Color get _cpsColor {
    switch (_cpsLevel) {
      case 0:
        return _success;
      case 1:
        return _primary;
      case 2:
        return _warning;
      default:
        return _danger;
    }
  }

  String get _cpsLabel {
    switch (_cpsLevel) {
      case 0:
        return 'SAFE';
      case 1:
        return 'NORMAL';
      case 2:
        return 'WARNING';
      default:
        return 'CRITICAL SURGE';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background layer engine
          _buildCameraLayer(),
          
          // AR visual guides overlay
          _buildAROverlay(),
          
          // Bottom routes indicator HUD
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomPanel(),
          ),
          
          // Top status HUD
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildTopBar(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushReplacementNamed(context, '/seat-view'),
        icon: const Icon(Icons.view_in_ar),
        label: Text('3D Seating Map', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: _cpsColor,
        foregroundColor: const Color(0xFF0A0F1E),
      ).animate(onPlay: (c) => c.repeat(reverse: true))
       .shimmer(duration: 2500.ms, color: Colors.white.withOpacity(0.35)),
    );
  }

  // Camera Backdrop / Video Backdrop / Sci-fi tunnel selector
  Widget _buildCameraLayer() {
    if (_useVideoMode && _videoInitialized && _videoController != null) {
      return SizedBox.expand(
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _videoController!.value.size.width,
            height: _videoController!.value.size.height,
            child: VideoPlayer(_videoController!),
          ),
        ),
      );
    }
    
    if (!_useVideoMode && _cameraInitialized && _cameraController != null) {
      return SizedBox.expand(
        child: CameraPreview(_cameraController!),
      );
    }

    // High-fidelity animated 3D Wireframe Cyber-Tunnel fallback
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF070B14), Color(0xFF0D1B35), Color(0xFF070B14)],
        ),
      ),
      child: AnimatedBuilder(
        animation: _tunnelTickController,
        builder: (context, _) => CustomPaint(
          painter: _ARWireframeTunnelPainter(_tunnelTickController.value),
          size: Size.infinite,
        ),
      ),
    );
  }

  Widget _buildAROverlay() {
    return SafeArea(
      child: Stack(
        children: [
          // Floating Arrow
          Center(
            child: AnimatedBuilder(
              animation: Listenable.merge([_arrowPulseController, _arrowRotateController]),
              builder: (context, child) {
                // Pulse translation offset
                final yOffset = -25.0 - 15.0 * _arrowPulseController.value;
                // Rotate arrow based on WebSocket trigger (0 to 90 degrees right)
                final angle = _arrowRotateController.value * (math.pi / 2.0);

                return Transform.translate(
                  offset: Offset(0, yOffset),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Floating Neon Direction bubble
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.65),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: _cpsColor.withOpacity(0.7)),
                          boxShadow: [
                            BoxShadow(
                              color: _cpsColor.withOpacity(0.2),
                              blurRadius: 15,
                              spreadRadius: 1,
                            )
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Spin the arrow!
                            Transform.rotate(
                              angle: angle,
                              child: Icon(
                                Icons.arrow_upward_rounded,
                                color: _cpsColor,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              _arrowRotateController.value > 0.8
                                  ? 'Diverting: Turn Right'
                                  : 'Follow shelters straight ahead',
                              style: GoogleFonts.inter(
                                color: _textColor,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 14),

                      // Holographic 3D neon arrow projection
                      Transform.rotate(
                        angle: angle,
                        child: CustomPaint(
                          size: const Size(60, 60),
                          painter: _ARNeonArrowPainter(_cpsColor, _arrowPulseController.value),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // CPS Telemetry indicator
          Positioned(
            top: 12,
            right: 16,
            child: _buildCPSIndicator(),
          ),

          // AI active badge
          Positioned(
            top: 12,
            left: 0,
            right: 0,
            child: Center(child: _buildAIBadge()),
          ),
        ],
      ),
    );
  }

  Widget _buildCPSIndicator() {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) => Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _cpsColor,
                boxShadow: [
                  BoxShadow(
                    color: _cpsColor.withOpacity(0.6),
                    blurRadius: 5 + 4 * math.sin(_pulseController.value * math.pi * 2).abs(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _cpsLabel,
            style: GoogleFonts.inter(
              color: _cpsColor,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAIBadge() {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: _success.withOpacity(0.12 + 0.04 * math.sin(_pulseController.value * math.pi * 2).abs()),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _success.withOpacity(0.45)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: _success,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '⚡ AI COGNITIVE NAVIGATION',
              style: GoogleFonts.inter(
                color: _success,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      color: Colors.black.withOpacity(0.7),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
                onPressed: () => Navigator.pushReplacementNamed(context, '/'),
              ),
              const SizedBox(width: 4),
              ShaderMask(
                shaderCallback: (b) => const LinearGradient(
                  colors: [_primary, _success],
                ).createShader(b),
                child: Text(
                  'StadiumOS Camera AR',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const Spacer(),
              
              // Segment selectors for Demo display flexibility
              _buildDemoModeSelectors(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDemoModeSelectors() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildModePill(
          label: 'VID',
          active: _useVideoMode,
          onTap: () {
            if (_videoInitialized) {
              setState(() => _useVideoMode = true);
              _videoController?.play();
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('assets/videos/hallway.mp4 missing. Falling back to 3D wireframe.')),
              );
            }
          },
        ),
        const SizedBox(width: 4),
        _buildModePill(
          label: 'CAM',
          active: !_useVideoMode && _cameraInitialized,
          onTap: () {
            if (_cameraInitialized) {
              setState(() => _useVideoMode = false);
              _videoController?.pause();
            }
          },
        ),
      ],
    );
  }

  Widget _buildModePill({required String label, required bool active, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: active ? _primary : Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: active ? _primary : Colors.white.withOpacity(0.1)),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: active ? Colors.black : Colors.white.withOpacity(0.5),
            fontSize: 9,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomPanel() {
    return GlassContainer(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.alt_route, color: _primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'LIVE ROUTE GUIDELINE',
                style: GoogleFonts.inter(
                  color: _primary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const Spacer(),
              _buildWSIndicator(),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _currentRoute,
            style: GoogleFonts.inter(
              color: _textColor,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.access_time, color: _success, size: 14),
              const SizedBox(width: 6),
              Text(
                'Est. time remaining: $_estimatedTime',
                style: GoogleFonts.inter(
                  color: _success,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          
          // Alternative details
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _cpsColor.withOpacity(0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _cpsColor.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.security_outlined, color: _cpsColor, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _alternativeRoute,
                    style: GoogleFonts.inter(
                      color: _cpsColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWSIndicator() {
    return AnimatedBuilder(
      animation: _wsIndicatorController,
      builder: (context, _) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _wsConnected ? _success : _danger,
              boxShadow: [
                BoxShadow(
                  color: (_wsConnected ? _success : _danger)
                      .withOpacity(0.4 + 0.3 * _wsIndicatorController.value),
                  blurRadius: 4,
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(
            _wsConnected ? 'Socket Live' : 'Offline',
            style: GoogleFonts.inter(
              color: _wsConnected ? _success : _danger,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Custom Painter rendering a 3D Holographic Neon AR Arrow ──
class _ARNeonArrowPainter extends CustomPainter {
  final Color glowColor;
  final double pulseValue;

  _ARNeonArrowPainter(this.glowColor, this.pulseValue);

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2.0;
    final centerY = size.height / 2.0;

    final paint = Paint()
      ..color = glowColor
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Glowing shadows using maskFilters
    final glowPaint = Paint()
      ..color = glowColor.withOpacity(0.5 + 0.3 * pulseValue)
      ..strokeWidth = 8.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);

    // Draw Arrow path pointing forward
    final path = Path()
      ..moveTo(centerX, 5)
      ..lineTo(5, centerY + 5)
      ..lineTo(centerX - 10, centerY)
      ..lineTo(centerX - 10, size.height - 5)
      ..lineTo(centerX + 10, size.height - 5)
      ..lineTo(centerX + 10, centerY)
      ..lineTo(size.width - 5, centerY + 5)
      ..close();

    // Renders custom glowing aura
    canvas.drawPath(path, glowPaint);
    canvas.drawPath(path, paint);

    // Draw perspective rings underneath
    final ringPaint = Paint()
      ..color = glowColor.withOpacity(0.2 + 0.1 * pulseValue)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final rect = Rect.fromCenter(
      center: Offset(centerX, size.height - 2),
      width: 44.0 + 8.0 * pulseValue,
      height: 12.0 + 3.0 * pulseValue,
    );
    canvas.drawOval(rect, ringPaint);
  }

  @override
  bool shouldRepaint(_ARNeonArrowPainter old) {
    return old.glowColor != glowColor || old.pulseValue != pulseValue;
  }
}

// ── Custom Painter rendering a gorgeous 3D Wireframe Cyber-Tunnel ──
class _ARWireframeTunnelPainter extends CustomPainter {
  final double progress; // continuous ticker coordinate (0.0 to 1.0)
  _ARWireframeTunnelPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2.0;
    final centerY = size.height / 2.0;

    final gridPaint = Paint()
      ..color = const Color(0xFF00D4FF).withOpacity(0.08)
      ..strokeWidth = 1.0;

    final ringPaint = Paint()
      ..color = const Color(0xFF00D4FF).withOpacity(0.12)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    // 1. Draw perspective gridlines from central vanishing point (horizon)
    const numRays = 16;
    for (int i = 0; i < numRays; i++) {
      final angle = (i * 2 * math.pi) / numRays;
      final dx = math.cos(angle) * size.width * 1.5;
      final dy = math.sin(angle) * size.height * 1.5;
      
      canvas.drawLine(
        Offset(centerX, centerY),
        Offset(centerX + dx, centerY + dy),
        gridPaint,
      );
    }

    // 2. Draw animated moving concentric rings simulating forward movement
    const numRings = 5;
    for (int i = 0; i < numRings; i++) {
      // Offset each ring by progress
      final ringProgress = (i + progress) / numRings;
      final radius = ringProgress * size.width * 0.8;
      
      // Ring opacity fades out as it gets closer/larger
      final opacity = (1.0 - ringProgress) * 0.15;
      ringPaint.color = const Color(0xFF00D4FF).withOpacity(opacity);
      
      // Draw rectangular perspective segments (tunnel frame)
      final rect = Rect.fromCenter(
        center: Offset(centerX, centerY),
        width: radius * 1.3,
        height: radius * 0.8,
      );
      canvas.drawRect(rect, ringPaint);
    }
  }

  @override
  bool shouldRepaint(_ARWireframeTunnelPainter old) => old.progress != progress;
}
