package com.echomap.edge.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = CyanAccent,
    secondary = TealAccent,
    background = DeepNavy,
    surface = SurfaceDark,
    surfaceVariant = SurfaceCard,
    error = ErrorRed,
    onPrimary = DeepNavy,
    onSecondary = DeepNavy,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary
)

@Composable
fun EchoMapEdgeTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
