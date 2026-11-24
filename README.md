# PhoneCam

Use your phone as a wireless camera for your computer. Perfect for IRL streaming, video calls, or remote monitoring.

## Features

- 📱 **Cross-platform**: iOS 15+, Android, Windows
- 🎥 **Low latency**: WebRTC for real-time streaming
- 🔊 **Audio support**: Microphone streaming with echo cancellation
- 🌐 **Works over VPN**: Binds to all interfaces (0.0.0.0)
- 🔧 **No discovery issues**: Direct IP connection, no mDNS/NDI problems
- 📦 **GitHub Actions**: Automated iOS builds (ad-hoc for sideloading)
- 🎯 **Simple setup**: One signaling server, direct P2P connection

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│   Phone     │◄──────────────────►│  Signaling       │
│  (Camera)   │   (Signaling)      │  Server          │
└──────┬──────┘                    └────────┬─────────┘
       │                                    │
       │           WebRTC (P2P)             │
       │◄───────────────────────────────────┤
       │                                    │
┌──────▼──────┐                    ┌────────▼─────────┐
│             │                    │                  │
│  Desktop    │                    │   Other Viewers  │
│  (Receiver) │                    │   (Optional)     │
└─────────────┘                    └──────────────────┘
```

## Quick Start

### 1. Start the Signaling Server

```bash
# Install dependencies
npm install

# Build and start signaling server
cd packages/signaling-server
npm run build
npm start
# Server runs on ws://0.0.0.0:8080
```

The signaling server binds to `0.0.0.0:8080` - accessible from all network interfaces (WiFi, Ethernet, VPN).

### 2. Run the Phone App (Development)

```bash
cd apps/phone
npm install
npm run start
# Scan QR code with Expo Go, or run on emulator/simulator
```

### 3. Run the Desktop App (Development)

```bash
cd apps/desktop
npm install
npm run dev
```

### 4. Connect

1. Enter the same **Room ID** on both phone and desktop
2. On phone: tap **GO LIVE**
3. On desktop: tap **START STREAM**
4. Video appears on desktop

## Network Setup

### Local Network (Same WiFi)
- Phone and PC on same network
- Signaling server runs on PC
- Phone connects to PC's local IP (e.g., `ws://192.168.1.50:8080`)

### Over VPN (Tailscale, WireGuard, etc.)
- Signaling server binds to `0.0.0.0` - works on VPN interface automatically
- Phone connects to VPN IP of PC
- No port forwarding needed

### Internet (Remote Access)
- Deploy signaling server to a VPS
- Update `signalingHost` in both apps to `wss://your-server.com`
- Use TURN servers for NAT traversal (configure in code)

## Building

### iOS (GitHub Actions - Ad-hoc for Sideloading)

1. Add secrets to GitHub repository:
   - `EXPO_TOKEN` - from `eas login --token`
   - `EAS_PROJECT_ID` - from `eas init`
   - `APPLE_TEAM_ID` - from Apple Developer portal
   - `IOS_DISTRIBUTION_CERT` - base64 encoded .p12
   - `IOS_DISTRIBUTION_CERT_PASSWORD` - p12 password
   - `IOS_PROVISIONING_PROFILE` - base64 encoded .mobileprovision (ad-hoc)

2. Trigger workflow manually or push tag:
   ```bash
   git tag v1.0.0 && git push origin v1.0.0
   ```

3. Download `.ipa` from GitHub Actions artifacts or Releases
4. Install via AltStore, Sideloadly, or direct IPA install

### Android

```bash
cd apps/phone
eas build --platform android --profile preview
# Download APK from Expo dashboard
```

### Windows

```bash
cd apps/desktop
npm run dist
# Creates installer in dist-electron/
```

## Configuration

### Phone App Settings

| Setting | Description |
|---------|-------------|
| Room ID | Unique session identifier |
| Signaling Server | WebSocket URL (optional, defaults to localhost) |
| Video Quality | 720p / 1080p / 4K |
| Default Camera | Front / Back |
| Video/Audio Enabled | Default toggle states |

### Desktop App Settings

| Setting | Description |
|---------|-------------|
| Room ID | Must match phone |
| Signaling Server | WebSocket URL |

## Project Structure

```
phone-cam/
├── apps/
│   ├── phone/              # React Native + Expo (iOS/Android)
│   │   ├── app/            # Expo Router pages
│   │   ├── src/
│   │   │   ├── webrtc/     # WebRTC logic + signaling
│   │   │   ├── components/ # UI components
│   │   │   └── store/      # Zustand state
│   │   ├── eas.json        # EAS Build config
│   │   └── ...
│   └── desktop/            # Electron + React (Windows)
│       ├── src/
│       │   ├── main/       # Electron main process
│       │   │   └── webrtc-receiver.ts
│       │   └── renderer/   # React UI
│       └── ...
├── packages/
│   └── signaling-server/   # Node.js WebSocket server
│       └── src/index.ts
├── .github/workflows/
│   └── ios-build.yml       # GitHub Actions for iOS
└── package.json            # Workspace root
```

## Troubleshooting

### "Discovery doesn't work" (NDI/Prism/iVCam)
This app doesn't use discovery. It uses a signaling server + direct WebRTC. Just ensure:
- Signaling server is running and accessible
- Same Room ID on both devices
- Firewall allows port 8080 (or your custom port)

### VPN Issues
The signaling server binds to `0.0.0.0:8080` - it listens on ALL interfaces including VPN adapters (Tailscale, WireGuard, OpenVPN, etc.). No special config needed.

### WebRTC Connection Fails
1. Check STUN servers are reachable (Google STUN used by default)
2. For symmetric NAT, add TURN servers in `webrtc.ts` and `webrtc-receiver.ts`
3. Check browser console / React Native logs for ICE candidate errors

### iOS Build Fails
- Ensure Apple Developer account has valid certificates
- Ad-hoc provisioning profile must include device UDIDs
- Check `eas.json` profile matches your certificate type

## License

MIT