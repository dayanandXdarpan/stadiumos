import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'dart:math' as math;

import '../services/websocket_service.dart';
import '../widgets/alert_card.dart';
import '../widgets/glass_container.dart';

class AlertScreen extends StatefulWidget {
  const AlertScreen({super.key});

  @override
  State<AlertScreen> createState() => _AlertScreenState();
}

class _AlertScreenState extends State<AlertScreen>
    with TickerProviderStateMixin {
  final List<AlertData> _alerts = [
    AlertData(
      type: AlertType.warning,
      alertCategory: 'SURGE',
      message: 'High crowd density detected at North Concourse.',
      affectedSectors: ['A1', 'A2', 'B1'],
      timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
    ),
    AlertData(
      type: AlertType.info,
      alertCategory: 'INFO',
      message: 'Halftime entertainment starts in Gate 4 area.',
      affectedSectors: ['B2', 'C1'],
      timestamp: DateTime.now().subtract(const Duration(minutes: 10)),
    ),
    AlertData(
      type: AlertType.reroute,
      alertCategory: 'REROUTE',
      message: 'AI optimized route: use East Concessions corridor. 15% discount active!',
      affectedSectors: ['B2', 'D3'],
      timestamp: DateTime.now().subtract(const Duration(minutes: 18)),
    ),
  ];

  StreamSubscription? _wsSub;
  bool _wsConnected = false;
  late AnimationController _headerPulse;

  static const _primary = Color(0xFF00D4FF);
  static const _success = Color(0xFF00FF88);
  static const _danger = Color(0xFFFF4444);
  static const _surface = Color(0xFF111827);
  static const _textColor = Color(0xFFE2E8F0);

  @override
  void initState() {
    super.initState();
    _headerPulse = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _connectWebSocket();
  }

  void _connectWebSocket() {
    final ws = WebSocketService();
    ws.connect();
    _wsSub = ws.getStream().listen(
      (data) {
        if (!mounted) return;
        setState(() => _wsConnected = true);
        _handleIncomingAlert(data);
      },
      onError: (_) => setState(() => _wsConnected = false),
      onDone: () => setState(() => _wsConnected = false),
    );
  }

  void _handleIncomingAlert(Map<String, dynamic> data) {
    AlertType type = AlertType.info;
    String category = (data['alert_type'] ?? data['type'] ?? 'INFO').toString().toUpperCase();

    if (category == 'CRITICAL') type = AlertType.critical;
    else if (category == 'REROUTE') type = AlertType.reroute;
    else if (category == 'WARNING' || category == 'STORM' || category == 'SURGE') type = AlertType.warning;

    final alert = AlertData(
      type: type,
      alertCategory: category,
      message: data['message']?.toString() ?? 'New stadium alert received.',
      affectedSectors: List<String>.from(data['sectors'] ?? ['All Sectors']),
      timestamp: DateTime.now(),
      isNew: true,
    );

    setState(() => _alerts.insert(0, alert));

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _alerts[0] = _alerts[0].copyWith(isNew: false));
      }
    });
  }

  @override
  void dispose() {
    _headerPulse.dispose();
    _wsSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0A0F1E), Color(0xFF0D1B35)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(context),
              Expanded(
                child: _alerts.isEmpty
                    ? _buildEmptyState()
                    : _buildAlertList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      decoration: BoxDecoration(
        color: _surface.withOpacity(0.6),
        border: Border(
          bottom: BorderSide(color: _primary.withOpacity(0.15)),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new, color: _primary, size: 18),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShaderMask(
                  shaderCallback: (b) => const LinearGradient(
                    colors: [Color(0xFF00D4FF), Color(0xFFFF4444)],
                  ).createShader(b),
                  child: Text(
                    'Live Stadium Alerts',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  '${_alerts.length} active alert${_alerts.length != 1 ? 's' : ''}',
                  style: GoogleFonts.inter(
                    color: _textColor.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          _buildConnectionDot(),
        ],
      ),
    );
  }

  Widget _buildConnectionDot() {
    return AnimatedBuilder(
      animation: _headerPulse,
      builder: (context, _) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _wsConnected ? _success : _danger,
              boxShadow: [
                BoxShadow(
                  color: (_wsConnected ? _success : _danger)
                      .withOpacity(0.4 + 0.4 * _headerPulse.value),
                  blurRadius: 8,
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(
            _wsConnected ? 'LIVE' : 'OFFLINE',
            style: GoogleFonts.inter(
              color: _wsConnected ? _success : _danger,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _alerts.length,
      itemBuilder: (context, index) {
        final alert = _alerts[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AlertCardWidget(
            alert: alert,
            onDiscountPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Text('🎉 '),
                      Text(
                        '15% discount applied at East Concessions!',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  backgroundColor: _surface,
                  duration: const Duration(seconds: 3),
                ),
              );
            },
          ),
        )
            .animate(key: ValueKey(alert.timestamp.millisecondsSinceEpoch))
            .fadeIn(duration: 500.ms)
            .slideY(begin: -0.3, curve: Curves.easeOut);
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('✅', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          Text(
            'No active alerts. All clear!',
            style: GoogleFonts.inter(
              color: _success,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your stadium experience is smooth sailing.',
            style: GoogleFonts.inter(
              color: _textColor.withOpacity(0.5),
              fontSize: 14,
            ),
          ),
        ],
      ).animate().fadeIn(duration: 600.ms).scale(),
    );
  }
}

enum AlertType { critical, warning, info, reroute }

class AlertData {
  final AlertType type;
  final String alertCategory;
  final String message;
  final List<String> affectedSectors;
  final DateTime timestamp;
  final bool isNew;

  const AlertData({
    required this.type,
    required this.alertCategory,
    required this.message,
    required this.affectedSectors,
    required this.timestamp,
    this.isNew = false,
  });

  AlertData copyWith({bool? isNew}) => AlertData(
        type: type,
        alertCategory: alertCategory,
        message: message,
        affectedSectors: affectedSectors,
        timestamp: timestamp,
        isNew: isNew ?? this.isNew,
      );
}
