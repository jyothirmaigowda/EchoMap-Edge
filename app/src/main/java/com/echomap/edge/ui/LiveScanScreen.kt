package com.echomap.edge.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.echomap.edge.ui.theme.CyanAccent
import com.echomap.edge.ui.theme.DeepNavy
import com.echomap.edge.ui.theme.ErrorRed
import com.echomap.edge.ui.theme.GridLine
import com.echomap.edge.ui.theme.SuccessGreen
import com.echomap.edge.ui.theme.SurfaceCard
import com.echomap.edge.ui.theme.SurfaceDark
import com.echomap.edge.ui.theme.TealAccent
import com.echomap.edge.ui.theme.TextPrimary
import com.echomap.edge.ui.theme.TextSecondary
import com.echomap.edge.ui.theme.WarningOrange
import com.echomap.edge.viewmodel.AudioScanUiState
import com.echomap.edge.viewmodel.AudioScanViewModel
import com.echomap.edge.viewmodel.ScanStatus
import java.util.Locale
import kotlin.math.log10

@Composable
fun LiveScanScreen(
    viewModel: AudioScanViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Runtime permission launcher for RECORD_AUDIO
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        viewModel.onPermissionResult(isGranted)
        if (isGranted) {
            viewModel.startScan()
        }
    }

    // Sync initial permission state on launch
    LaunchedEffect(Unit) {
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        viewModel.onPermissionResult(hasPermission)
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = DeepNavy
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Section
            HeaderSection()

            // Research Disclaimer Banner
            DisclaimerBanner()

            // Audio Status Card
            AudioStatusCard(uiState = uiState)

            // Waveform Display Section
            WaveformSection(uiState = uiState)

            // Signal Statistics Section
            SignalStatisticsCard(uiState = uiState)

            // Scan Control Action Buttons
            ControlActions(
                uiState = uiState,
                onStartScan = {
                    val hasPerm = ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED

                    if (!hasPerm) {
                        viewModel.setRequestingPermission()
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    } else {
                        viewModel.startScan()
                    }
                },
                onCancelScan = { viewModel.cancelScan() },
                onRetry = {
                    viewModel.resetScan()
                    viewModel.startScan()
                }
            )

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun HeaderSection() {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "EchoMap Edge",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary
        )
        Text(
            text = "Phase 1 — Audio Feasibility Prototype",
            style = MaterialTheme.typography.labelSmall,
            color = CyanAccent,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.sp
        )
    }
}

@Composable
private fun DisclaimerBanner() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(GridLine))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(WarningOrange, RoundedCornerShape(3.dp))
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Notice: This phase verifies acoustic playback and recording only. A recorded waveform is not proof of a detected wall or a valid distance measurement.",
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                color = WarningOrange,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun AudioStatusCard(uiState: AudioScanUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "AUDIO STATUS",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            // State indicator
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "System State",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (uiState.isScanning) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(14.dp),
                            strokeWidth = 2.dp,
                            color = CyanAccent
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    val statusText = when (uiState.scanStatus) {
                        is ScanStatus.Ready -> "Ready"
                        is ScanStatus.RequestingPermission -> "Requesting Permission"
                        is ScanStatus.PreparingAudio -> "Synthesizing Chirp..."
                        is ScanStatus.RecordingAndPlaying -> "Emitting & Recording..."
                        is ScanStatus.ProcessingWaveform -> "Analyzing PCM..."
                        is ScanStatus.Completed -> "Scan Completed"
                        is ScanStatus.Failed -> "Scan Failed"
                    }
                    val statusColor = when (uiState.scanStatus) {
                        is ScanStatus.Completed -> SuccessGreen
                        is ScanStatus.Failed -> ErrorRed
                        is ScanStatus.Ready -> TextPrimary
                        else -> CyanAccent
                    }
                    Text(
                        text = statusText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = statusColor,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Divider(modifier = Modifier.padding(vertical = 10.dp), color = GridLine)

            // Permission
            StatusRow(
                label = "Microphone Permission",
                value = if (uiState.hasRecordAudioPermission) "Granted" else "Not Granted",
                valueColor = if (uiState.hasRecordAudioPermission) SuccessGreen else ErrorRed
            )

            // Audio Source
            StatusRow(
                label = "Recording Source",
                value = uiState.audioSourceUsed,
                valueColor = if (uiState.audioSourceUsed == "UNPROCESSED") TealAccent else TextPrimary
            )

            // Sample Rate
            StatusRow(
                label = "Sample Rate",
                value = if (uiState.actualSampleRateHz > 0) "${uiState.actualSampleRateHz} Hz" else "Pending (48 kHz target)"
            )

            // Duration
            StatusRow(
                label = "Recording Window",
                value = if (uiState.recordingDurationMs > 0) "${uiState.recordingDurationMs} ms" else "300 ms (nominal)"
            )
        }
    }
}

@Composable
private fun StatusRow(label: String, value: String, valueColor: Color = TextPrimary) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor,
            fontWeight = FontWeight.Normal
        )
    }
}

