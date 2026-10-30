package com.echomap.edge.audio

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Configuration for linear frequency-modulated (LFM) acoustic chirps.
 *
 * @property sampleRateHz Sampling rate in Hz (e.g., 48000 Hz or 44100 Hz).
 * @property startFrequencyHz Starting frequency of the sweep in Hz (e.g., 2000 Hz).
 * @property endFrequencyHz Ending frequency of the sweep in Hz (e.g., 8000 Hz).
 * @property durationSeconds Duration of the chirp signal in seconds (e.g., 0.060s = 60ms).
 * @property amplitudeGain Normalized peak amplitude factor (0.0 < gain <= 1.0). Default 0.8
 *                         leaves 2 dB headroom to prevent speaker distortion / DAC clipping.
 * @property envelopeTaperRatio Ratio of chirp duration dedicated to cosine ramp-up and ramp-down
 *                              (Tukey window, e.g. 0.10 = 10% rise, 10% decay) to eliminate clicks.
 */
data class ChirpConfig(
    val sampleRateHz: Int = 48000,
    val startFrequencyHz: Double = 2000.0,
    val endFrequencyHz: Double = 8000.0,
    val durationSeconds: Double = 0.060,
    val amplitudeGain: Double = 0.8,
    val envelopeTaperRatio: Double = 0.10
) {
    init {
        require(sampleRateHz > 0) { "Sample rate must be positive: $sampleRateHz" }
        require(startFrequencyHz > 0) { "Start frequency must be positive: $startFrequencyHz" }
        require(endFrequencyHz > 0) { "End frequency must be positive: $endFrequencyHz" }
        require(startFrequencyHz != endFrequencyHz) { "Start and end frequencies cannot be equal" }
        val nyquist = sampleRateHz / 2.0
        require(startFrequencyHz < nyquist) {
            "Start frequency $startFrequencyHz Hz must be below Nyquist frequency ($nyquist Hz)"
        }
        require(endFrequencyHz < nyquist) {
            "End frequency $endFrequencyHz Hz must be below Nyquist frequency ($nyquist Hz)"
        }
        require(durationSeconds > 0.0) { "Duration must be positive: $durationSeconds" }
        require(amplitudeGain > 0.0 && amplitudeGain <= 1.0) {
            "Amplitude gain must be in (0.0, 1.0], was $amplitudeGain"
        }
        require(envelopeTaperRatio >= 0.0 && envelopeTaperRatio <= 0.5) {
            "Envelope taper ratio must be in [0.0, 0.5], was $envelopeTaperRatio"
        }
    }

    /** Total number of samples in the chirp. */
    val totalSamples: Int get() = (sampleRateHz * durationSeconds).roundToInt()
}

/**
 * Generates linear frequency-modulated (LFM) acoustic chirps encoded as 16-bit PCM mono.
 *
 * Employs a Tukey (tapered cosine) window to taper signal endpoints to zero,
 * suppressing high-frequency transient clicks and acoustic driver splatter.
 */
class ChirpGenerator(val config: ChirpConfig = ChirpConfig()) {

    /**
     * Synthesizes the LFM chirp as 16-bit signed PCM samples.
     *
     * @return [ShortArray] containing PCM-16 mono samples.
     */
    fun generatePcm16(): ShortArray {
        val totalSamples = config.totalSamples
        require(totalSamples > 0) { "Total samples must be positive" }

        val samples = ShortArray(totalSamples)
        val f0 = config.startFrequencyHz
        val f1 = config.endFrequencyHz
        val tTotal = config.durationSeconds
        val fs = config.sampleRateHz.toDouble()
        val chirpRate = (f1 - f0) / tTotal // Hz/s (chirp sweep rate k)
        val gain = config.amplitudeGain

        val taperSamples = (totalSamples * config.envelopeTaperRatio).roundToInt().coerceAtLeast(1)

        for (n in 0 until totalSamples) {
            val t = n / fs

            // Continuous instantaneous phase: phi(t) = 2*pi*(f0*t + 0.5*k*t^2)
            val phase = 2.0 * PI * (f0 * t + 0.5 * chirpRate * t * t)

            // Tukey window amplitude envelope w(n)
            val envelope = when {
                n < taperSamples -> {
                    // Hann ramp up from 0 to 1
                    0.5 * (1.0 - cos(PI * n / taperSamples))
                }
                n >= totalSamples - taperSamples -> {
                    // Hann ramp down from 1 to 0
                    val decayIndex = n - (totalSamples - taperSamples)
                    0.5 * (1.0 + cos(PI * decayIndex / taperSamples))
                }
                else -> 1.0
            }

            // Synthesize sample with scaling and clipping protection
            val rawSample = envelope * gain * sin(phase)
            val pcmValue = (rawSample * Short.MAX_VALUE).roundToInt()
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
            samples[n] = pcmValue.toShort()
        }

        return samples
    }

    /**
     * Synthesizes the LFM chirp as a byte array (PCM 16-bit Little-Endian mono),
     * suitable for streaming directly to [android.media.AudioTrack].
     *
     * @return [ByteArray] containing 2 bytes per sample in Little-Endian format.
     */
    fun generatePcm16Bytes(): ByteArray {
        val shorts = generatePcm16()
        val bytes = ByteArray(shorts.size * 2)
        for (i in shorts.indices) {
            val sample = shorts[i].toInt()
            bytes[i * 2] = (sample and 0xFF).toByte()
            bytes[i * 2 + 1] = ((sample shr 8) and 0xFF).toByte()
        }
        return bytes
    }
}
