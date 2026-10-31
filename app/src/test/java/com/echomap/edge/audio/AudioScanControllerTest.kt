package com.echomap.edge.audio

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioScanControllerTest {

    private val controller = AudioScanController()

    @Test
    fun computeSignalStatisticsCorrectlyMeasuresRmsAndPeak() {
        val samples = shortArrayOf(0, 16384, -16384, 0)
        val stats = controller.computeSignalStatistics(samples)

        // Peak is 16384 -> normalized 0.5
        assertEquals(16384.toShort(), stats.peakRaw)
        assertEquals(0.5f, stats.peakNormalized, 0.01f)

        // RMS of [0, 0.5, -0.5, 0]: sqrt((0.25 + 0.25)/4) = sqrt(0.125) approx 0.3535
        assertEquals(0.3535f, stats.rmsNormalized, 0.01f)
        assertFalse(stats.isClippingDetected)
    }

    @Test
    fun computeSignalStatisticsDetectsClipping() {
        val clippingSamples = shortArrayOf(100, 32765, -100)
        val stats = controller.computeSignalStatistics(clippingSamples)

        assertTrue(stats.isClippingDetected)
        assertTrue(stats.peakNormalized >= 0.99f)
    }

    @Test
    fun decimateWaveformPreservesTargetSizeAndExtremes() {
        val samples = ShortArray(1000) { 100 }
        samples[250] = 20000 // A transient spike
        samples[750] = -15000 // A negative transient spike

        val decimated = controller.decimateWaveform(samples, targetPoints = 10)
        assertEquals(10, decimated.size)

        // Peak transient spike at 250 (falls into chunk 2: 200..300)
        val spikeChunk = decimated[2]
        assertEquals(20000f / 32768f, spikeChunk, 0.05f)

        // Negative transient spike at 750 (falls into chunk 7: 700..800)
        val negSpikeChunk = decimated[7]
        assertEquals(-15000f / 32768f, negSpikeChunk, 0.05f)
    }
}
