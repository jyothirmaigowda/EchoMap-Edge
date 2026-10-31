# EchoMap Edge — Phase 1: Audio Feasibility Test Log

This document records physical hardware feasibility test runs for Phase 1 of EchoMap Edge.
All benchmark fields below are preserved for empirical real-device verification.

> **Research Protocol Note**:
> This phase verifies acoustic playback and microphone recording only.
> A recorded waveform is not proof of a detected wall or a valid distance measurement.
> Do not fill with fabricated readings or simulated results.

---

## 1. Test Device Specifications

* **Device Manufacturer & Model**: 
* **Android OS Version**: 
* **API Level**: 
* **Hardware Audio Chipset (if known)**: 
* **Physical Microphone Placement**: 
* **Physical Speaker Placement (Bottom / Earpiece)**: 

---

## 2. Audio Configuration Tested

* **Requested Sample Rate**: 48,000 Hz
* **Actual Negotiated Sample Rate**: 
* **Configured Audio Source**: `UNPROCESSED` (Fallback: `VOICE_RECOGNITION`, `MIC`)
* **Actual Audio Source Used**: 
* **Audio Format / Encoding**: PCM 16-bit Mono (`ENCODING_PCM_16BIT`)
* **Chirp Parameters**:
  * **Start Frequency**: 2,000 Hz
  * **End Frequency**: 8,000 Hz
  * **Chirp Duration**: 60 ms
  * **Modulation**: Linear Frequency Modulation (LFM)
  * **Taper Window**: Tukey (Cosine 10% rise / 10% fall)
  * **Nominal Gain**: 0.8 (2 dB digital headroom)
* **Pre-roll Delay**: 30 ms
* **Post-chirp Listening Window**: 210 ms
* **Total Recording Window**: 300 ms

---

## 3. Physical Test Runs

### Attempt 1
* **Environment (e.g., quiet bedroom, office, outdoor)**: 
* **Media Volume Level (e.g., 50%, 75%, 100%)**: 
* **Chirp Playback Audible**: [ ] Yes  [ ] No
* **Recording Completed Successfully**: [ ] Yes  [ ] No
* **Waveform Displayed on Screen**: [ ] Yes  [ ] No
* **Peak Amplitude (Normalized / Raw)**: 
* **RMS Amplitude**: 
* **Clipping or Distortion Observed**: [ ] None  [ ] Clipping Warning Displayed  [ ] Speaker Crackle
* **Observations**: 

### Attempt 2
* **Environment**: 
* **Media Volume Level**: 
* **Chirp Playback Audible**: [ ] Yes  [ ] No
* **Recording Completed Successfully**: [ ] Yes  [ ] No
* **Waveform Displayed on Screen**: [ ] Yes  [ ] No
* **Peak Amplitude (Normalized / Raw)**: 
* **RMS Amplitude**: 
* **Clipping or Distortion Observed**: [ ] None  [ ] Clipping Warning Displayed  [ ] Speaker Crackle
* **Observations**: 

### Attempt 3
* **Environment**: 
* **Media Volume Level**: 
* **Chirp Playback Audible**: [ ] Yes  [ ] No
* **Recording Completed Successfully**: [ ] Yes  [ ] No
* **Waveform Displayed on Screen**: [ ] Yes  [ ] No
* **Peak Amplitude (Normalized / Raw)**: 
* **RMS Amplitude**: 
* **Clipping or Distortion Observed**: [ ] None  [ ] Clipping Warning Displayed  [ ] Speaker Crackle
* **Observations**: 

---

## 4. Empirical Evaluation & Feasibility Assessment

* **Repeatability Across Runs**: 
* **Speaker-to-Mic Crosstalk Observed**: 
* **Direct Sound vs Ambient Noise Margin**: 
* **Hardware/OS Audio Latency Variance**: 
* **Observed Limitations & OEM Specifics**: 
* **Recommendation for Phase 2 (Cross-Correlation & Matched Filtering)**: 
