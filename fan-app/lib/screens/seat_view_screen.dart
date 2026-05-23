import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'dart:math' as math;

import '../services/websocket_service.dart';
import '../widgets/glass_container.dart';

class SeatViewScreen extends StatefulWidget {
  const SeatViewScreen({super.key});

  @override
  State<SeatViewScreen> createState() => _SeatViewScreenState();
}

class _SeatViewScreenState extends State<SeatViewScreen>
    with TickerProviderStateMixin {
  
  // Seating grid dimensions
  static const List<String> _rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  static const int _cols = 12;

  // Selected State
  String _selectedRow = 'C';
  int _selectedCol = 6;
  bool _showReroute = true;

  // Real-time WebSocket parameters for Block C
  bool _wsConnected = false;
  double _cps = 0.35;
  double _density = 0.40;
  StreamSubscription? _wsSubscription;

  // Camera Animation Coordinates
  double _camX = 0;
  double _camY = -80;
  double _camZoom = 1.05;
  double _camPitch = 0.65;
  double _camYaw = -0.45;

  // Target Camera Coordinates (for swooping)
  double _targetX = 0;
  double _targetY = -80;
  double _targetZoom = 1.05;
  double _targetPitch = 0.65;
  double _targetYaw = -0.45;

  late AnimationController _swoopController;
  late AnimationController _glowController;
  
  // Track continuous render frame ticks
  late AnimationController _ticksController;

  @override
  void initState() {
    super.initState();
    
    _swoopController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _ticksController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    _connectWebSocket();

    // Auto-swoop focus to user's seat on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _swoopToSeat(_selectedRow, _selectedCol);
    });
  }

  @override
  void dispose() {
    _swoopController.dispose();
    _glowController.dispose();
    _ticksController.dispose();
    _wsSubscription?.cancel();
    super.dispose();
  }

  void _connectWebSocket() {
    final wsService = WebSocketService();
    wsService.connect();
    setState(() => _wsConnected = wsService.isConnected);

    _wsSubscription = wsService.getStream().listen(
      (data) {
        if (!mounted) return;
        setState(() => _wsConnected = true);
        
        // Listen to live sector updates or agent actions
        if (data['type'] == 'sector_update') {
          final payload = data['payload'] as Map<String, dynamic>?;
          // Sync with Sector C3 or dynamic ticket sector
          if (payload != null && (payload['sectorId'] == 'C3' || payload['sectorId'] == 'C2')) {
            setState(() {
              _cps = (payload['cps'] as num?)?.toDouble() ?? 0.35;
              _density = (payload['density'] as num?)?.toDouble() ?? 0.40;
            });
          }
        } else if (data['type'] == 'agent_action') {
          final payload = data['payload'] as Map<String, dynamic>?;
          if (payload != null && payload['action'] == 'REROUTE') {
            setState(() {
              _cps = 0.82; // Inflate during live crowd surge reroutes
              _density = 0.88;
              _showReroute = true;
            });
            HapticFeedback.vibrate();
          }
        }
      },
      onError: (_) => setState(() => _wsConnected = false),
      onDone: () => setState(() => _wsConnected = false),
    );
  }

  // Swoops the camera close-up onto the designated seat coordinates
  void _swoopToSeat(String row, int col) {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedRow = row;
      _selectedCol = col;
    });

    final rowIndex = _rows.indexOf(row);
    final colIndex = col - 1;

    // Calculate grid offsets
    final gridX = (colIndex - _cols / 2.0) * 26.0;
    final gridY = (rowIndex - _rows.length / 2.0) * 26.0;

    // Set target swoop camera coordinates
    _targetX = -gridX * 0.8;
    _targetY = -gridY * 0.8 - 50;
    _targetZoom = 1.9;
    _targetPitch = 0.80; // steep focus angle
    _targetYaw = -0.32;  // slight perspective tilt

    // Set starting state for animation interpolation
    final startX = _camX;
    final startY = _camY;
    final startZoom = _camZoom;
    final startPitch = _camPitch;
    final startYaw = _camYaw;

    _swoopController.reset();
    _swoopController.addListener(() {
      final t = Curves.easeOutCubic.transform(_swoopController.value);
      setState(() {
        _camX = startX + (_targetX - startX) * t;
        _camY = startY + (_targetY - startY) * t;
        _camZoom = startZoom + (_targetZoom - startZoom) * t;
        _camPitch = startPitch + (_targetPitch - startPitch) * t;
        _camYaw = startYaw + (_targetYaw - startYaw) * t;
      });
    });

    _swoopController.forward();
  }

  void _resetCamera() {
    HapticFeedback.mediumImpact();
    _targetX = 0;
    _targetY = -70;
    _targetZoom = 1.05;
    _targetPitch = 0.65;
    _targetYaw = -0.45;

    final startX = _camX;
    final startY = _camY;
    final startZoom = _camZoom;
    final startPitch = _camPitch;
    final startYaw = _camYaw;

    _swoopController.reset();
    _swoopController.addListener(() {
      final t = Curves.easeOutCubic.transform(_swoopController.value);
      setState(() {
        _camX = startX + (_targetX - startX) * t;
        _camY = startY + (_targetY - startY) * t;
        _camZoom = startZoom + (_targetZoom - startZoom) * t;
        _camPitch = startPitch + (_targetPitch - startPitch) * t;
        _camYaw = startYaw + (_targetYaw - startYaw) * t;
      });
    });
    _swoopController.forward();
  }

  Color get _cpsColor {
    if (_cps < 0.4) return const Color(0xFF00FF88); // Safe
    if (_cps < 0.6) return const Color(0xFFFFAA00); // Caution
    if (_cps < 0.75) return const Color(0xFFFF6400); // Warning
    return const Color(0xFFFF4444); // Critical
  }

  String get _cpsStatusText {
    if (_cps < 0.4) return 'SAFE FLOW';
    if (_cps < 0.6) return 'HEAVY DENSITY';
    if (_cps < 0.75) return 'CONGESTION WARNING';
    return 'CROWD SURGE ALERT';
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      backgroundColor: const Color(0xFF0A0F1E),
      body: Stack(
        children: [
          // ── Background space ──
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.2,
                  colors: [Color(0xFF0D1F3D), Color(0xFF070B14)],
                ),
              ),
            ),
          ),

          // ── Interactive 3D Canvas CustomPainter ──
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _ticksController,
              builder: (context, child) => GestureDetector(
                onPanUpdate: (details) {
                  // Enable drag/rotation adjustment for premium feels
                  setState(() {
                    _camYaw += details.delta.dx * 0.003;
                    _camPitch = math.max(0.3, math.min(1.2, _camPitch - details.delta.dy * 0.003));
                  });
                },
                child: CustomPaint(
                  painter: _Stadium3DPainter(
                    rows: _rows,
                    cols: _cols,
                    selectedRow: _selectedRow,
                    selectedCol: _selectedCol,
                    camX: _camX,
                    camY: _camY,
                    camZoom: _camZoom,
                    camPitch: _camPitch,
                    camYaw: _camYaw,
                    cps: _cps,
                    cpsColor: _cpsColor,
                    showReroute: _showReroute,
                    timeTick: _ticksController.value,
                    glowIntensity: _glowController.value,
                  ),
                ),
              ),
            ),
          ),

          // ── HUD: Header Top Bar ──
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildTopHeader(),
          ),

          // ── HUD: Bottom Ticket Info & Controls ──
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomSeatHUD(),
          ),

          // ── Float HUD buttons (Reroute toggle, reset camera) ──
          Positioned(
            right: 16,
            bottom: 235,
            child: Column(
              children: [
                _buildFloatActionButton(
                  icon: Icons.alt_route,
                  onTap: () => setState(() => _showReroute = !_showReroute),
                  color: _showReroute ? _cpsColor : Colors.white.withOpacity(0.3),
                  tooltip: 'Toggle Flow Routes',
                ),
                const SizedBox(height: 10),
                _buildFloatActionButton(
                  icon: Icons.center_focus_strong,
                  onTap: _resetCamera,
                  color: _wsConnected ? const Color(0xFF00D4FF) : Colors.white.withOpacity(0.3),
                  tooltip: 'Reset Perspective',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopHeader() {
    return Container(
      color: Colors.black.withOpacity(0.55),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              // Back button to Login screen
              InkWell(
                onTap: () => Navigator.pushReplacementNamed(context, '/'),
                child: Container(
                  constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: const Icon(Icons.logout, color: Colors.white, size: 16),
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '3D Digital Twin Seat View',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Block C Seating Matrix • Live Monitoring',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.white.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              _buildWSIndicator(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWSIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: (_wsConnected ? const Color(0xFF00FF88) : Colors.red).withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: (_wsConnected ? const Color(0xFF00FF88) : Colors.red).withOpacity(0.3),
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
              color: _wsConnected ? const Color(0xFF00FF88) : Colors.red,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            _wsConnected ? 'Socket Live' : 'Mock Mode',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: _wsConnected ? const Color(0xFF00FF88) : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatActionButton({
    required IconData icon,
    required VoidCallback onTap,
    required Color color,
    required String tooltip,
  }) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFF111827).withOpacity(0.85),
        shape: BoxShape.circle,
        border: Border.all(color: color.withOpacity(0.5), width: 1.5),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.15), blurRadius: 10, spreadRadius: 1)
        ],
      ),
      child: ClipOval(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Icon(icon, color: color, size: 20),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomSeatHUD() {
    return GlassContainer(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row/Seat ticket badges
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'LOCATED TICKET SEAT',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                      color: _cpsColor,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _buildTicketBadge(label: 'BLOCK', value: 'C'),
                      const SizedBox(width: 8),
                      _buildTicketBadge(label: 'ROW', value: _selectedRow),
                      const SizedBox(width: 8),
                      _buildTicketBadge(label: 'SEAT', value: '$_selectedCol'),
                    ],
                  ),
                ],
              ),
              
              // CPS Mini telemetry panel
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _cpsColor.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'CPS LEVEL: ${_cps.toStringAsFixed(2)}',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: _cpsColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _cpsStatusText,
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.white.withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          
          // Helper tip
          Text(
            'Interactive Mode: Click any seat on the 3D grid above to swoop focus and map its exact entry coordinate.',
            style: GoogleFonts.inter(
              fontSize: 11,
              height: 1.4,
              color: Colors.white.withOpacity(0.55),
            ),
          ),
          
          const SizedBox(height: 18),
          
          // Switch to Live AR Cam Navigation Guide
          SizedBox(
            width: double.infinity,
            height: 52,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [_cpsColor, const Color(0xFF0088FF)],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: _cpsColor.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/ar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.photo_camera_front_outlined, color: Color(0xFF0A0F1E), size: 20),
                    const SizedBox(width: 10),
                    Text(
                      'Open AI Camera AR Guide',
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
          ),
        ],
      ),
    );
  }

  Widget _buildTicketBadge({required String label, required String value}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.white.withOpacity(0.4),
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

// ── CustomPainter implementing 3D Stadium Seating grid ──
class _Stadium3DPainter extends CustomPainter {
  final List<String> rows;
  final int cols;
  final String selectedRow;
  final int selectedCol;
  
  // Camera state
  final double camX;
  final double camY;
  final double camZoom;
  final double camPitch;
  final double camYaw;

  // Real-time parameters
  final double cps;
  final Color cpsColor;
  final bool showReroute;
  final double timeTick;
  final double glowIntensity;

  _Stadium3DPainter({
    required this.rows,
    required this.cols,
    required this.selectedRow,
    required this.selectedCol,
    required this.camX,
    required this.camY,
    required this.camZoom,
    required this.camPitch,
    required this.camYaw,
    required this.cps,
    required this.cpsColor,
    required this.showReroute,
    required this.timeTick,
    required this.glowIntensity,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2.0;
    final centerY = size.height / 2.0;

    // ── 3D Projection Math Helper ──
    Offset project(double x, double y, double z) {
      // Rotation around Z (Yaw)
      final cosY = math.cos(camYaw);
      final sinY = math.sin(camYaw);
      final rx = x * cosY - y * sinY;
      final ry = x * sinY + y * cosY;

      // Rotation around X (Pitch tilt towards screen)
      final cosP = math.cos(camPitch);
      final sinP = math.sin(camPitch);
      final finalY = ry * cosP - z * sinP;
      final finalZ = ry * sinP + z * cosP;

      // Perspective compression factor
      const fov = 350.0;
      final scale = fov / (fov + finalZ);
      
      // Scale based on active swoop camera zoom
      return Offset(
        centerX + (rx * scale) * camZoom + camX,
        centerY + (finalY * scale) * camZoom + camY,
      );
    }

    final standWidth = cols * 24.0 + 40;
    final standHeight = rows.length * 24.0 + 40;

    // ── Step 1: Draw concrete pedestal structure stand ──
    final pBasePts = [
      project(-standWidth / 2.0, -standHeight / 2.0, -10),
      project(standWidth / 2.0, -standHeight / 2.0, -10),
      project(standWidth / 2.0, standHeight / 2.0, -10),
      project(-standWidth / 2.0, standHeight / 2.0, -10),
    ];

    final basePaint = Paint()
      ..color = const Color(0xFF0F172A).withOpacity(0.85)
      ..style = PaintingStyle.fill;
    
    final baseBorderPaint = Paint()
      ..color = const Color(0xFF334155).withOpacity(0.4)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final pathBase = Path()
      ..moveTo(pBasePts[0].dx, pBasePts[0].dy);
    for (var pt in pBasePts) {
      pathBase.lineTo(pt.dx, pt.dy);
    }
    pathBase.close();
    canvas.drawPath(pathBase, basePaint);
    canvas.drawPath(pathBase, baseBorderPaint);

    // ── Step 2: Draw Pedestrian Central Aisle ──
    const aisleW = 28.0;
    final pAislePts = [
      project(-aisleW / 2.0, -standHeight / 2.0 + 10, -7),
      project(aisleW / 2.0, -standHeight / 2.0 + 10, -7),
      project(aisleW / 2.0, standHeight / 2.0 - 10, -7),
      project(-aisleW / 2.0, standHeight / 2.0 - 10, -7),
    ];

    final aislePaint = Paint()
      ..color = cpsColor.withOpacity(0.06 + 0.05 * glowIntensity)
      ..style = PaintingStyle.fill;

    final aisleBorderPaint = Paint()
      ..color = cpsColor.withOpacity(0.45 + 0.15 * glowIntensity)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final pathAisle = Path()
      ..moveTo(pAislePts[0].dx, pAislePts[0].dy);
    for (var pt in pAislePts) {
      pathAisle.lineTo(pt.dx, pt.dy);
    }
    pathAisle.close();
    canvas.drawPath(pathAisle, aislePaint);
    canvas.drawPath(pathAisle, aisleBorderPaint);

    // Pulse flow dots running down the central aisle corridor
    final numDots = 8;
    final dotPaint = Paint()..color = cpsColor;
    for (int i = 0; i < numDots; i++) {
      final prog = ((timeTick * 40 + i * (standHeight / numDots)) % standHeight) - standHeight / 2.0;
      final ptDot = project(0, prog, -6);
      canvas.drawCircle(ptDot, cps > 0.75 ? 2.5 : 1.5, dotPaint);
    }

    // ── Step 3: Draw Stadium Seats (Back to Front depth sorting) ──
    final List<_SeatItem> seats = [];
    rows.asMap().forEach((rIdx, row) {
      for (int col = 1; col <= cols; col++) {
        final cIdx = col - 1;
        // Split seating left/right of center aisle
        final aisleOffset = col <= 6 ? -16.0 : 16.0;
        final sx = (cIdx - cols / 2.0) * 22.0 + aisleOffset;
        final sy = (rIdx - rows.length / 2.0) * 22.0;
        final sz = rIdx * 4.5 - 10; // Tier stand slope elevation

        // Project coordinate to calculate final depth sorting
        // Rotate around Yaw Z
        final cosY = math.cos(camYaw);
        final sinY = math.sin(camYaw);
        final ry = sx * sinY + sy * cosY;

        // Rotate around Pitch X
        final sinP = math.sin(camPitch);
        final cosP = math.cos(camPitch);
        final finalZ = ry * sinP + sz * cosP;

        seats.add(_SeatItem(
          row: row,
          col: col,
          x: sx,
          y: sy,
          z: sz,
          depth: finalZ,
        ));
      }
    });

    // Sort back-to-front (highest depth drawn first)
    seats.sort((a, b) => b.depth.compareTo(a.depth));

    const sW = 10.0;
    const sH = 8.0;

    for (var seat in seats) {
      final isSelected = seat.row == selectedRow && seat.col == selectedCol;

      // Corners of 3D Seat box
      final pTL = project(seat.x - sW / 2.0, seat.y - sH / 2.0, seat.z);
      final pTR = project(seat.x + sW / 2.0, seat.y - sH / 2.0, seat.z);
      final pBR = project(seat.x + sW / 2.0, seat.y + sH / 2.0, seat.z);
      final pBL = project(seat.x - sW / 2.0, seat.y + sH / 2.0, seat.z);
      final pBack = project(seat.x, seat.y - sH / 2.0, seat.z + 8); // Backrest

      var seatFillColor = const Color(0xFF334155).withOpacity(0.5);
      var seatBorderColor = const Color(0xFF475569).withOpacity(0.7);
      var sWidth = 1.0;

      if (isSelected) {
        seatFillColor = const Color(0xFF00D4FF);
        seatBorderColor = Colors.white;
        sWidth = 2.0;
      } else if (seat.col == 6 || seat.col == 7) {
        // Border seats bordering red-alert aisles get a danger warning tint
        if (cps >= 0.75) {
          seatFillColor = Colors.red.withOpacity(0.18);
        }
      }

      final cushionPaint = Paint()
        ..color = seatFillColor
        ..style = PaintingStyle.fill;

      final borderPaint = Paint()
        ..color = seatBorderColor
        ..strokeWidth = sWidth
        ..style = PaintingStyle.stroke;

      // Draw bottom cushion face
      final pathCushion = Path()
        ..moveTo(pTL.dx, pTL.dy)
        ..lineTo(pTR.dx, pTR.dy)
        ..lineTo(pBR.dx, pBR.dy)
        ..lineTo(pBL.dx, pBL.dy)
        ..close();
      canvas.drawPath(pathCushion, cushionPaint);
      canvas.drawPath(pathCushion, borderPaint);

      // Draw backrest
      final pathBack = Path()
        ..moveTo(pTL.dx, pTL.dy)
        ..lineTo(pBack.dx, pBack.dy)
        ..lineTo(pTR.dx, pTR.dy);
      canvas.drawPath(pathBack, borderPaint);

      // Draw glowing float indicators over selected seat
      if (isSelected) {
        final floatZ = seat.z + 15 + math.sin(timeTick * math.pi * 2) * 2.5;
        final ptRing = project(seat.x, seat.y, floatZ);
        final ptAnchor = project(seat.x, seat.y, seat.z);

        // Anchor line
        final anchorPaint = Paint()
          ..color = const Color(0xFF00FF88).withOpacity(0.5)
          ..strokeWidth = 1
          ..style = PaintingStyle.stroke;
        
        canvas.drawLine(ptRing, ptAnchor, anchorPaint);

        // Ring
        final ringPaint = Paint()
          ..color = const Color(0xFF00FF88)
          ..strokeWidth = 1.5
          ..style = PaintingStyle.stroke;
        canvas.drawCircle(ptRing, 6.5, ringPaint);
      }
    }

    // ── Step 4: FlowMaster Reroute Neon Line ──
    if (showReroute && cps >= 0.6) {
      final routePaint = Paint()
        ..color = const Color(0xFF00D4FF)
        ..strokeWidth = 3.0
        ..strokeCap = StrokeCap.round
        ..style = PaintingStyle.stroke;

      final startY = standHeight / 2.0 - 15.0;
      final endY = -standHeight / 2.0 + 15.0;

      final List<Offset> routePts = [];
      for (double y = startY; y >= endY; y -= 12.0) {
        // Curve laterally to indicate lateral exit dispersal routing
        final dev = y < 0 ? math.sin((y / endY) * math.pi) * 36.0 : 0.0;
        routePts.add(project(dev, y, -2));
      }

      if (routePts.isNotEmpty) {
        final pathRoute = Path()..moveTo(routePts[0].dx, routePts[0].dy);
        for (var pt in routePts) {
          pathRoute.lineTo(pt.dx, pt.dy);
        }
        canvas.drawPath(pathRoute, routePaint);
      }
    }
  }

  @override
  bool shouldRepaint(_Stadium3DPainter old) {
    return old.selectedRow != selectedRow ||
        old.selectedCol != selectedCol ||
        old.camX != camX ||
        old.camY != camY ||
        old.camZoom != camZoom ||
        old.camPitch != camPitch ||
        old.camYaw != camYaw ||
        old.cps != cps ||
        old.showReroute != showReroute ||
        old.timeTick != timeTick ||
        old.glowIntensity != glowIntensity;
  }
}

// Seat metadata struct for depth sorting
class _SeatItem {
  final String row;
  final int col;
  final double x;
  final double y;
  final double z;
  final double depth;

  _SeatItem({
    required this.row,
    required this.col,
    required this.x,
    required this.y,
    required this.z,
    required this.depth,
  });
}
