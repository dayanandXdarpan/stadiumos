import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'dart:math' as math;

import '../widgets/glass_container.dart';

class StaffHomeScreen extends StatefulWidget {
  const StaffHomeScreen({super.key});

  @override
  State<StaffHomeScreen> createState() => _StaffHomeScreenState();
}

class _StaffHomeScreenState extends State<StaffHomeScreen>
    with TickerProviderStateMixin {
  
  // Staff Details
  static const String _staffName = 'Officer Deepak';
  static const String _zone = 'Zone B / C (North)';
  
  // GPS Location coordinates (mock PostGIS ping)
  double _lat = 51.5074;
  double _lng = -0.1278;
  int _gpsSats = 9;
  Timer? _gpsTimer;

  // Radar animation ticker
  late AnimationController _radarController;

  // Active Dispatches (Proximity based alerts)
  final List<Map<String, dynamic>> _dispatches = [
    {
      'id': 'disp-1',
      'title': '⚠️ Queue Congestion',
      'location': 'Gate 4 Concourse',
      'dist': '12 meters away',
      'detail': 'FlowMaster recommends manual lateral queue dispersal due to turnstile Gate-B backup.',
      'status': 'PENDING',
      'severity': 'HIGH'
    },
    {
      'id': 'disp-2',
      'title': '🚨 Medical Audit',
      'location': 'Block C Aisle 2',
      'dist': '38 meters away',
      'detail': 'CrowdIntelligence flagged localized noise anomalies. Dispatch responder to pre-check row 14.',
      'status': 'PENDING',
      'severity': 'MEDIUM'
    }
  ];

  // SQLite Offline ticket scanner parameters
  int _sqliteCacheCount = 14;
  bool _offlineMode = false;
  bool _isScanning = false;
  double _scanProgress = 0.0;
  Timer? _scanTimer;

  @override
  void initState() {
    super.initState();
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    // Pulse coordinate movements periodically to simulate active walking/patrolling
    _gpsTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!mounted) return;
      setState(() {
        _lat += (math.Random().nextDouble() - 0.5) * 0.0001;
        _lng += (math.Random().nextDouble() - 0.5) * 0.0001;
        _gpsSats = 7 + math.Random().nextInt(5);
      });
      // Silent haptic tick representing background location broadcast
      HapticFeedback.lightImpact();
    });
  }

  @override
  void dispose() {
    _radarController.dispose();
    _gpsTimer?.cancel();
    _scanTimer?.cancel();
    super.dispose();
  }

  // Trigger Local SQLite Scan Audit
  void _startOfflineScan() {
    if (_isScanning) return;
    HapticFeedback.mediumImpact();
    setState(() {
      _isScanning = true;
      _scanProgress = 0.0;
    });

    int ticks = 0;
    _scanTimer = Timer.periodic(const Duration(milliseconds: 80), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _scanProgress = ticks / 10.0;
      });

      if (ticks % 3 == 0) {
        HapticFeedback.lightImpact();
      }

      ticks++;
      if (ticks > 10) {
        timer.cancel();
        _onOfflineScanSuccess();
      }
    });
  }

  void _onOfflineScanSuccess() {
    HapticFeedback.heavyImpact();
    SystemSound.play(SystemSoundType.click);

    setState(() {
      _isScanning = false;
      _sqliteCacheCount++;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Color(0xFF00FF88)),
            const SizedBox(width: 10),
            Text(
              'Offline Ticket Validated & Cached! (SQLite Cache: $_sqliteCacheCount)',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF111827),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Accept/Complete Proximity alert dispatches
  void _handleDispatchAction(String id, String currentStatus) {
    HapticFeedback.mediumImpact();
    final idx = _dispatches.indexWhere((d) => d['id'] == id);
    if (idx == -1) return;

    setState(() {
      if (currentStatus == 'PENDING') {
        _dispatches[idx]['status'] = 'RESPONDING';
      } else {
        _dispatches.removeAt(idx);
      }
    });

    if (currentStatus == 'PENDING') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚡ Dispatch accepted! GPS location locked. Responding to site.'),
          backgroundColor: Color(0xFF00D4FF),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Dispatch complete! Flow status updated in Sector Ledger.'),
          backgroundColor: Color(0xFF00FF88),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0F1E),
      body: Stack(
        children: [
          // Cyber Space Backdrop
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF060B18), Color(0xFF0B1428)],
              ),
            ),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeaderBar(),
                  const SizedBox(height: 20),
                  
                  // Radar Map (PostGIS Background Location Beacons)
                  _buildRadarTrackingPanel(),
                  const SizedBox(height: 20),
                  
                  // Proximity Alerts Panel
                  _buildDispatchesPanel(),
                  const SizedBox(height: 20),
                  
                  // Offline Scanner Tool
                  _buildOfflineScannerPanel(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderBar() {
    return Row(
      children: [
        InkWell(
          onTap: () => Navigator.pushReplacementNamed(context, '/'),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: const Icon(Icons.logout, color: Colors.white, size: 16),
          ),
        ),
        const SizedBox(width: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _staffName,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
            Text(
              'Field Volunteer • Assigned: $_zone',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: Colors.white.withOpacity(0.5),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const Spacer(),
        // Network state toggle
        _buildOfflineModeToggle(),
      ],
    );
  }

  Widget _buildOfflineModeToggle() {
    return InkWell(
      onTap: () {
        HapticFeedback.mediumImpact();
        setState(() => _offlineMode = !_offlineMode);
      },
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: (_offlineMode ? Colors.red : const Color(0xFF00FF88)).withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: (_offlineMode ? Colors.red : const Color(0xFF00FF88)).withOpacity(0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _offlineMode ? Colors.red : const Color(0xFF00FF88),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              _offlineMode ? 'Edge SQLite' : 'Sync Active',
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: _offlineMode ? Colors.red : const Color(0xFF00FF88),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // PostgreSQL/PostGIS location tracking map
  Widget _buildRadarTrackingPanel() {
    return GlassContainer(
      padding: const EdgeInsets.all(18),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '📍 SPATIAL TELEMETRY BEACON',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  color: const Color(0xFF00D4FF),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF00D4FF).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'PostGIS SQL Sync',
                  style: GoogleFonts.inter(color: const Color(0xFF00D4FF), fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              // Rotating GPS Radar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black.withOpacity(0.4),
                  border: Border.all(color: const Color(0xFF00D4FF).withOpacity(0.3)),
                ),
                clipBehavior: Clip.antiAlias,
                child: AnimatedBuilder(
                  animation: _radarController,
                  builder: (context, _) => CustomPaint(
                    painter: _RadarGridPainter(_radarController.value),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              
              // Coordinates Display
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Latitude:  ${_lat.toStringAsFixed(6)}° N',
                      style: GoogleFonts.robotoMono(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Longitude: ${_lng.toStringAsFixed(6)}° W',
                      style: GoogleFonts.robotoMono(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.satellite_alt_outlined, color: Colors.white60, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          'Sats: $_gpsSats (Lock Active)',
                          style: GoogleFonts.inter(fontSize: 10, color: Colors.white60),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Active Dispatch panel
  Widget _buildDispatchesPanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Text(
            '⚠️ ACTIVE EMERGENCY DISPATCHES',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: Colors.white54,
            ),
          ),
        ),
        
        if (_dispatches.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.04)),
            ),
            child: Center(
              child: Text(
                'No dispatches assigned. Maintain sector boundary patrol.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.white38, fontSize: 13),
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _dispatches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = _dispatches[index];
              final isHigh = item['severity'] == 'HIGH';
              final isResponding = item['status'] == 'RESPONDING';
              
              final themeColor = isResponding 
                  ? const Color(0xFF00FF88) 
                  : (isHigh ? const Color(0xFFFF4444) : const Color(0xFFFFAA00));

              return Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF111827).withOpacity(0.8),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: themeColor.withOpacity(0.25)),
                  boxShadow: [
                    BoxShadow(color: themeColor.withOpacity(0.04), blurRadius: 10)
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item['title'],
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            color: themeColor,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: themeColor.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            item['dist'],
                            style: GoogleFonts.inter(
                              color: themeColor,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '📍 Target Site: ${item['location']}',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item['detail'],
                      style: GoogleFonts.inter(fontSize: 12, height: 1.4, color: Colors.white60),
                    ),
                    const SizedBox(height: 14),
                    
                    // Respond Action button
                    SizedBox(
                      width: double.infinity,
                      height: 42,
                      child: ElevatedButton(
                        onPressed: () => _handleDispatchAction(item['id'], item['status']),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: themeColor.withOpacity(0.12),
                          foregroundColor: themeColor,
                          side: BorderSide(color: themeColor, width: 1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        child: Text(
                          isResponding ? '✓ Mark Task Resolved' : '⚡ Accept Proximity Dispatch',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    ).animate().fadeIn(duration: 400.ms);
  }

  // Offline Scanner tool
  Widget _buildOfflineScannerPanel() {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '📴 OFFLINE SQLITE EDGE CHECKPOINT',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  color: const Color(0xFFFF9900),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF9900).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Edge Replica',
                  style: GoogleFonts.inter(color: const Color(0xFFFF9900), fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'In the event of stadium network collapse, turnstile units synchronize ticket validation records directly to localized SQLite caches.',
            style: GoogleFonts.inter(fontSize: 12, height: 1.4, color: Colors.white60),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SQLite Local Cache',
                    style: GoogleFonts.inter(fontSize: 11, color: Colors.white60),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$_sqliteCacheCount Ticket Scans',
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ],
              ),
              
              // Validate barcode offline
              SizedBox(
                height: 44,
                child: ElevatedButton(
                  onPressed: _startOfflineScan,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF9900).withOpacity(0.12),
                    foregroundColor: const Color(0xFFFF9900),
                    side: const BorderSide(color: Color(0xFFFF9900), width: 1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _isScanning 
                      ? SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(value: _scanProgress, strokeWidth: 3, color: const Color(0xFFFF9900))
                        )
                      : Row(
                          children: [
                            const Icon(Icons.qr_code_scanner, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'Scan Barcode',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Radar scanning Canvas painter
class _RadarGridPainter extends CustomPainter {
  final double sweep;
  _RadarGridPainter(this.sweep);

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2.0;
    final centerY = size.height / 2.0;
    final radius = size.width / 2.0;

    final gridPaint = Paint()
      ..color = const Color(0xFF00D4FF).withOpacity(0.12)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Concentric grid circles
    canvas.drawCircle(Offset(centerX, centerY), radius * 0.3, gridPaint);
    canvas.drawCircle(Offset(centerX, centerY), radius * 0.6, gridPaint);
    canvas.drawCircle(Offset(centerX, centerY), radius * 0.9, gridPaint);

    // Cross lines
    canvas.drawLine(Offset(0, centerY), Offset(size.width, centerY), gridPaint);
    canvas.drawLine(Offset(centerX, 0), Offset(centerX, size.height), gridPaint);

    // Dynamic scanning sweep line
    final angle = sweep * 2 * math.pi;
    final sx = centerX + radius * math.cos(angle);
    final sy = centerY + radius * math.sin(angle);

    final sweepPaint = Paint()
      ..color = const Color(0xFF00D4FF).withOpacity(0.8)
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(Offset(centerX, centerY), Offset(sx, sy), sweepPaint);

    // Fading sweep wedge shadow
    final wedgePath = Path()
      ..moveTo(centerX, centerY);
    for (int i = 0; i < 20; i++) {
      final prevAngle = angle - (i * 0.015);
      final px = centerX + radius * math.cos(prevAngle);
      final py = centerY + radius * math.sin(prevAngle);
      wedgePath.lineTo(px, py);
    }
    wedgePath.close();

    final wedgePaint = Paint()
      ..shader = RadialGradient(
        colors: [const Color(0xFF00D4FF).withOpacity(0.2), Colors.transparent],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawPath(wedgePath, wedgePaint);
  }

  @override
  bool shouldRepaint(_RadarGridPainter old) => old.sweep != sweep;
}
