package com.echomap.edge.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * Result wrapper for playback operations.
 */
sealed class PlaybackResult {
    data class Success(val framesPlayed: Int, val durationMs: Long) : PlaybackResult()
    data class Error(val message: String, val cause: Throwable? = null) : PlaybackResult()
}

/**
 * Plays PCM 16-bit mono audio using Android's [AudioTrack] in static buffer mode.
 *
 * Designed specifically for low-latency, deterministic chirp playback without
 * blocking the main thread, while strictly releasing native audio HAL resources.
 */
class AudioPlayer {

    /**
     * Plays the given PCM-16 mono samples through the device speaker.
     *
     * Suspends until the audio hardware has completely finished rendering the samples,
     * or until cancelled or an error occurs.
     *
     * @param samples 16-bit PCM mono samples to play.
     * @param sampleRateHz Sample rate in Hz (e.g., 48000).
     * @param timeoutMs Maximum allowable duration before timing out playback.
     */
    suspend fun playChirp(
        samples: ShortArray,
        sampleRateHz: Int,
        timeoutMs: Long = 2000L
    ): PlaybackResult = withContext(Dispatchers.IO) {
        if (samples.isEmpty()) {
            return@withContext PlaybackResult.Error("Cannot play empty audio sample array")
        }

        val frameCount = samples.size
        val minBufferSize = AudioTrack.getMinBufferSize(
            sampleRateHz,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        if (minBufferSize == AudioTrack.ERROR || minBufferSize == AudioTrack.ERROR_BAD_VALUE) {
            return@withContext PlaybackResult.Error(
                "Unsupported audio playback configuration: sampleRate=$sampleRateHz Hz"
            )
        }

        // Buffer size must be at least as large as the data and minBufferSize
        val bufferSizeBytes = maxOf(frameCount * 2, minBufferSize)

        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        val audioFormat = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(sampleRateHz)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build()

        var track: AudioTrack? = null
        val startTime = System.currentTimeMillis()

        try {
            track = AudioTrack.Builder()
                .setAudioAttributes(audioAttributes)
                .setAudioFormat(audioFormat)
                .setBufferSizeInBytes(bufferSizeBytes)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            if (track.state != AudioTrack.STATE_INITIALIZED) {
                return@withContext PlaybackResult.Error(
                    "AudioTrack failed to initialize (state: ${track.state})"
                )
            }

            // Write all samples into the static buffer before playback
            val written = track.write(samples, 0, samples.size)
            if (written < 0) {
                return@withContext PlaybackResult.Error(
                    "AudioTrack write failed with error code: $written"
                )
            }

            // Set notification marker at end of samples
            track.notificationMarkerPosition = frameCount

            // Wait for completion via marker callback or head position polling
            val completedNormally = withTimeoutOrNull(timeoutMs) {
                awaitPlaybackCompletion(track, frameCount)
            }

            if (completedNormally == true) {
                val elapsed = System.currentTimeMillis() - startTime
                PlaybackResult.Success(framesPlayed = frameCount, durationMs = elapsed)
            } else {
                PlaybackResult.Error("Audio playback timed out after ${timeoutMs}ms")
            }

        } catch (e: Exception) {
            PlaybackResult.Error("Playback encountered an exception: ${e.message}", e)
        } finally {
            // Guarantee resource cleanup even on coroutine cancellation
            track?.let { t ->
                try {
                    t.setPlaybackPositionUpdateListener(null)
                    if (t.playState == AudioTrack.PLAYSTATE_PLAYING) {
                        t.stop()
                    }
                    t.flush()
                } catch (_: Exception) {
                } finally {
                    t.release()
                }
            }
        }
    }

    /**
     * Awaits playback completion by playing and monitoring both marker position
     * callback and playback head position.
     */
    private suspend fun awaitPlaybackCompletion(track: AudioTrack, targetFrames: Int): Boolean {
        var markerReached = false

        // Handler thread or main looper for AudioTrack listener
        val looper = Looper.getMainLooper()
        val handler = Handler(looper)

        track.setPlaybackPositionUpdateListener(object : AudioTrack.OnPlaybackPositionUpdateListener {
            override fun onMarkerReached(t: AudioTrack?) {
                markerReached = true
            }

            override fun onPeriodicNotification(t: AudioTrack?) {
                // Not used
            }
        }, handler)

        track.play()

        // Poll head position in addition to marker, yielding to coroutine dispatcher
        while (!markerReached) {
            val head = try {
                track.playbackHeadPosition
            } catch (_: Exception) {
                break
            }
            if (head >= targetFrames) {
                break
            }
            delay(5)
        }

        return true
    }
}
