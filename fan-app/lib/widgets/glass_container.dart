import 'package:flutter/material.dart';
import 'dart:ui';

/// A reusable glassmorphism container widget.
///
/// Uses [BackdropFilter] with blur and a semi-transparent background
/// to achieve the frosted-glass effect used throughout StadiumOS UI.
class GlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;
  final double blurRadius;
  final double backgroundOpacity;
  final List<BoxShadow>? boxShadow;

  const GlassContainer({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius = 16,
    this.borderColor,
    this.backgroundColor,
    this.blurRadius = 12,
    this.backgroundOpacity = 0.65,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBg = backgroundColor ?? const Color(0xFF111827);
    final effectiveBorder = borderColor ?? const Color(0xFF00D4FF).withOpacity(0.15);

    return Container(
      margin: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurRadius, sigmaY: blurRadius),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: effectiveBg.withOpacity(backgroundOpacity),
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(
                color: effectiveBorder,
                width: 1,
              ),
              boxShadow: boxShadow ??
                  [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
