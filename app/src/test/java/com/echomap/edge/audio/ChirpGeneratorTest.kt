package com.echomap.edge.audio

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class ChirpGeneratorTest {

    @Test
    fun chirpLengthMatchesSampleRateAndDuration() {
        val config = ChirpConfig(
            sampleRateHz = 48000,
            startFrequencyHz = 2000.0,
            endFrequencyHz = 8000.0,
            durationSeconds = 0.060, // 60ms
            amplitudeGain = 0.8
        )
        val generator = ChirpGenerator(config)
        val samples = generator.generatePcm16()

        // 48000 * 0.060 = 2880 samples
        assertEquals(2880, samples.size)
    }

    @Test
    fun chirpSamplesStayWithinShortRangeAndHeadroom() {
        val config = ChirpConfig(
            sampleRateHz = 48000,
            startFrequencyHz = 2000.0,
            endFrequencyHz = 8000.0,
            durationSeconds = 0.060,
            amplitudeGain = 0.8
        )
        val generator = ChirpGenerator(config)
        val samples = generator.generatePcm16()

        // Max possible 16-bit short is 32767. With gain 0.8, theoretical max is ~26214.
        val maxSample = samples.maxOf { abs(it.toInt()) }
        assertTrue("Max sample ($maxSample) should respect gain headroom (< 28000)", maxSample < 28000)
        assertTrue("Chirp should contain non-trivial acoustic energy", maxSample > 15000)
    }

    @Test
    fun tukeyEnvelopeTapersEndpointsToZero() {
        val config = ChirpConfig(
            sampleRateHz = 48000,
            startFrequencyHz = 2000.0,
            endFrequencyHz = 8000.0,
            durationSeconds = 0.060,
            envelopeTaperRatio = 0.10
        )
        val generator = ChirpGenerator(config)
        val samples = generator.generatePcm16()

        // First and last samples must be near 0 to avoid clicks
        assertEquals(0, samples.first().toInt())
        assertTrue("Last sample amplitude should be small (< 500), was ${samples.last()}", abs(samples.last().toInt()) < 500)
    }

    @Test
    fun byteConversionProducesLittleEndianPcm16() {
        val config = ChirpConfig(sampleRateHz = 48000, durationSeconds = 0.010)
        val generator = ChirpGenerator(config)
        val shorts = generator.generatePcm16()
        val bytes = generator.generatePcm16Bytes()

        assertEquals(shorts.size * 2, bytes.size)

        // Verify Little-Endian reconstruction
        for (i in shorts.indices) {
            val bLow = bytes[i * 2].toInt() and 0xFF
            val bHigh = bytes[i * 2 + 1].toInt()
            val reconstructed = ((bHigh shl 8) or bLow).toShort()
            assertEquals("Sample at index $i mismatch", shorts[i], reconstructed)
        }
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsFrequencyAboveNyquist() {
        ChirpConfig(
            sampleRateHz = 16000,
            startFrequencyHz = 2000.0,
            endFrequencyHz = 9000.0 // 9000 > 16000 / 2 (8000)
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsNegativeDuration() {
        ChirpConfig(durationSeconds = -0.05)
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsInvalidGain() {
        ChirpConfig(amplitudeGain = 1.5)
    }
}
