# EchoMap Edge — Phase 1: Audio Feasibility Prototype

EchoMap Edge is an offline-first Android research project exploring whether acoustic reflections captured using standard smartphone speakers and microphones can support indoor ranging and experimental spatial mapping.

This codebase contains **Phase 1: Audio Feasibility Prototype**.

---

## Phase 1 Objectives & Scope

### Verified Capabilities
* [x] **Linear FM Chirp Generation (`ChirpGenerator.kt`)**: Mathematical synthesis of 2–8 kHz linear frequency-modulated chirps (PCM 16-bit mono) with a tapered cosine (Tukey) window to eliminate transient speaker clicks.
* [x] **Low-Latency Audio Playback (`AudioPlayer.kt`)**: Non-blocking `AudioTrack` playback using static memory buffers with explicit frame completion tracking.
* [x] **Microphone Recording (`AudioRecorder.kt`)**: Bounded PCM 16-bit capture using `AudioRecord`, preferring `MediaRecorder.AudioSource.UNPROCESSED` to disable OEM echo cancellation/AGC, with automatic fallback handling.
* [x] **Synchronized Scan Controller (`AudioScanController.kt`)**: Starts recording before emitting the acoustic chirp to reliably capture direct-path sound and immediate multipath reflections.
* [x] **Waveform & Signal Statistics (`AudioScanViewModel.kt` + `LiveScanScreen.kt`)**: StateFlow-backed UI with a custom Canvas drawing the captured waveform, peak amplitude, RMS amplitude, and clipping detection.
* [x] **Strict Offline Operation**: Only `android.permission.RECORD_AUDIO` is requested. No network permissions, no telemetry, no analytics.

### Explicitly Out of Scope for Phase 1
* Cross-correlation and matched filtering
* Echo peak detection and time-of-flight (ToF) estimation
* Distance calculation and wall detection
* 2D/3D mapping and AI models

---

## Architecture Overview

```
app/src/main/java/com/echomap/edge/
├── MainActivity.kt                      # Main Compose entrypoint
├── audio/
│   ├── ChirpGenerator.kt                # 2–8 kHz LFM chirp synthesis + Tukey window
│   ├── AudioPlayer.kt                   # Non-blocking AudioTrack playback
│   ├── AudioRecorder.kt                 # UNPROCESSED AudioRecord capture
│   └── AudioScanController.kt           # Coordinated emit-record pipeline
├── viewmodel/
│   └── AudioScanViewModel.kt            # StateFlow state machine & lifecycle safety
└── ui/
    ├── LiveScanScreen.kt                # Jetpack Compose UI + Waveform Canvas
    └── theme/
        ├── Color.kt
        ├── Theme.kt
        └── Type.kt
```

---

## Building and Running

### Prerequisites
* Android Studio Iguana / Jellyfish or newer (or Gradle with JDK 17)
* Android SDK with platform API 34 installed
* A physical Android device running Android 8.0 (API 26) or newer (Microphone hardware is required for acoustic verification)

### Build Commands
```bash
# Build the debug APK
./gradlew assembleDebug

# Run unit tests
./gradlew test
```

### Deploy to Connected Device
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Research Protocol
For empirical testing on physical hardware, see [`research/phase1_results.md`](research/phase1_results.md).
