package com.echomap.edge.audio

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext

/**
 * Metadata describing an acoustic recording session.
 */
data class RecordingMetadata(
    val sampleRateHz: Int,
    val audioSourceName: String,
    val audioSourceId: Int,
    val durationMs: Long,
    val totalSamples: Int
)

/**
 * Result of a recording operation.
 */
sealed class RecordingResult {
    data class Success(
        val pcmSamples: ShortArray,
        val metadata: RecordingMetadata
    ) : RecordingResult() {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (javaClass != other?.javaClass) return false
            other as Success
            return pcmSamples.contentEquals(other.pcmSamples) && metadata == other.metadata
        }

        override fun hashCode(): Int {
            var result = pcmSamples.contentHashCode()
            result = 31 * result + metadata.hashCode()
            return result
        }
    }

    data class Error(val message: String, val cause: Throwable? = null) : RecordingResult()
}

/**
 * Audio source candidate with human-readable name.
 */
data class AudioSourceCandidate(
    val id: Int,
    val name: String
)

/**
 * Handles PCM 16-bit mono microphone recording using Android's [AudioRecord] API.
 *
 * Implements fallback mechanisms for audio sources (prioritizing [MediaRecorder.AudioSource.UNPROCESSED]
 * to bypass OEM DSP echo cancellation and noise suppression) and supported sample rates.
 */
class AudioRecorder {