@Composable
private fun WaveformSection(uiState: AudioScanUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "RECORDED PCM WAVEFORM",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontWeight = FontWeight.Bold
                )
                if (uiState.waveformSamples.isNotEmpty()) {
                    Text(
                        text = "${uiState.waveformSamples.size} pts",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(DeepNavy, RoundedCornerShape(8.dp))
                    .border(1.dp, GridLine, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                if (uiState.waveformSamples.isEmpty()) {
                    Text(
                        text = "No acoustic data captured yet.\nTap 'Start Acoustic Scan' below to emit chirp.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                } else {
                    WaveformCanvas(
                        samples = uiState.waveformSamples,
                        isClipping = uiState.isClipping
                    )
                }
            }

            if (uiState.waveformSamples.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "0 ms (Pre-roll)", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    Text(text = "Chirp (2–8 kHz)", style = MaterialTheme.typography.labelSmall, color = CyanAccent)
                    Text(text = "${uiState.recordingDurationMs} ms (Tail)", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                }
            }
        }
    }
}

@Composable
private fun WaveformCanvas(
    samples: FloatArray,
    isClipping: Boolean,
    modifier: Modifier = Modifier
) {
    val waveformColor = if (isClipping) WarningOrange else CyanAccent

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 8.dp, vertical = 8.dp)
    ) {
        val width = size.width
        val height = size.height
        val centerY = height / 2f
        val amplitudeScale = (height / 2f) * 0.92f

        // Draw horizontal grid lines (Center baseline and +/- bounds)
        drawLine(
            color = GridLine,
            start = Offset(0f, centerY),
            end = Offset(width, centerY),
            strokeWidth = 1f
        )
        drawLine(
            color = GridLine.copy(alpha = 0.5f),
            start = Offset(0f, centerY - amplitudeScale),
            end = Offset(width, centerY - amplitudeScale),
            strokeWidth = 1f
        )
        drawLine(
            color = GridLine.copy(alpha = 0.5f),
            start = Offset(0f, centerY + amplitudeScale),
            end = Offset(width, centerY + amplitudeScale),
            strokeWidth = 1f
        )

        if (samples.size > 1) {
            val path = Path()
            val dx = width / (samples.size - 1).toFloat()

            for (i in samples.indices) {
                val x = i * dx
                val clamped = samples[i].coerceIn(-1.0f, 1.0f)
                val y = centerY - (clamped * amplitudeScale)

                if (i == 0) {
                    path.moveTo(x, y)
                } else {
                    path.lineTo(x, y)
                }
            }

            drawPath(
                path = path,
                color = waveformColor,
                style = Stroke(width = 1.8f, cap = StrokeCap.Round)
            )
        }
    }
}

@Composable
private fun SignalStatisticsCard(uiState: AudioScanUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "SIGNAL STATISTICS",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            val peakDbfs = if (uiState.peakAmplitudeNormalized > 0f) {
                String.format(Locale.US, "%.1f dBFS", 20.0 * log10(uiState.peakAmplitudeNormalized.toDouble()))
            } else {
                "-Inf dBFS"
            }

            val rmsDbfs = if (uiState.rmsAmplitudeNormalized > 0f) {
                String.format(Locale.US, "%.1f dBFS", 20.0 * log10(uiState.rmsAmplitudeNormalized.toDouble()))
            } else {
                "-Inf dBFS"
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatMetric(
                    title = "Peak Amplitude",
                    value = String.format(Locale.US, "%.3f", uiState.peakAmplitudeNormalized),
                    subtitle = peakDbfs
                )
                StatMetric(
                    title = "RMS Amplitude",
                    value = String.format(Locale.US, "%.3f", uiState.rmsAmplitudeNormalized),
                    subtitle = rmsDbfs
                )
                StatMetric(
                    title = "Peak (PCM-16)",
                    value = uiState.peakAmplitudeRaw.toString(),
                    subtitle = if (uiState.isClipping) "CLIPPING" else "Normal",
                    subtitleColor = if (uiState.isClipping) WarningOrange else SuccessGreen
                )
            }

            if (uiState.isClipping) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Warning: Microphone input approached or exceeded full scale (possible speaker acoustic overdrive). Lower media volume.",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = WarningOrange
                )
            }
        }
    }
}

@Composable
private fun StatMetric(
    title: String,
    value: String,
    subtitle: String,
    subtitleColor: Color = TextSecondary
) {
    Column {
        Text(text = title, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = TextPrimary,
            fontFamily = FontFamily.Monospace
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.labelSmall,
            color = subtitleColor,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
private fun ControlActions(
    uiState: AudioScanUiState,
    onStartScan: () -> Unit,
    onCancelScan: () -> Unit,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Display error message banner if failed
        AnimatedVisibility(visible = uiState.errorMessage != null) {
            uiState.errorMessage?.let { error ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(ErrorRed))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "Audio Failure",
                            style = MaterialTheme.typography.titleMedium.copy(fontSize = 14.sp),
                            color = ErrorRed,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = error,
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                            color = TextPrimary
                        )
                    }
                }
            }
        }

        if (uiState.isScanning) {
            Button(
                onClick = onCancelScan,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "Cancel Acoustic Scan",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
            }
        } else if (uiState.scanStatus is ScanStatus.Failed) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onRetry,
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(text = "Retry", color = CyanAccent)
                }
                Button(
                    onClick = onStartScan,
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "New Scan",
                        color = DeepNavy,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        } else {
            Button(
                onClick = onStartScan,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "Start Acoustic Scan",
                    color = DeepNavy,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
        }
    }
}
