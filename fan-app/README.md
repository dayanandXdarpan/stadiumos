# StadiumOS Fan App 🏟️

> AI-Agent Powered Adaptive Stadium Intelligence — Fan Navigation & Alerts

A Flutter mobile app that provides real-time AR navigation, live crowd alerts, and push notifications powered by the StadiumOS AI backend.

---

## 📱 Screens

| Screen | Route | Description |
|---|---|---|
| Login | `/` | Ticket ID & email entry with particle animation |
| AR Navigation | `/ar` | Camera-based AR wayfinding with live AI routing |
| Alerts | `/alerts` | Live stadium alerts via WebSocket + FCM push |

---

## 🛠 Prerequisites

- **Flutter SDK** ≥ 3.0.0 — [Install Flutter](https://docs.flutter.dev/get-started/install)
- **Android Studio** or **VS Code** with Flutter extension
- **Firebase project** (for FCM push notifications)
- **StadiumOS backend** running locally or remotely

---

## 🚀 Setup & Run

### 1. Install Flutter

```bash
# Windows (via winget)
winget install Google.Flutter

# Or download from https://docs.flutter.dev/get-started/install/windows
```

Verify:
```bash
flutter --version
flutter doctor
```

---

### 2. Firebase Setup (for FCM)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or use an existing StadiumOS project
3. **Add Android app** with package name: `com.stadiumos.fan_app`
4. Download `google-services.json`
5. Place it at: `android/app/google-services.json`
   - (Replace the existing `google-services.json.example`)

---

### 3. Install Dependencies

```bash
cd fan-app
flutter pub get
```

---

### 4. Run the App

```bash
# With an Android emulator running:
flutter run

# Or specify a device:
flutter run -d <device-id>

# List available devices:
flutter devices
```

---

### 5. Create Flutter Project Structure (if needed)

If you cloned this repo without a full Flutter scaffold, run:

```bash
flutter create --org com.stadiumos fan_app_scaffold
# Then copy/merge the lib/, android/, pubspec.yaml into fan-app/
```

Or for a fresh scaffold in the fan-app directory:

```bash
flutter create --org com.stadiumos .
```

---

## 🔑 FCM Token

When the app starts, the **FCM token is printed to the debug console**:

```
══════════════════════════════════════
  FCM TOKEN (use for test push):
  fXx9...your-token-here...
══════════════════════════════════════
```

### Send a Test Push Notification

1. Copy the token from the console
2. Go to Firebase Console → **Cloud Messaging** → **Send test message**
3. Paste the token and send

Or use the Firebase REST API:
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_FCM_TOKEN",
    "notification": {
      "title": "🚨 CRITICAL Alert",
      "body": "Crowd surge detected at Gate A. Please reroute."
    },
    "data": {
      "alert_type": "CRITICAL",
      "sectors": ["A1","A2"]
    }
  }'
```

---

## 🌐 WebSocket Connection

The app connects to `ws://10.0.2.2:8000/ws` by default (Android emulator → host machine localhost).

### Backend WebSocket Message Format

**Reroute action:**
```json
{
  "type": "agent_action",
  "action": "REROUTE",
  "route": "Gate 7 — North (AI Optimized)",
  "sectors": ["B2", "C1"]
}
```

**Alert:**
```json
{
  "type": "alert",
  "alert_type": "SURGE",
  "message": "High crowd density at North Concourse.",
  "sectors": ["A1", "A2"]
}
```

### Change WebSocket URL

In `lib/services/websocket_service.dart`, update:
```dart
static const String _defaultUrl = 'ws://10.0.2.2:8000/ws';
```

Or call `WebSocketService().configure(url: 'ws://your-host:8000/ws');` before `connect()`.

---

## 🎨 Color Scheme

| Token | Hex | Usage |
|---|---|---|
| Background | `#0A0F1E` | App background |
| Surface | `#111827` | Cards, panels |
| Primary | `#00D4FF` | Electric blue, interactive |
| Success | `#00FF88` | Connected, OK states |
| Warning | `#FFAA00` | Surge, storm alerts |
| Danger | `#FF4444` | Critical alerts, reroute FAB |
| Text | `#E2E8F0` | Primary text |

---

## 📂 Project Structure

```
fan-app/
├── pubspec.yaml
├── README.md
├── android/
│   └── app/
│       └── google-services.json.example  ← replace with real file
├── assets/
│   └── images/
└── lib/
    ├── main.dart
    ├── screens/
    │   ├── login_screen.dart
    │   ├── ar_nav_screen.dart
    │   └── alert_screen.dart
    ├── services/
    │   ├── websocket_service.dart
    │   └── fcm_service.dart
    └── widgets/
        ├── alert_card.dart
        └── glass_container.dart
```

---

## ⚠️ Known Issues & Notes

- **Camera**: Requires a physical device or emulator with camera support. Falls back to a simulated AR grid if camera is unavailable.
- **FCM**: Requires `google-services.json` to be present. Firebase init errors are caught gracefully and the app still runs without FCM.
- **WebSocket**: Auto-reconnects with exponential backoff (up to 10 retries). Shows offline indicator if backend is not running.
- **Android permissions**: `camera` and `permission_handler` packages require `AndroidManifest.xml` permissions (added automatically by those packages in newer versions).

---

## 🔧 Android Manifest Additions

In `android/app/src/main/AndroidManifest.xml`, ensure these permissions are present:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

---

*Part of the StadiumOS — Build with AI: Agentic Premier League project.*