    companion object {
        val CANDIDATE_SAMPLE_RATES = intArrayOf(48000, 44100, 16000)

        fun getCandidateSources(): List<AudioSourceCandidate> {
            val list = mutableListOf<AudioSourceCandidate>()
            // UNPROCESSED is supported from API 24+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                list.add(AudioSourceCandidate(MediaRecorder.AudioSource.UNPROCESSED, "UNPROCESSED"))
            }
            list.add(AudioSourceCandidate(MediaRecorder.AudioSource.VOICE_RECOGNITION, "VOICE_RECOGNITION"))
            list.add(AudioSourceCandidate(MediaRecorder.AudioSource.MIC, "MIC"))
            list.add(AudioSourceCandidate(MediaRecorder.AudioSource.DEFAULT, "DEFAULT"))
            return list
        }
    }

    data class InitializedAudioRecord(
        val record: AudioRecord,
        val sampleRate: Int,
        val audioSource: AudioSourceCandidate,
        val minBufferSize: Int
    )

    /**
     * Attempts to find a supported configuration and instantiate an [AudioRecord] instance.
     */
    @SuppressLint("MissingPermission")
    private fun findSupportedAudioRecord(
        preferredSampleRate: Int = 48000
    ): Result<InitializedAudioRecord> {
        val rates = mutableListOf(preferredSampleRate)
        for (r in CANDIDATE_SAMPLE_RATES) {
            if (r !in rates) rates.add(r)
        }

        val sources = getCandidateSources()
        var lastFailureReason = "No audio configuration tested"

        for (source in sources) {
            for (rate in rates) {
                val minBufferSize = AudioRecord.getMinBufferSize(
                    rate,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
                )

                if (minBufferSize == AudioRecord.ERROR || minBufferSize == AudioRecord.ERROR_BAD_VALUE) {
                    lastFailureReason = "Invalid buffer size for source=${source.name}, rate=$rate"
                    continue
                }

                try {
                    // Double buffer size to ensure adequate buffering against scheduling jitter
                    val bufferSize = maxOf(minBufferSize * 2, 2048)

                    val record = AudioRecord(
                        source.id,
                        rate,
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        bufferSize
                    )

                    if (record.state == AudioRecord.STATE_INITIALIZED) {
                        return Result.success(
                            InitializedAudioRecord(
                                record = record,
                                sampleRate = record.sampleRate,
                                audioSource = source,
                                minBufferSize = bufferSize
                            )
                        )
                    } else {
                        record.release()
                        lastFailureReason = "AudioRecord failed state check (source=${source.name}, rate=$rate)"
                    }
                } catch (e: Exception) {
                    lastFailureReason = "Exception creating AudioRecord (${source.name}, $rate): ${e.message}"
                }
            }
        }

        return Result.failure(IllegalStateException("No valid AudioRecord configuration found: $lastFailureReason"))
    }

    /**
     * Records a bounded segment of audio for the requested duration.
     *
     * @param durationMs Target duration of the recording in milliseconds.
     * @param preferredSampleRate Preferred sample rate in Hz (default 48000).
     * @param onRecordingStarted Optional callback invoked immediately after the hardware has
     *                           started recording, enabling concurrent playback synchronization.
     */
    @SuppressLint("MissingPermission")
    suspend fun recordSegment(
        durationMs: Long,
        preferredSampleRate: Int = 48000,
        onRecordingStarted: (suspend () -> Unit)? = null
    ): RecordingResult = withContext(Dispatchers.IO) {
        if (durationMs <= 0) {
            return@withContext RecordingResult.Error("Recording duration must be positive: ${durationMs}ms")
        }

        val initResult = findSupportedAudioRecord(preferredSampleRate)
        if (initResult.isFailure) {
            return@withContext RecordingResult.Error(
                initResult.exceptionOrNull()?.message ?: "Failed to initialize AudioRecord"
            )
        }

        val (audioRecord, actualSampleRate, audioSource, bufferSize) = initResult.getOrThrow()

        val targetSamples = ((actualSampleRate.toLong() * durationMs) / 1000L).toInt()
        val capturedSamples = ShortArray(targetSamples)
        val readBuffer = ShortArray(maxOf(bufferSize / 2, 1024))
        var samplesReadTotal = 0
        val startTime = System.currentTimeMillis()

        try {
            audioRecord.startRecording()
            if (audioRecord.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
                return@withContext RecordingResult.Error(
                    "AudioRecord failed to enter recording state (state: ${audioRecord.recordingState})"
                )
            }

            // Hardware has started capturing. Trigger playback or sync callback.
            onRecordingStarted?.invoke()

            while (isActive && samplesReadTotal < targetSamples) {
                val samplesRemaining = targetSamples - samplesReadTotal
                val toRead = minOf(readBuffer.size, samplesRemaining)
                val readResult = audioRecord.read(readBuffer, 0, toRead)

                when {
                    readResult > 0 -> {
                        System.arraycopy(readBuffer, 0, capturedSamples, samplesReadTotal, readResult)
                        samplesReadTotal += readResult
                    }
                    readResult == AudioRecord.ERROR_INVALID_OPERATION -> {
                        return@withContext RecordingResult.Error("AudioRecord read failed: ERROR_INVALID_OPERATION")
                    }
                    readResult == AudioRecord.ERROR_BAD_VALUE -> {
                        return@withContext RecordingResult.Error("AudioRecord read failed: ERROR_BAD_VALUE")
                    }
                    readResult == AudioRecord.ERROR_DEAD_OBJECT -> {
                        return@withContext RecordingResult.Error("AudioRecord read failed: Audio HAL died (ERROR_DEAD_OBJECT)")
                    }
                    readResult == AudioRecord.ERROR -> {
                        return@withContext RecordingResult.Error("AudioRecord read failed: Generic ERROR")
                    }
                }
            }

            val elapsedMs = System.currentTimeMillis() - startTime
            val finalSamples = if (samplesReadTotal == targetSamples) {
                capturedSamples
            } else {
                capturedSamples.copyOf(samplesReadTotal)
            }

            RecordingResult.Success(
                pcmSamples = finalSamples,
                metadata = RecordingMetadata(
                    sampleRateHz = actualSampleRate,
                    audioSourceName = audioSource.name,
                    audioSourceId = audioSource.id,
                    durationMs = elapsedMs,
                    totalSamples = samplesReadTotal
                )
            )

        } catch (e: Exception) {
            RecordingResult.Error("Recording failed with exception: ${e.message}", e)
        } finally {
            // Guarantee resource release
            try {
                if (audioRecord.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    audioRecord.stop()
                }
            } catch (_: Exception) {
            } finally {
                audioRecord.release()
            }
        }
    }
}
