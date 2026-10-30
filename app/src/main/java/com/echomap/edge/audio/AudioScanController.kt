package com.echomap.edge.audio

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Summary statistics calculated from the recorded PCM waveform.
 */
data class SignalStatistics(
    val peakRaw: Short,
    val peakNormalized: Float,
    val rmsNormalized: Float,
    val isClippingDetected: Boolean
)

/**
 * Complete outcome of an acoustic scan.
 */
data class ScanSuccessResult(
    val pcmSamples: ShortArray,
    val recordingMetadata: RecordingMetadata,
    val chirpConfig: ChirpConfig,
    val statistics: SignalStatistics,
    val decimatedWaveform: FloatArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as ScanSuccessResult
        return pcmSamples.contentEquals(other.pcmSamples) &&
                recordingMetadata == other.recordingMetadata &&
                chirpConfig == other.chirpConfig &&
                statistics == other.statistics &&
                decimatedWaveform.contentEquals(other.decimatedWaveform)
    }

    override fun hashCode(): Int {
        var result = pcmSamples.contentHashCode()
        result = 31 * result + recordingMetadata.hashCode()
        result = 31 * result + chirpConfig.hashCode()
        result = 31 * result + statistics.hashCode()
        result = 31 * result + decimatedWaveform.contentHashCode()
        return result
    }
}

sealed class ScanResult {
    data class Success(val data: ScanSuccessResult) : ScanResult()
    data class Failure(val reason: String, val cause: Throwable? = null) : ScanResult()
}

/**
 * Controller coordinating acoustic chirp generation, simultaneous recording,
 * playback timing, signal processing, and deterministic cleanup.
 */
class AudioScanController(
    private val chirpGeneratorFactory: (ChirpConfig) -> ChirpGenerator = { ChirpGenerator(it) },
    private val audioPlayer: AudioPlayer = AudioPlayer(),
    private val audioRecorder: AudioRecorder = AudioRecorder()
) {

    /**
     * Executes an acoustic feasibility scan:
     * 1. Validates configuration and synthesizes the chirp.
     * 2. Starts microphone recording.
     * 3. Plays chirp concurrently after a brief pre-roll delay.
     * 4. Awaits post-chirp reflection window.
     * 5. Analyzes waveform statistics and returns results.
     *
     * @param chirpConfig Configuration for the emitted acoustic chirp.
     * @param preRollMs Delay in ms after recording starts before playing chirp (default 30ms).
     * @param postChirpListenMs Acoustic listening window in ms after playback finishes (default 210ms).
     * @param targetWaveformPoints Number of points to decimate waveform down to for UI rendering.
     */
    suspend fun executeScan(
        chirpConfig: ChirpConfig = ChirpConfig(),
        preRollMs: Long = 30L,
        postChirpListenMs: Long = 210L,
        targetWaveformPoints: Int = 400
    ): ScanResult = withContext(Dispatchers.Default) {
        // Step 1: Synthesize chirp on background dispatcher
        val chirpGenerator = chirpGeneratorFactory(chirpConfig)
        val chirpSamples = try {
            chirpGenerator.generatePcm16()
        } catch (e: Exception) {
            return@withContext ScanResult.Failure("Chirp generation failed: ${e.message}", e)
        }

        // Calculate bounded total recording duration
        val chirpDurationMs = (chirpConfig.durationSeconds * 1000.0).toLong()
        val totalRecordDurationMs = preRollMs + chirpDurationMs + postChirpListenMs

        var playbackFailure: String? = null

        // Step 2 & 3: Start recording, triggering playback concurrently
        val recordResult = audioRecorder.recordSegment(
            durationMs = totalRecordDurationMs,
            preferredSampleRate = chirpConfig.sampleRateHz
        ) {
            // Invoked immediately once AudioRecord is actively recording
            try {
                if (preRollMs > 0) {
                    delay(preRollMs)
                }

                val playResult = audioPlayer.playChirp(
                    samples = chirpSamples,
                    sampleRateHz = chirpConfig.sampleRateHz
                )

                if (playResult is PlaybackResult.Error) {
                    playbackFailure = playResult.message
                }
            } catch (e: Exception) {
                playbackFailure = "Playback exception: ${e.message}"
            }
        }

        if (playbackFailure != null) {
            return@withContext ScanResult.Failure("Playback error during scan: $playbackFailure")
        }

        when (recordResult) {
            is RecordingResult.Error -> {
                ScanResult.Failure("Recording error during scan: ${recordResult.message}", recordResult.cause)
            }
            is RecordingResult.Success -> {
                val samples = recordResult.pcmSamples
                if (samples.isEmpty()) {
                    return@withContext ScanResult.Failure("No audio samples were recorded")
                }

                // Step 4: Compute signal statistics
                val statistics = computeSignalStatistics(samples)

                // Step 5: Decimate waveform for UI presentation
                val decimated = decimateWaveform(samples, targetWaveformPoints)

                ScanResult.Success(
                    ScanSuccessResult(
                        pcmSamples = samples,
                        recordingMetadata = recordResult.metadata,
                        chirpConfig = chirpConfig,
                        statistics = statistics,
                        decimatedWaveform = decimated
                    )
                )
            }
        }
    }

    /**
     * Calculates peak amplitude, RMS amplitude, and checks for clipping on PCM-16 samples.
     */
    fun computeSignalStatistics(samples: ShortArray): SignalStatistics {
        if (samples.isEmpty()) {
            return SignalStatistics(0, 0f, 0f, false)
        }

        var maxAbs = 0
        var sumSquares = 0.0

        for (sample in samples) {
            val absVal = abs(sample.toInt())
            if (absVal > maxAbs) {
                maxAbs = absVal
            }
            val normalized = sample.toDouble() / 32768.0
            sumSquares += normalized * normalized
        }

        val rms = sqrt(sumSquares / samples.size).toFloat()
        val peakNormalized = (maxAbs.toFloat() / 32768.0f).coerceIn(0f, 1f)
        val isClipping = maxAbs >= 32760 // Near Short.MAX_VALUE threshold

        return SignalStatistics(
            peakRaw = maxAbs.toShort(),
            peakNormalized = peakNormalized,
            rmsNormalized = rms,
            isClippingDetected = isClipping
        )
    }

    /**
     * Decimates full PCM short array into a normalized float array for smooth UI rendering.
     * Uses min/max envelope decimation to preserve peak transient detail without aliasing.
     */
    fun decimateWaveform(samples: ShortArray, targetPoints: Int): FloatArray {
        if (samples.isEmpty() || targetPoints <= 0) return FloatArray(0)
        if (samples.size <= targetPoints) {
            val result = FloatArray(samples.size)
            for (i in samples.indices) {
                result[i] = (samples[i].toFloat() / 32768.0f).coerceIn(-1.0f, 1.0f)
            }
            return result
        }

        val result = FloatArray(targetPoints)
        val chunkSize = samples.size.toDouble() / targetPoints

        for (i in 0 until targetPoints) {
            val startIdx = (i * chunkSize).toInt()
            val endIdx = (((i + 1) * chunkSize).toInt()).coerceAtMost(samples.size)

            var extremeSample: Short = 0
            var maxMagnitude = -1

            for (j in startIdx until endIdx) {
                val s = samples[j]
                val mag = abs(s.toInt())
                if (mag > maxMagnitude) {
                    maxMagnitude = mag
                    extremeSample = s
                }
            }
            result[i] = (extremeSample.toFloat() / 32768.0f).coerceIn(-1.0f, 1.0f)
        }

        return result
    }
}
