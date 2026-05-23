import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../screens/alert_screen.dart';
import 'glass_container.dart';

class AlertCardWidget extends StatelessWidget {
  final AlertData alert;
  final VoidCallback? onDiscountPressed;

  const AlertCardWidget({
    super.key,
    required this.alert,
    this.onDiscountPressed,
  });

  static const _textColor = Color(0xFFE2E8F0);
  static const _surface = Color(0xFF111827);

  Color get _typeColor {
    switch (alert.type) {
      case AlertType.critical:
        return const Color(0xFFFF4444);
      case AlertType.warning:
        return const Color(0xFFFFAA00);
      case AlertType.reroute:
        return const Color(0xFF00D4FF);
      case AlertType.info:
        return const Color(0xFF00FF88);
    }
  }

  String get _typeEmoji {
    switch (alert.type) {
      case AlertType.critical:
        return '🔴';
      case AlertType.warning:
        return '🟡';
      case AlertType.reroute:
        return '🔵';
      case AlertType.info:
        return '🟢';
    }
  }

  String get _typeIcon {
    switch (alert.type) {
      case AlertType.critical:
        return '⚠️';
      case AlertType.warning:
        return '⚡';
      case AlertType.reroute:
        return '🔄';
      case AlertType.info:
        return 'ℹ️';
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      borderRadius: 16,
      borderColor: _typeColor.withOpacity(alert.isNew ? 0.6 : 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 10),
          _buildMessage(),
          const SizedBox(height: 10),
          _buildSectorsAndTime(),
          if (alert.type == AlertType.reroute) ...[
            const SizedBox(height: 12),
            _buildDiscountButton(context),
          ],
        ],
      ),
    )
        .animate(target: alert.isNew ? 1 : 0)
        .shimmer(duration: 1000.ms, color: _typeColor.withOpacity(0.3));
  }

  Widget _buildHeader() {
    return Row(
      children: [
        // Type badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _typeColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _typeColor.withOpacity(0.35)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_typeEmoji, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 5),
              Text(
                alert.alertCategory,
                style: GoogleFonts.inter(
                  color: _typeColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
        const Spacer(),
        // Timestamp
        Text(
          _formatTime(alert.timestamp),
          style: GoogleFonts.inter(
            color: _textColor.withOpacity(0.4),
            fontSize: 12,
          ),
        ),
        if (alert.isNew) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: _typeColor,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'NEW',
              style: GoogleFonts.inter(
                color: _surface,
                fontSize: 9,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildMessage() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(_typeIcon, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            alert.message,
            style: GoogleFonts.inter(
              color: _textColor,
              fontSize: 14,
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectorsAndTime() {
    return Row(
      children: [
        const Icon(Icons.location_on_outlined, color: Color(0xFF00D4FF), size: 14),
        const SizedBox(width: 4),
        Text(
          'Sectors: ${alert.affectedSectors.join(', ')}',
          style: GoogleFonts.inter(
            color: const Color(0xFFE2E8F0).withOpacity(0.55),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildDiscountButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF00D4FF), Color(0xFF00FF88)],
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: ElevatedButton.icon(
          onPressed: onDiscountPressed,
          icon: const Icon(Icons.local_offer, size: 16),
          label: Text(
            '🎉 15% Discount at East Concessions',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: const Color(0xFF0A0F1E),
            shadowColor: Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
    )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .shimmer(duration: 2000.ms, color: Colors.white.withOpacity(0.3));
  }
}
