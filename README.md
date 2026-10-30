<div align="center">

# 🔊 EchoMap Edge

### Listen to the Space. Question the Echo. Map What You Know.

**An Offline Acoustic Sensing & Uncertainty-Aware Indoor Mapping Research Project**

Exploring how ordinary speakers, microphones, and motion sensors can help estimate distances and reconstruct indoor spaces—without depending on cloud processing.

<br>

![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge\&logo=android\&logoColor=white)
![Language](https://img.shields.io/badge/Kotlin-First-7F52FF?style=for-the-badge\&logo=kotlin\&logoColor=white)
![DSP](https://img.shields.io/badge/Signal_Processing-C%2B%2B-00599C?style=for-the-badge\&logo=cplusplus\&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Offline--First-0A9396?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Research_Prototype-informational?style=for-the-badge)

<br>

**No cloud dependency. No blindly accepted measurements. No fabricated walls.**

*Every measurement should provide evidence. Every uncertainty should remain visible.*

</div>

---

## 📖 Table of Contents

* [1. Overview](#-1-overview)
* [2. The Problem](#-2-the-problem)
* [3. Our Approach](#-3-our-approach)
* [4. What Makes EchoMap Edge Different?](#-4-what-makes-echomap-edge-different)
* [5. Core Features](#-5-core-features)
* [6. System Architecture](#-6-system-architecture)
* [7. Technology Stack](#-7-technology-stack)
* [8. How the System Works](#-8-how-the-system-works)
* [9. Reliability and Failure Diagnosis](#-9-reliability-and-failure-diagnosis)
* [10. Adaptive Rescanning](#-10-adaptive-rescanning)
* [11. Uncertainty-Aware Mapping](#-11-uncertainty-aware-mapping)
* [12. Calibration and Distance Estimation](#-12-calibration-and-distance-estimation)
* [13. Offline-First Design and Privacy](#-13-offline-first-design-and-privacy)
* [14. Project Structure](#-14-project-structure)
* [15. Development Roadmap](#-15-development-roadmap)
* [16. Experimental Validation](#-16-experimental-validation)
* [17. Evaluation Metrics](#-17-evaluation-metrics)
* [18. Getting Started](#-18-getting-started)
* [19. Hardware and Environmental Considerations](#-19-hardware-and-environmental-considerations)
* [20. Current Limitations](#-20-current-limitations)
* [21. Research Direction](#-21-research-direction)
* [22. Contributing](#-22-contributing)
* [23. License](#-23-license)
* [24. Acknowledgements](#-24-acknowledgements)

---

## 🌐 1. Overview

**EchoMap Edge** is an offline-first acoustic sensing and indoor mapping research project that investigates how sound reflections can provide information about nearby indoor surfaces.

The system is designed around a simple idea:

> A useful sensing system should not only collect measurements. It should also evaluate their reliability, explain failures, and determine what evidence to collect next.

The proposed application uses an Android device's speaker and microphone to emit acoustic signals, capture the resulting audio, and identify potential echoes. Signal-processing algorithms analyze those echoes to generate candidate distance measurements.

A deterministic reliability engine then evaluates the available evidence. If a scan is weak, inconsistent, or ambiguous, the system can recommend a targeted follow-up scan rather than simply repeating the same action.

Accepted measurements can eventually contribute to a two-dimensional spatial representation that explicitly distinguishes supported surfaces, free-space evidence, uncertainty, and conflicting observations.

The entire sensing and analysis pipeline is intended to operate locally on the device.

### The central research question

**Can diagnosis-guided acoustic rescanning improve the reliability of indoor measurements compared with blindly repeating a scan?**

EchoMap Edge aims to investigate this question through controlled experiments, measurable outcomes, and transparent reporting.

### Project principles

* **Offline first:** Core sensing and analysis should not require a cloud service.
* **Evidence before conclusions:** A detected signal peak is a candidate, not automatically a valid measurement.
* **Explainable decisions:** Rejected measurements should have identifiable reasons.
* **Adaptive sensing:** The next scan should respond to the previous scan's results.
* **Uncertainty preservation:** Unknown areas must remain unknown until sufficient evidence exists.
* **Reproducible evaluation:** Performance claims must be supported by recorded experiments.
* **Privacy by design:** Audio and experimental records should remain local unless the user explicitly exports them.

---

## 🎯 2. The Problem

Indoor spaces can be difficult to measure and reconstruct using ordinary consumer devices.

GPS is generally unsuitable for detailed indoor geometry. Dedicated LiDAR equipment can be unavailable or too expensive for some users. Camera-based approaches may also be unsuitable in environments where visual data collection is undesirable.

Acoustic sensing offers another possibility: transmitting a known sound and analyzing its reflections.

However, practical acoustic measurements face several challenges.

| Challenge                          | Why it matters                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Speaker and microphone limitations | Consumer hardware may distort, attenuate, or fail to capture the transmitted signal consistently. |
| System latency                     | Audio playback and capture introduce delays that can bias distance estimates.                     |
| Multipath reflections              | Sound may reach the microphone through several possible reflection paths.                         |
| Environmental noise                | Fans, conversations, music, and other sounds can obscure useful signals.                          |
| Reflective surface variation       | Different materials and surface orientations produce different responses.                         |
| Device movement                    | Position and orientation changes affect the interpretation of successive measurements.            |
| Measurement ambiguity              | Multiple detected peaks may correspond to different physical paths.                               |
| Mapping uncertainty                | A distance estimate alone does not establish a complete wall or room boundary.                    |

A system that ignores these problems may generate plausible-looking measurements or maps without sufficient evidence.

EchoMap Edge investigates a more cautious alternative: **evaluate the evidence, diagnose the problem, and collect better measurements where possible.**

---

## 💡 3. Our Approach

EchoMap Edge combines acoustic signal processing with reliability assessment, adaptive measurement planning, and uncertainty-aware mapping.

The proposed workflow is:

1. Generate a known acoustic signal.
2. Play the signal through the device's speaker.
3. Capture the microphone response.
4. Calibrate and account for system latency.
5. Process the recorded signal to identify candidate reflections.
6. Extract signal-quality and repeatability features.
7. Assess measurement reliability.
8. Diagnose weak, inconsistent, or ambiguous results.
9. Recommend an appropriate follow-up scan.
10. Incorporate accepted evidence into the spatial representation.
11. Preserve conflicting and unresolved measurements.
12. Save the scan metadata and decisions locally.

The system begins with deterministic signal processing and explicit rules rather than relying on an unvalidated machine-learning model to make its core decisions.

### The proposed feedback loop

```text
                 ┌─────────────────────┐
                 │   Initiate a Scan   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Emit Known Sound  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Capture Audio       │
                 │ and Extract Echoes  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Assess Reliability  │
                 └──────────┬──────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
           ┌──────────────┐  ┌─────────────────┐
           │ Evidence     │  │ Weak, Conflicting│
           │ Accepted     │  │ or Ambiguous     │
           └──────┬───────┘  └────────┬────────┘
                  │                   │
                  ▼                   ▼
           ┌──────────────┐  ┌─────────────────┐
           │ Update Map   │  │ Diagnose Failure│
           └──────┬───────┘  └────────┬────────┘
                  │                   │
                  │                   ▼
                  │          ┌─────────────────┐
                  │          │ Recommend Next  │
                  │          │ Measurement     │
                  │          └────────┬────────┘
                  │                   │
                  │                   └───────┐
                  │                           │
                  ▼                           ▼
           ┌─────────────────────────────────────┐
           │ Save Evidence, Decisions and Results│
           └─────────────────────────────────────┘
```

This closed-loop design is the central engineering direction of the project.

---

## 🚀 4. What Makes EchoMap Edge Different?

Acoustic indoor localization and mapping have already been explored in existing research. EchoMap Edge does not claim to have invented smartphone echolocation, acoustic ranging, or indoor mapping.

Instead, the project investigates a more specific research direction:

**Diagnosis-guided adaptive rescanning with explicit uncertainty preservation.**

The proposed contribution is a system that treats a failed measurement as information that can guide the next sensing action.

For example, when several plausible echo candidates disagree, the system could recommend changing the device's position to obtain a different observation. When the signal remains unreliable after a limited number of attempts, the system should preserve the area as unresolved rather than inventing a surface.

The research will compare this approach with a baseline that simply repeats scans without using a diagnosis-driven policy.

| Conventional approach                                                        | EchoMap Edge research direction                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Repeat a scan without analyzing why it failed                                | Diagnose the failure before selecting another action              |
| Treat a detected peak as a potential answer without sufficient qualification | Evaluate signal quality, repeatability, and competing candidates  |
| Produce a spatial representation from available estimates                    | Preserve unknown and conflicting regions explicitly               |
| Hide the reasoning behind a result                                           | Record the evidence and reason for each decision                  |
| Evaluate only the final output                                               | Evaluate measurement quality, scan effort, and unresolved regions |

These differences describe the intended design. Their effectiveness and novelty must be established through implementation, literature review, and controlled evaluation.

---

## ✨ 5. Core Features

The following capabilities describe the planned system. Their implementation status must be verified against the actual source code.

### 🔊 5.1 Active Acoustic Sensing

Generate a known acoustic signal and capture the resulting microphone response.

Planned capabilities:

* Linear frequency-modulated chirp generation.
* Controlled audio playback and capture.
* Repeated measurements for consistency analysis.
* Timestamped scan records.
* Device-specific audio configuration profiles.

### 📡 5.2 Echo Candidate Extraction

Process captured audio to identify potential reflections.

Planned signal-processing techniques:

* Digital filtering.
* Fast Fourier Transform (FFT).
* Matched filtering and cross-correlation.
* Correlation peak detection.
* Candidate clustering.
* Signal-to-noise ratio estimation.
* Peak prominence and temporal stability analysis.

The DSP layer reports candidate evidence. It does not independently establish that a detected peak represents a genuine physical surface.

### 🧠 5.3 Reliability and Failure Diagnosis

Assess measurements using explicit, testable rules.

Potential outcomes include:

* Accepted measurement.
* Weak signal.
* Inconsistent measurement.
* Ambiguous echo candidates.
* Cluttered acoustic response.
* Direct-path-dominated response.
* Conflict with existing map evidence.
* Unresolved measurement.

Each rejection should include an explanation based on the evidence available to the system.

### 🔁 5.4 Adaptive Rescanning

Recommend a targeted follow-up action based on the previous scan's diagnosis.

Examples include:

* Repeat the measurement.
* Reorient the device.
* Move closer to a potential target.
* Move laterally to obtain a different observation.
* Change the scan angle.
* Verify an existing measurement from another position.
* Stop after repeated failures and preserve the result as unresolved.

### 🗺️ 5.5 Uncertainty-Aware Mapping

Represent spatial evidence without forcing the map to look complete.

Planned map states:

* Supported surface evidence.
* Supported free-space evidence.
* Unknown or unmeasured regions.
* Conflicting observations.
* Weak surface hypotheses.

Wall segments should carry supporting evidence rather than being treated as confirmed merely because a line-fitting algorithm detected them.

### 📱 5.6 On-Device Processing

The intended architecture performs acoustic processing, diagnosis, and mapping on the Android device.

Internet access is not intended to be a requirement for core scanning.

### 💾 5.7 Local Research Records

Store measurement metadata, calibration profiles, diagnostic decisions, and validation results in a local database.

Research exports should allow experiments to be inspected and analyzed independently of the live application.

---

## 🏗️ 6. System Architecture

The target architecture uses Kotlin for Android application logic and orchestration, C++ for performance-sensitive acoustic DSP, and SQLite through Room for local persistence.

```text
┌───────────────────────────────────────────────────────────┐
│                    ECHOMAP EDGE                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Presentation Layer                                   │  │
│  │ Jetpack Compose · ViewModel · StateFlow              │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │ Application Layer                                   │  │
│  │ Scan Orchestrator · Use Cases · Coroutines          │  │
│  └──────────────┬──────────────────┬───────────────────┘  │
│                 │                  │                      │
│  ┌──────────────▼─────────┐  ┌─────▼──────────────────┐   │
│  │ Audio Edge Module      │  │ Pose and Motion       │   │
│  │ AAudio / AudioRecord   │  │ Accelerometer / Gyro  │   │
│  └──────────────┬─────────┘  └─────┬──────────────────┘   │
│                 │                  │                      │
│  ┌──────────────▼──────────────────▼──────────────────┐   │
│  │ Native Acoustic DSP                                 │   │
│  │ C++ · Filtering · Correlation · Peak Detection     │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │ Reliability and Diagnosis Engine                    │   │
│  │ Evidence Assessment · Failure Classification       │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │ Adaptive Scan Planner                               │   │
│  │ Diagnosis-Driven Next Measurement                   │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │ Mapping Engine                                      │   │
│  │ Occupancy Evidence · Wall Hypotheses · Uncertainty  │   │
│  └──────────────────────┬─────────────────────────────┘   │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐   │
│  │ Local Data Layer                                    │   │
│  │ Room · SQLite · Calibration · Sessions · Exports   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                           │
│               LOCAL DEVICE PROCESSING                     │
└───────────────────────────────────────────────────────────┘
```

### Architectural responsibilities

| Module             | Responsibility                                                      |
| ------------------ | ------------------------------------------------------------------- |
| Audio Edge         | Generate signals, capture microphone input, and manage audio timing |
| Native DSP         | Extract potential echoes and compute signal features                |
| Reliability Engine | Evaluate evidence and classify measurement outcomes                 |
| Adaptive Planner   | Select the next measurement action                                  |
| Pose and Motion    | Estimate orientation and support measurement positioning            |
| Mapping Engine     | Integrate accepted evidence and track uncertainty                   |
| Local Data Layer   | Preserve sessions, calibrations, measurements, and decisions        |
| Presentation Layer | Display scan results, explanations, maps, and validation data       |

Each module should have a clear contract so it can be tested independently.

---

## 🛠️ 7. Technology Stack

### Target technology stack

| Component               | Technology                                             | Purpose                                          |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Mobile platform         | Android 10+ target                                     | Device-level sensing and local execution         |
| Primary language        | Kotlin                                                 | Application logic and orchestration              |
| User interface          | Jetpack Compose + Material 3                           | State-driven interface and map visualization     |
| Architecture            | MVVM + Clean Architecture principles                   | Separation of responsibilities                   |
| Asynchronous processing | Kotlin Coroutines + Flow                               | Scan coordination and UI state updates           |
| Audio playback          | AAudio through Android NDK, with suitable alternatives | Controlled signal playback                       |
| Audio capture           | AudioRecord                                            | Microphone input                                 |
| Native processing       | C++20 + JNI                                            | Acoustic signal processing                       |
| Numerical processing    | FFT implementation and optional Eigen                  | Filtering, correlation, and numerical operations |
| Mapping                 | Kotlin-based occupancy grid and geometric algorithms   | Spatial evidence representation                  |
| Local database          | Room + SQLite                                          | Persistent local records                         |
| Sensor input            | Android Sensor APIs                                    | Orientation and motion observations              |
| Testing                 | JUnit, MockK, and appropriate native tests             | Logic and processing validation                  |
| Optional on-device ML   | LiteRT                                                 | Future calibrated classification experiments     |

**This is the proposed target stack, not a claim that every dependency or module is already implemented.**

### Why Kotlin and C++?

Kotlin provides Android integration, structured concurrency, lifecycle-aware application logic, and a practical foundation for the interface.

C++ provides direct access to native processing tools and can support performance-sensitive filtering and correlation operations.

This division keeps application orchestration separate from the acoustic signal-processing pipeline.

### Why not start with AI?

A machine-learning model cannot compensate for an uncalibrated audio pipeline or unreliable measurements.

The initial implementation should establish a deterministic baseline. Machine learning can be considered later if collected experimental data demonstrates a specific need.

---

## ⚙️ 8. How the System Works

### Step 1: Generate an acoustic signal

The system generates a known signal, initially exploring an upward linear chirp.

A chirp sweeps through a defined frequency range over a known duration.

Its known structure provides a reference for identifying similar patterns in captured audio.

### Step 2: Play and record

The device plays the signal and records the microphone response.

The audio pipeline must account for:

* Playback latency.
* Capture latency.
* Buffer timing.
* Device-specific processing.
* Automatic gain control or noise suppression.
* Speaker and microphone frequency response.

The actual signal path must be characterized experimentally.

### Step 3: Process the recorded audio

The captured samples are filtered and compared against the known transmitted signal.

Matched filtering or cross-correlation can help identify candidate delays.

The resulting peaks are potential signal matches, not guaranteed reflections from physical walls.

### Step 4: Generate candidate ranges

After estimating and correcting the relevant timing offset, candidate delays can be converted into range estimates.

For a simple monostatic echo model:

$$
d = \frac{c(t-t_0)}{2}
$$

Where:

* \(d\) = estimated distance to the reflecting surface.
* \(c\) = assumed speed of sound.
* \(t\) = measured echo delay.
* \(t_0\) = calibrated system timing offset.

The equation assumes that the measured delay corresponds to an identifiable outgoing-and-returning acoustic path.

Multipath, hardware latency, and incorrect peak identification can violate this assumption.

### Step 5: Assess measurement reliability

The reliability engine examines signal quality, candidate ambiguity, repeatability, calibration, and available spatial evidence.

It decides whether the measurement satisfies the current acceptance criteria.

### Step 6: Select the next action

If the measurement is rejected, the system identifies the most appropriate follow-up action supported by the diagnosis.

The purpose is to obtain new evidence, not to repeat the same scan indefinitely.

### Step 7: Update the spatial representation

Only measurements that pass the configured acceptance checks are eligible to contribute to the map.

The map must preserve uncertainty and disagreements between observations.

### Step 8: Store the result

The system records the scan, candidate evidence, diagnosis, recommendation, calibration profile, and any resulting map update.

This creates a traceable relationship between observations and spatial conclusions.

---

## 🔍 9. Reliability and Failure Diagnosis

A central research component is the **Reliability and Diagnosis Engine**.

Its job is to determine whether a measurement is suitable for downstream use and to explain why a measurement was rejected.

### Proposed measurement states

| State                   | Meaning                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ACCEPTED`              | The measurement satisfies the configured acceptance criteria.                                               |
| `WEAK_SIGNAL`           | The detected response does not provide sufficient signal evidence.                                          |
| `INCONSISTENT`          | Repeated observations disagree beyond a defined tolerance.                                                  |
| `AMBIGUOUS`             | Multiple candidate interpretations remain plausible.                                                        |
| `CLUTTERED`             | The acoustic response contains overlapping or difficult-to-separate candidates.                             |
| `DIRECT_PATH_DOMINATED` | The direct signal or its immediate response dominates the evidence needed for a useful reflection estimate. |
| `MAP_CONFLICT`          | The new observation disagrees with existing spatial evidence beyond a configured threshold.                 |
| `UNRESOLVED`            | Available evidence is insufficient to support a reliable conclusion.                                        |

These categories are proposed engineering states. Their definitions and classification accuracy must be validated experimentally.

### Evidence used by the engine

Potential inputs include:

* Signal-to-noise ratio.
* Correlation peak prominence.
* Peak width.
* Candidate count.
* Candidate delay stability.
* Range spread across repeated measurements.
* Calibration validity.
* Pose uncertainty.
* Conflict with previously accepted observations.

### Explainable decisions

A rejected measurement should produce an explanation such as:

> **Measurement rejected: inconsistent observations.** Repeated scans produced range estimates outside the configured consistency threshold. Move laterally and scan again to collect a different observation.

The exact explanation should be generated from the evidence and decision rules that caused rejection.

Thresholds should be selected using calibration and validation data, not arbitrary confidence percentages.

---

## 🔁 10. Adaptive Rescanning

EchoMap Edge proposes a diagnosis-driven scan planner.

Rather than applying one generic retry action, the planner maps the current failure diagnosis to a targeted action.

### Proposed scan policy

| Diagnosis                  | Candidate next action                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| Weak signal                | Reorient the device, move closer if appropriate, or collect additional repetitions           |
| Inconsistent measurements  | Repeat under the same conditions, then try a lateral displacement if instability persists    |
| Ambiguous candidates       | Collect observations from another position                                                   |
| Cluttered response         | Change the scan angle or move to a different vantage point                                   |
| Direct-path dominated      | Change the geometry or orientation to improve the opportunity to observe a useful reflection |
| Map conflict               | Request a verification measurement from another viewpoint                                    |
| Repeated unresolved result | Stop after the configured attempt limit and preserve the area as unresolved                  |
| Accepted measurement       | Update the map and continue to the next scan location                                        |

The planner should limit retries to prevent unnecessary scanning and avoid repeatedly recommending actions that have already failed.

### Example interaction

**Initial result**

> Multiple plausible reflections detected. The current measurement is ambiguous.

**Recommended action**

> Move approximately 30 cm to the right and scan again.

**Follow-up result**

The system evaluates whether the new observation provides additional evidence and whether the competing candidates become easier to distinguish.

**If evidence improves**

The measurement may be accepted if it satisfies the configured criteria.

**If evidence remains insufficient**

The system records the failure and leaves the corresponding map region unresolved.

The 30 cm displacement is an illustrative example, not a universally optimal value.

### Research hypothesis

Diagnosis-guided rescanning may improve the number of usable measurements obtained per unit of scanning effort compared with blind repetition.

This is a hypothesis to test, not an established result.

---

## 🗺️ 11. Uncertainty-Aware Mapping

A distance estimate does not automatically reveal a complete room layout.

Meaningful spatial reconstruction also requires information about measurement position, orientation, geometry, and uncertainty.

EchoMap Edge therefore begins with a two-dimensional evidence representation rather than assuming that a complete three-dimensional map can be reconstructed from a small number of acoustic observations.

### 11.1 Evidence occupancy grid

The proposed grid tracks the evidence associated with each spatial cell.

Potential cell attributes include:

* Occupied-surface evidence.
* Free-space evidence.
* Unknown evidence.
* Conflict evidence.
* Number of supporting scans.
* Last update timestamp.

These values must have defined update rules and should not be presented as calibrated probabilities unless their probabilistic interpretation is justified.

### 11.2 Wall-segment hypotheses

Potential wall segments can be extracted from sufficiently supported spatial evidence using methods such as:

* RANSAC line fitting.
* Hough transforms.
* Collinear segment merging.
* Residual-error analysis.
* Supporting-measurement counts.

A fitted line is a hypothesis, not proof that a physical wall exists at that location.

### 11.3 Explicit map states

The interface should distinguish:

| Map state               | Interpretation                                              |
| ----------------------- | ----------------------------------------------------------- |
| Supported surface       | Sufficient evidence supports a possible reflecting surface  |
| Weak surface hypothesis | Some evidence exists, but support remains limited           |
| Unknown                 | The region has not been measured adequately                 |
| Conflict                | Different observations disagree                             |
| Unmeasured gap          | Available evidence does not establish a continuous boundary |
| Rejected observation    | A measurement was excluded from map updates                 |

### A fundamental rule

**Never automatically close a missing wall simply to make the floor plan look complete.**

The objective is an evidence-supported spatial representation, not a visually perfect but potentially misleading drawing.

---

## 📐 12. Calibration and Distance Estimation

Calibration is a foundational requirement.

A consistent timing error can create a systematic distance bias even when the signal-processing algorithm identifies peaks accurately.

### Proposed calibration process

1. Select a device and audio configuration.
2. Place a suitable reflective target at a known distance.
3. Emit the known acoustic signal.
4. Capture the resulting response.
5. Identify the direct signal and candidate reflection timing.
6. Estimate the relevant system timing offset.
7. Repeat measurements under the same configuration.
8. Evaluate timing stability and measurement error.
9. Store the calibration profile locally.
10. Recalibrate when relevant device or audio settings change.

### Calibration profile

A profile may record:

* Device model.
* Sample rate.
* Audio route.
* Playback configuration.
* Capture configuration.
* Volume setting.
* Estimated timing offset.
* Calibration date.
* Number of calibration observations.
* Observed timing variability.
* Validity status.

### Speed of sound

For an initial calculation, the speed of sound in air may be approximated as:

$$
c \approx 343\ \text{m/s}
$$

This is an approximation near 20°C. Actual sound speed varies with environmental conditions.

### Calibration principle

**Do not report a precise distance merely because the calculation produces a decimal number.**

Distance accuracy must be measured against known reference distances and reported with appropriate uncertainty and limitations.

---

## 🔐 13. Offline-First Design and Privacy

EchoMap Edge is designed around local processing.

The intended core workflow should not require uploading microphone recordings or room measurements to an external server.

### Privacy principles

* Process captured audio locally.
* Store scan records in a local database.
* Do not require cloud authentication for core scanning.
* Avoid collecting continuous audio unnecessarily.
* Prefer retaining processed features over raw recordings when raw audio is not needed.
* Obtain explicit user consent before retaining raw recordings.
* Provide a way to delete locally stored sessions.
* Make data export an explicit user action.
* Document any permissions and data access required by the application.

### Offline verification

The final application should be tested with network connectivity disabled.

Verification should establish that:

* Scanning works without an internet connection.
* Signal processing runs locally.
* Diagnosis and mapping work locally.
* Saved sessions can be reopened.
* Local exports work without cloud services.
* No unexpected network requests are made.

Offline operation is an architectural objective until these behaviors have been implemented and verified.

---

## 📁 14. Project Structure

The following is the proposed Android project structure.

```text
EchoMap-Edge/
│
├── README.md
├── LICENSE
├── .gitignore
├── CONTRIBUTING.md
│
├── docs/
│   ├── architecture.md
│   ├── research-methodology.md
│   ├── calibration-protocol.md
│   ├── experiment-protocol.md
│   └── limitations.md
│
├── app/
│   ├── build.gradle.kts
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   │
│       │   ├── java/
│       │   │   └── your/package/echomap/
│       │   │       ├── presentation/
│       │   │       │   ├── home/
│       │   │       │   ├── scan/
│       │   │       │   ├── diagnosis/
│       │   │       │   ├── mapping/
│       │   │       │   └── research/
│       │   │       │
│       │   │       ├── domain/
│       │   │       │   ├── model/
│       │   │       │   ├── usecase/
│       │   │       │   ├── reliability/
│       │   │       │   ├── planner/
│       │   │       │   └── mapping/
│       │   │       │
│       │   │       ├── data/
│       │   │       │   ├── database/
│       │   │       │   ├── repository/
│       │   │       │   └── calibration/
│       │   │       │
│       │   │       ├── audio/
│       │   │       └── sensors/
│       │   │
│       │   └── cpp/
│       │       ├── CMakeLists.txt
│       │       ├── audio/
│       │       ├── dsp/
│       │       ├── correlation/
│       │       └── jni/
│       │
│       ├── test/
│       └── androidTest/
│
├── core/
│   ├── dsp/
│   ├── reliability/
│   └── mapping/
│
├── experiments/
│   ├── calibration/
│   ├── ranging/
│   ├── diagnosis/
│   └── adaptive-rescanning/
│
└── results/
    └── README.md
```

This tree is a design proposal, not a statement that all these directories currently exist.

The package name, build configuration, native library layout, and module boundaries should be adapted to the actual repository as implementation progresses.

---

## 🛣️ 15. Development Roadmap

Development should proceed from experimentally verified acoustic sensing toward the full mapping system.

### Phase 1 — Audio Feasibility

**Goal:** Establish whether the target hardware can produce and capture useful acoustic responses.

Tasks:

* Create a minimal Android audio test.
* Generate and play a chirp.
* Record microphone input.
* Inspect the recorded waveform.
* Evaluate audio distortion and preprocessing.
* Measure repeatability and timing behavior.

**Exit criterion:** A documented, reproducible audio test with recorded results.

### Phase 2 — Native DSP

**Goal:** Extract potential echo candidates from recorded audio.

Tasks:

* Implement chirp generation.
* Implement filtering.
* Implement cross-correlation or matched filtering.
* Detect and cluster peaks.
* Calculate signal-quality features.
* Compare candidates against known test conditions.

**Exit criterion:** The DSP pipeline produces inspectable candidate results on recorded test data.

### Phase 3 — Calibration and Ranging

**Goal:** Evaluate distance estimates against known reference distances.

Tasks:

* Develop the calibration procedure.
* Estimate system timing offset.
* Collect repeated measurements.
* Calculate absolute errors.
* Evaluate device and environmental variability.

**Exit criterion:** Documented ranging performance over a defined test setup, including failure rates and limitations.

### Phase 4 — Reliability and Diagnosis

**Goal:** Implement explainable acceptance and rejection rules.

Tasks:

* Define measurable reliability features.
* Implement the measurement-state model.
* Establish thresholds using development data.
* Record reasons for rejected scans.
* Test against labeled examples.

**Exit criterion:** Repeatable decisions with measurable diagnostic performance.

### Phase 5 — Adaptive Rescanning

**Goal:** Select follow-up actions based on measurement diagnosis.

Tasks:

* Implement the finite-state scan policy.
* Add bounded retry handling.
* Record recommended actions.
* Compare blind repetition with diagnosis-guided scanning.
* Measure usability and measurement-quality differences.

**Exit criterion:** A controlled evaluation showing whether the policy improves the selected metrics.

### Phase 6 — Spatial Mapping

**Goal:** Convert accepted measurements into an uncertainty-aware two-dimensional representation.

Tasks:

* Introduce pose metadata.
* Implement the evidence grid.
* Track conflicting observations.
* Extract tentative line segments.
* Visualize unknown and unresolved regions.

**Exit criterion:** A reproducible partial map whose supported and unsupported regions are clearly distinguished.

### Phase 7 — Android Integration

**Goal:** Integrate the sensing pipeline into a usable offline application.

Tasks:

* Build the Compose interface.
* Connect the ViewModel to the scan orchestrator.
* Implement Room persistence.
* Add session replay.
* Add research exports.
* Verify behavior with network access disabled.

**Exit criterion:** A tested end-to-end local workflow on the target device.

### Phase 8 — Research and Generalization

**Goal:** Determine how well the approach performs across devices and indoor conditions.

Tasks:

* Evaluate different phone models.
* Study different reflective surfaces.
* Test realistic background noise.
* Evaluate different room configurations.
* Refine calibration and diagnosis.
* Document reproducibility and limitations.

**Exit criterion:** A documented evaluation that supports only the conclusions justified by the data.

---

## 🧪 16. Experimental Validation

EchoMap Edge requires experimental evidence before making claims about accuracy or reliability.

### Experiment A — Hardware Characterization

**Objective:** Determine whether the device's audio hardware is suitable for the intended measurements.

Record:

* Device model.
* Audio route.
* Sample rate.
* Playback configuration.
* Capture configuration.
* Signal distortion.
* Background noise.
* Timing variability.
* Relevant audio-processing behavior.

Compare configurations rather than assuming that the lowest-latency option is always the most accurate.

### Experiment B — Calibration Stability

**Objective:** Evaluate whether the system timing offset is sufficiently stable for useful ranging.

Procedure:

1. Select a known target and fixed geometry.
2. Collect repeated audio captures.
3. Estimate the timing offset for each capture.
4. Calculate mean, standard deviation, and outliers.
5. Repeat after changing relevant audio settings.
6. Determine when recalibration is necessary.

Record all configuration changes.

### Experiment C — Single-Surface Ranging

**Objective:** Measure distance-estimation performance under controlled conditions.

Possible initial reference distances:

* 0.5 m
* 1.0 m
* 1.5 m
* 2.0 m
* 2.5 m
* 3.0 m

These are proposed test distances, not validated operating limits.

For each distance, collect repeated measurements and record:

* Reference distance.
* Estimated distance.
* Absolute error.
* Signal-to-noise ratio.
* Peak prominence.
* Candidate count.
* Acceptance or rejection outcome.
* Calibration profile.
* Environmental conditions.

Start with a large, flat, reflective target and controlled positioning before testing more difficult surfaces.

### Experiment D — Failure Diagnosis

**Objective:** Determine whether the system can distinguish common measurement failure conditions.

Potential test conditions:

* Background noise from a fan.
* Weak or acoustically absorptive targets.
* Cluttered corners and shelves.
* Competing reflections.
* Direct-path-dominated responses.
* Inconsistent repeated measurements.

Ground-truth labels should be based on documented test conditions and reviewed observations.

### Experiment E — Adaptive Rescanning

**Objective:** Compare the diagnosis-guided policy with a blind-retry baseline.

Use comparable test scenarios and predefined evaluation criteria.

Record:

* Number of scan attempts.
* Final measurement outcome.
* Absolute error when a valid reference exists.
* Total time or user effort.
* Whether the next action followed the recommendation.
* Whether the measurement remained unresolved.

Where practical, use repeated trials and separate development data from evaluation data.

### Experiment F — Mapping

**Objective:** Determine whether accepted measurements and pose information support a useful partial spatial representation.

Compare the generated representation against a measured reference layout.

Evaluate:

* Surface-location error.
* Wall-segment alignment.
* Missing or unsupported segments.
* Conflicting observations.
* Unknown-region coverage.
* Sensitivity to pose errors.

Do not treat a visually plausible map as proof of geometric accuracy.

---

## 📊 17. Evaluation Metrics

The primary research question concerns whether adaptive rescanning improves measurement utility.

### Primary metric: Usable-measurement yield

Define the usable-measurement yield as:

$$
Y = \frac{N_{\text{accepted and valid}}}{N_{\text{scan attempts}}}
$$

Where:

* \(N_{\text{accepted and valid}}\) is the number of accepted measurements that also satisfy the predefined reference-validation criterion.
* \(N_{\text{scan attempts}}\) is the total number of attempts.

Acceptance alone does not establish correctness. The reference-validation criterion must be defined before evaluating the results.

### Secondary metrics

| Metric                         | What it measures                                                       |
| ------------------------------ | ---------------------------------------------------------------------- |
| Median absolute error          | Typical absolute ranging error for evaluated estimates                 |
| Error distribution             | Variation in distance-estimation performance                           |
| Repeatability                  | Consistency across repeated measurements                               |
| Attempts per valid measurement | Scanning effort required to obtain a valid result                      |
| Unresolved fraction            | Fraction of evaluated measurement locations left unresolved            |
| False acceptance rate          | Fraction of accepted measurements that fail the reference criterion    |
| False rejection rate           | Fraction of rejected measurements that satisfy the reference criterion |
| Diagnosis accuracy             | Agreement between predicted failure categories and labeled conditions  |
| Recommendation effectiveness   | Whether the recommended action improves subsequent evidence            |
| Mapping error                  | Difference between mapped and reference geometry                       |
| Processing latency             | Time required for processing and decision-making                       |
| Offline completion rate        | Fraction of tested workflows completed without network access          |

### Baseline comparison

Compare at least two strategies:

**Baseline:** Repeat the measurement according to a predefined retry procedure without diagnosis-guided action selection.

**Proposed method:** Use the current diagnosis to select the next measurement action.

Keep the target conditions and evaluation rules comparable.

Report the results even if the adaptive method does not improve performance.

A negative result can still be valuable if it reveals when the approach fails and what should change.

---

## 🚀 18. Getting Started

EchoMap Edge is planned as a native Android application. The setup instructions below describe the intended development environment; they should be updated to match the repository's actual build configuration.

### Prerequisites

Install:

* Android Studio.
* A compatible Android SDK.
* A supported JDK for the selected Android Gradle Plugin.
* Android NDK and CMake for native C++ development.
* Git.
* An Android device suitable for audio experimentation.

The exact SDK, JDK, NDK, and Gradle versions should be pinned in the project configuration once the initial application is created.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/EchoMap-Edge.git
cd EchoMap-Edge
```

Replace `YOUR-USERNAME` with the actual GitHub username or organization that owns the repository.

### 2. Open the Android project

Open the repository in Android Studio once the Gradle project and application module have been created.

Allow Android Studio to synchronize the project and install any required development components.

### 3. Connect an Android device

Enable Developer Options and USB debugging on a compatible device, or configure an Android emulator for development tasks that do not require physical audio hardware.

**Important:** Acoustic-ranging experiments must be performed on suitable physical hardware. An emulator cannot validate the real speaker, microphone, and room-reflection behavior of a phone.

### 4. Build and run

Once the Android project has been configured, use Android Studio to build and launch the application.

The initial implementation should focus on a minimal audio feasibility test before integrating mapping or adaptive rescanning.

### 5. Run the experiments

Follow the documented calibration and experiment procedures.

Store raw results, configuration details, and analysis outputs separately from source code where appropriate.

Do not publish measurements as validated results until their experimental conditions and evaluation criteria have been documented.

---

## 📱 19. Hardware and Environmental Considerations

The proposed system depends on the acoustic capabilities of the actual device.

Performance may vary significantly across phones and audio configurations.

### Important considerations

**Speaker frequency response**

A device may not reproduce every requested frequency with sufficient amplitude or fidelity.

**Microphone characteristics**

Microphone sensitivity, directionality, noise, and built-in processing can influence the captured signal.

**Audio preprocessing**

Noise suppression, automatic gain control, and echo cancellation may modify the transmitted signal's recorded response.

**Timing**

Playback and capture timing must be measured. A nominal sample rate alone does not establish the true acoustic emission time.

**Room acoustics**

Room geometry, surface materials, furniture, and other objects can create complex reflection patterns.

**Device orientation**

Changing the orientation of the speaker and microphone can change the available signal paths.

**Motion estimation**

Accelerometers and gyroscopes do not independently provide reliable long-term absolute position. Pose estimates must be treated as uncertain unless supported by appropriate reference information.

**Environmental variation**

Temperature and other environmental conditions can influence sound propagation and should be considered when interpreting results.

### Recommended development approach

Start with controlled tests involving a known distance and a large reflective target.

Demonstrate repeatable acoustic ranging before attempting full room reconstruction.

---

## ⚠️ 20. Current Limitations

EchoMap Edge is a research-oriented engineering project, and several limitations must be addressed.

### Acoustic ambiguity

A detected peak may correspond to noise, the direct signal, a reflection, or a combination of signal paths.

### Hardware variability

Results may not transfer directly between devices, even when they use nominally identical settings.

### Pose uncertainty

Indoor mapping requires information about the device's position and orientation. IMU-only estimates can drift.

### Incomplete geometry

Sparse acoustic observations do not establish a complete room layout.

### Material dependence

Different surfaces may reflect, absorb, or scatter sound differently.

### Calibration dependence

An incorrect timing offset can produce systematic distance errors.

### Limited initial mapping scope

The initial target is a partial two-dimensional evidence map, not a validated autonomous three-dimensional reconstruction system.

### No established performance claims

Accuracy, reliability, latency, mapping quality, and the effectiveness of adaptive rescanning must be measured.

### No safety-critical claims

The project is not a validated navigation, obstacle-avoidance, emergency-response, or life-safety system.

It must not be relied upon as the sole source of information for navigating hazardous environments.

---

## 🔬 21. Research Direction

EchoMap Edge investigates the intersection of several established technical fields.

### Acoustic sensing

Using known sound signals and captured responses to identify potential reflection delays.

### Digital signal processing

Applying filtering, matched filtering, correlation, and peak analysis to extract candidate measurements.

### Reliability engineering

Defining measurable criteria for accepting, rejecting, and qualifying observations.

### Active sensing

Selecting subsequent observations based on information gathered from previous measurements.

### Spatial representation

Combining observations into a map that preserves uncertainty and disagreement.

### Edge computing

Executing the core sensing and analysis pipeline locally on consumer hardware.

### Research hypothesis

> A diagnosis-guided rescanning strategy can improve the yield of valid acoustic measurements per unit of user effort, while reducing unsupported spatial conclusions compared with blind repetition.

This hypothesis should be evaluated against a predefined baseline using controlled experiments.

### Related research

Existing work demonstrates that acoustic signals and motion information can be used for indoor localization and mapping.

Examples worth investigating include:

* **ELF-SLAM:** Research on smartphone-based acoustic echo sensing, motion information, and indoor localization or mapping.
* **BatMapper:** Research exploring smartphone acoustic sensing for indoor distance estimation and floor-plan construction.
* **EchoLoc:** Research into acoustic-response-based indoor localization.

These systems provide background for understanding the field. Their exact methods, assumptions, and results should be reviewed directly before drawing comparisons.

EchoMap Edge's intended contribution is the experimental investigation of diagnosis-guided rescanning and explicit uncertainty preservation—not a claim that acoustic mapping itself is new.

---

## 🤝 22. Contributing

Contributions are welcome as the project develops.

Areas of interest include:

* Acoustic signal processing.
* Android audio engineering.
* C++ and JNI integration.
* Measurement calibration.
* Reliability classification.
* Adaptive sensing policies.
* Occupancy-grid mapping.
* Experimental design.
* Testing and reproducibility.
* Documentation and usability.

### Contribution principles

1. Keep modules independently testable.
2. Document algorithm assumptions.
3. Add tests for reliability and mapping rules.
4. Preserve reproducible experiment configurations.
5. Do not introduce arbitrary confidence scores.
6. Do not silently convert uncertain measurements into confirmed geometry.
7. Distinguish implemented functionality from planned work.
8. Report experimental failures as well as successful results.

### Development workflow

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run relevant tests.
5. Document behavior and limitations.
6. Submit a pull request describing the change and its validation.

For experimental changes, include the test conditions and measured outcomes where available.

---

## 📄 23. License

This project is intended to use the **MIT License**, subject to the license file actually included in the repository.

The MIT License permits reuse, modification, distribution, and commercial use under its stated terms, including preservation of the copyright and license notice.

See [`LICENSE`](LICENSE) for the applicable terms.

---

## 🙌 24. Acknowledgements

EchoMap Edge builds on established concepts in acoustic sensing, digital signal processing, sensor fusion, active measurement, and uncertainty-aware spatial mapping.

The project aims to investigate these ideas through an offline-first Android implementation and reproducible experiments.

The broader research community's work on acoustic localization and mapping provides important context for defining meaningful technical questions and evaluating new approaches.

---

<div align="center">

## 🔊 The Goal Is Not a Perfect-Looking Map. It's a Trustworthy One.

EchoMap Edge explores a different way to think about acoustic sensing:

**Measure what you can. Question what you detect. Investigate what fails. Preserve what remains unknown.**

<br>

*Built for experimentation. Designed for transparency. Evaluated through evidence.*

</div>
