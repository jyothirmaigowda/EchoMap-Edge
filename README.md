# EchoMap Edge

EchoMap Edge is an accessibility, emergency assistance, and offline-first disaster preparedness application.

## Web Application

### Run Locally

Prerequisites: Node.js

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` if Gemini features are used.
3. Start the app: `npm run dev`
4. Open `http://localhost:3000`

### Verify

- Build: `npm run build`
- Type-check: `npm run lint`

## Android Research Prototype

The repository also contains the EchoMap Edge Android audio feasibility prototype.

### Phase 1 Scope

- Linear FM chirp generation
- Low-latency speaker playback
- Microphone recording
- Synchronized emit-and-record scanning
- Waveform and signal statistics
- Strict offline operation

### Build Android App

Prerequisites: Android Studio, JDK 17, and Android SDK API 34.

```bash
./gradlew assembleDebug
./gradlew test
```

Install the debug APK on a connected device:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
