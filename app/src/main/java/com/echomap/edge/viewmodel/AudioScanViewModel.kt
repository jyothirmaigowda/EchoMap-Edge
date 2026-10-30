package com.echomap.edge.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.echomap.edge.audio.AudioScanController
import com.echomap.edge.audio.ChirpConfig
import com.echomap.edge.audio.ScanResult
import com.echomap.edge.audio.ScanSuccessResult
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Scan state machine representations.
 */
sealed class ScanStatus {
    object Ready : ScanStatus()
    object RequestingPermission : ScanStatus()
    object PreparingAudio : ScanStatus()
    object RecordingAndPlaying : ScanStatus()
    object ProcessingWaveform : ScanStatus()
    data class Completed(val scanResult: ScanSuccessResult) : ScanStatus()
    data class Failed(val error: String) : ScanStatus()
}

/**
 * UI State exposed by [AudioScanViewModel].
 */
data class AudioScanUiState(
    val scanStatus: ScanStatus = ScanStatus.Ready,
    val hasRecordAudioPermission: Boolean = false,
    val recordingDurationMs: Long = 0L,
    val actualSampleRateHz: Int = 0,
    val audioSourceUsed: String = "N/A",
    val peakAmplitudeNormalized: Float = 0f,
    val peakAmplitudeRaw: Short = 0,
    val rmsAmplitudeNormalized: Float = 0f,
    val isClipping: Boolean = false,
    val waveformSamples: FloatArray = FloatArray(0),
    val errorMessage: String? = null
) {
    val isScanning: Boolean
        get() = scanStatus is ScanStatus.PreparingAudio ||
                scanStatus is ScanStatus.RecordingAndPlaying ||
                scanStatus is ScanStatus.ProcessingWaveform ||
                scanStatus is ScanStatus.RequestingPermission

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as AudioScanUiState
        return scanStatus == other.scanStatus &&
                hasRecordAudioPermission == other.hasRecordAudioPermission &&
                recordingDurationMs == other.recordingDurationMs &&
                actualSampleRateHz == other.actualSampleRateHz &&
                audioSourceUsed == other.audioSourceUsed &&
                peakAmplitudeNormalized == other.peakAmplitudeNormalized &&
                peakAmplitudeRaw == other.peakAmplitudeRaw &&
                rmsAmplitudeNormalized == other.rmsAmplitudeNormalized &&
                isClipping == other.isClipping &&
                waveformSamples.contentEquals(other.waveformSamples) &&
                errorMessage == other.errorMessage
    }

    override fun hashCode(): Int {
        var result = scanStatus.hashCode()
        result = 31 * result + hasRecordAudioPermission.hashCode()
        result = 31 * result + recordingDurationMs.hashCode()
        result = 31 * result + actualSampleRateHz.hashCode()
        result = 31 * result + audioSourceUsed.hashCode()
        result = 31 * result + peakAmplitudeNormalized.hashCode()
        result = 31 * result + peakAmplitudeRaw.hashCode()
        result = 31 * result + rmsAmplitudeNormalized.hashCode()
        result = 31 * result + isClipping.hashCode()
        result = 31 * result + waveformSamples.contentHashCode()
        result = 31 * result + (errorMessage?.hashCode() ?: 0)
        return result
    }
}

/**
 * ViewModel managing acoustic scan lifecycle, permission state,
 * and audio analysis results.
 */
class AudioScanViewModel(
    private val scanController: AudioScanController = AudioScanController()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AudioScanUiState())
    val uiState: StateFlow<AudioScanUiState> = _uiState.asStateFlow()

    private var activeScanJob: Job? = null

    /**
     * Updates recording permission status.
     */
    fun onPermissionResult(isGranted: Boolean) {
        _uiState.update { current ->
            current.copy(
                hasRecordAudioPermission = isGranted,
                scanStatus = if (!isGranted && current.scanStatus is ScanStatus.RequestingPermission) {
                    ScanStatus.Failed("RECORD_AUDIO permission was denied. Cannot perform acoustic scan.")
                } else if (isGranted && current.scanStatus is ScanStatus.RequestingPermission) {
                    ScanStatus.Ready
                } else {
                    current.scanStatus
                },
                errorMessage = if (!isGranted) "Microphone permission is required to capture acoustic echoes." else null
            )
        }
    }

    /**
     * Initiates permission request state.
     */
    fun setRequestingPermission() {
        _uiState.update { it.copy(scanStatus = ScanStatus.RequestingPermission) }
    }

    /**
     * Triggers the acoustic feasibility scan.
     * Prevents concurrent or duplicate scans.
     */
    fun startScan(chirpConfig: ChirpConfig = ChirpConfig()) {
        if (_uiState.value.isScanning) {
            return // Guard against duplicate concurrent trigger
        }

        activeScanJob = viewModelScope.launch {
            _uiState.update {
                it.copy(
                    scanStatus = ScanStatus.PreparingAudio,
                    errorMessage = null
                )
            }

            try {
                _uiState.update { it.copy(scanStatus = ScanStatus.RecordingAndPlaying) }

                val result = scanController.executeScan(chirpConfig = chirpConfig)

                _uiState.update { it.copy(scanStatus = ScanStatus.ProcessingWaveform) }

                when (result) {
                    is ScanResult.Success -> {
                        val data = result.data
                        _uiState.update {
                            it.copy(
                                scanStatus = ScanStatus.Completed(data),
                                recordingDurationMs = data.recordingMetadata.durationMs,
                                actualSampleRateHz = data.recordingMetadata.sampleRateHz,
                                audioSourceUsed = data.recordingMetadata.audioSourceName,
                                peakAmplitudeNormalized = data.statistics.peakNormalized,
                                peakAmplitudeRaw = data.statistics.peakRaw,
                                rmsAmplitudeNormalized = data.statistics.rmsNormalized,
                                isClipping = data.statistics.isClippingDetected,
                                waveformSamples = data.decimatedWaveform,
                                errorMessage = null
                            )
                        }
                    }
                    is ScanResult.Failure -> {
                        _uiState.update {
                            it.copy(
                                scanStatus = ScanStatus.Failed(result.reason),
                                errorMessage = result.reason
                            )
                        }
                    }
                }
            } catch (e: CancellationException) {
                _uiState.update {
                    it.copy(
                        scanStatus = ScanStatus.Ready,
                        errorMessage = "Acoustic scan was cancelled"
                    )
                }
                throw e
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        scanStatus = ScanStatus.Failed(e.message ?: "Unknown audio scan failure"),
                        errorMessage = e.message ?: "Unknown audio scan failure"
                    )
                }
            }
        }
    }

    /**
     * Safely cancels an ongoing scan.
     */
    fun cancelScan() {
        activeScanJob?.cancel()
        activeScanJob = null
        _uiState.update {
            it.copy(
                scanStatus = ScanStatus.Ready,
                errorMessage = "Scan cancelled by user."
            )
        }
    }

    /**
     * Clears error and returns to Ready state.
     */
    fun resetScan() {
        _uiState.update {
            it.copy(
                scanStatus = ScanStatus.Ready,
                errorMessage = null
            )
        }
    }

    override fun onCleared() {
        super.onCleared()
        activeScanJob?.cancel()
        activeScanJob = null
    }
}
