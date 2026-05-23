import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_fonts/google_fonts.dart';

import 'screens/login_screen.dart';
import 'screens/ar_nav_screen.dart';
import 'screens/alert_screen.dart';
import 'screens/seat_view_screen.dart';
import 'screens/staff_home_screen.dart';
import 'services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    await FCMService().initialize();
  } catch (e) {
    debugPrint('Firebase init error (expected if no google-services.json): $e');
  }
  runApp(const StadiumOSFanApp());
}

class StadiumOSFanApp extends StatelessWidget {
  const StadiumOSFanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StadiumOS Fan',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/ar': (context) => const ARNavScreen(),
        '/alerts': (context) => const AlertScreen(),
        '/seat-view': (context) => const SeatViewScreen(),
        '/staff-home': (context) => const StaffHomeScreen(),
      },
    );
  }

  ThemeData _buildTheme() {
    const background = Color(0xFF0A0F1E);
    const surface = Color(0xFF111827);
    const primary = Color(0xFF00D4FF);
    const onPrimary = Color(0xFF0A0F1E);
    const textColor = Color(0xFFE2E8F0);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.dark(
        background: background,
        surface: surface,
        primary: primary,
        onPrimary: onPrimary,
        onBackground: textColor,
        onSurface: textColor,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme.copyWith(
              bodyMedium: const TextStyle(color: textColor),
              bodyLarge: const TextStyle(color: textColor),
              titleMedium: const TextStyle(color: textColor),
              titleLarge: const TextStyle(color: textColor),
            ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textColor,
        elevation: 0,
        titleTextStyle: GoogleFonts.inter(
          color: textColor,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: const CardTheme(
        color: surface,
        elevation: 0,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surface,
        contentTextStyle: GoogleFonts.inter(color: textColor),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: onPrimary,
      ),
    );
  }
}
