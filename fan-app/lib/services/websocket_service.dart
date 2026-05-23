import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  static const String _defaultUrl = 'ws://10.0.2.2:8000/ws';
  String _url = _defaultUrl;

  WebSocketChannel? _channel;
  StreamController<Map<String, dynamic>>? _controller;
  bool _connected = false;
  bool _reconnecting = false;
  int _retryCount = 0;
  static const int _maxRetries = 10;
  Timer? _reconnectTimer;

  /// Configure the WebSocket URL (optional, defaults to Android emulator localhost).
  void configure({String? url}) {
    if (url != null) _url = url;
  }

  /// Connect to the WebSocket server.
  void connect() {
    if (_connected || _reconnecting) return;
    _ensureController();
    _doConnect();
  }

  void _ensureController() {
    if (_controller == null || _controller!.isClosed) {
      _controller = StreamController<Map<String, dynamic>>.broadcast();
    }
  }

  void _doConnect() {
    try {
      debugPrint('[WS] Connecting to $_url ...');
      _channel = WebSocketChannel.connect(Uri.parse(_url));
      _channel!.stream.listen(
        (raw) {
          _connected = true;
          _retryCount = 0;
          try {
            final parsed = json.decode(raw.toString()) as Map<String, dynamic>;
            _controller?.add(parsed);
            debugPrint('[WS] Message: $parsed');
          } catch (e) {
            debugPrint('[WS] Parse error: $e | raw: $raw');
          }
        },
        onError: (err) {
          debugPrint('[WS] Error: $err');
          _connected = false;
          _scheduleReconnect();
        },
        onDone: () {
          debugPrint('[WS] Connection closed.');
          _connected = false;
          _scheduleReconnect();
        },
      );
    } catch (e) {
      debugPrint('[WS] Failed to connect: $e');
      _connected = false;
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    if (_retryCount >= _maxRetries) {
      debugPrint('[WS] Max retries reached. Giving up.');
      return;
    }
    _reconnecting = true;
    _retryCount++;
    final delay = Duration(seconds: _retryCount * 2);
    debugPrint('[WS] Reconnecting in ${delay.inSeconds}s (attempt $_retryCount)...');
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      _reconnecting = false;
      _doConnect();
    });
  }

  /// Returns a broadcast stream of parsed JSON messages.
  Stream<Map<String, dynamic>> getStream() {
    _ensureController();
    return _controller!.stream;
  }

  /// Send a message to the server.
  void send(Map<String, dynamic> data) {
    if (_channel != null && _connected) {
      _channel!.sink.add(json.encode(data));
    }
  }

  /// Disconnect and clean up.
  void disconnect() {
    _reconnectTimer?.cancel();
    _reconnecting = false;
    _connected = false;
    _retryCount = _maxRetries; // prevent reconnect
    _channel?.sink.close();
    _controller?.close();
    _channel = null;
    _controller = null;
  }

  bool get isConnected => _connected;
}
