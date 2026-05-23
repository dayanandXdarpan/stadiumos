import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Handles FCM in background (top-level function required by firebase_messaging).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[FCM Background] Message: ${message.notification?.title}');
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  FirebaseMessaging? _messaging;

  /// Initialize FCM: request permissions, print token, set up handlers.
  Future<void> initialize() async {
    try {
      _messaging = FirebaseMessaging.instance;

      // Register background handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request notification permissions (iOS/Android 13+)
      final settings = await _messaging!.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      debugPrint('[FCM] Permission: ${settings.authorizationStatus}');

      // Fetch & print FCM token
      final token = await _messaging!.getToken();
      debugPrint('══════════════════════════════════════');
      debugPrint('  FCM TOKEN (use for test push):');
      debugPrint('  $token');
      debugPrint('══════════════════════════════════════');

      // Token refresh
      _messaging!.onTokenRefresh.listen((newToken) {
        debugPrint('[FCM] Token refreshed: $newToken');
      });

      setupMessageHandlers();
    } catch (e) {
      debugPrint('[FCM] Initialization error: $e');
    }
  }

  /// Set up foreground, background opened, and terminated-state opened handlers.
  void setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM Foreground] ${message.notification?.title}: ${message.notification?.body}');
      _onForegroundMessage(message);
    });

    // App opened from background via notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM Opened] ${message.notification?.title}');
      _handleMessageNavigation(message);
    });

    // App launched from terminated state via notification
    _messaging?.getInitialMessage().then((message) {
      if (message != null) {
        debugPrint('[FCM Terminated] ${message.notification?.title}');
        _handleMessageNavigation(message);
      }
    });
  }

  void _onForegroundMessage(RemoteMessage message) {
    // The overlay will be shown via the navigator key in a real app.
    // Here we use a global key approach or notify listeners.
    FCMNotificationOverlay.show(
      title: message.notification?.title ?? 'StadiumOS Alert',
      body: message.notification?.body ?? '',
      data: message.data,
    );
  }

  void _handleMessageNavigation(RemoteMessage message) {
    // In a real app, use a global navigator key to push routes.
    // e.g., navigatorKey.currentState?.pushNamed('/alerts');
    debugPrint('[FCM] Navigate for: ${message.data}');
  }
}

/// Static helper to show in-app FCM overlay notifications.
/// In production, hook this into a global overlay entry via a navigator key.
class FCMNotificationOverlay {
  static OverlayState? _overlayState;
  static OverlayEntry? _entry;

  static void registerOverlay(OverlayState state) {
    _overlayState = state;
  }

  static void show({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) {
    if (_overlayState == null) return;

    _entry?.remove();
    _entry = OverlayEntry(
      builder: (context) => _FCMOverlayWidget(
        title: title,
        body: body,
        onDismiss: () {
          _entry?.remove();
          _entry = null;
        },
      ),
    );
    _overlayState!.insert(_entry!);

    // Auto-dismiss after 5 seconds
    Future.delayed(const Duration(seconds: 5), () {
      _entry?.remove();
      _entry = null;
    });
  }
}

class _FCMOverlayWidget extends StatefulWidget {
  final String title;
  final String body;
  final VoidCallback onDismiss;

  const _FCMOverlayWidget({
    required this.title,
    required this.body,
    required this.onDismiss,
  });

  @override
  State<_FCMOverlayWidget> createState() => _FCMOverlayWidgetState();
}

class _FCMOverlayWidgetState extends State<_FCMOverlayWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _slideAnim = Tween<double>(begin: -1, end: 0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.elasticOut),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 8,
      left: 16,
      right: 16,
      child: AnimatedBuilder(
        animation: _slideAnim,
        builder: (context, child) => Transform.translate(
          offset: Offset(0, _slideAnim.value * 150),
          child: child,
        ),
        child: Material(
          color: Colors.transparent,
          child: GestureDetector(
            onTap: widget.onDismiss,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF00D4FF).withOpacity(0.4)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF00D4FF).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.notifications_active,
                      color: Color(0xFF00D4FF),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                            color: Color(0xFFE2E8F0),
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (widget.body.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(
                            widget.body,
                            style: TextStyle(
                              color: const Color(0xFFE2E8F0).withOpacity(0.65),
                              fontSize: 13,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.close, color: const Color(0xFFE2E8F0).withOpacity(0.4), size: 18),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
