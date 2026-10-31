package com.echomap.edge

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.echomap.edge.ui.LiveScanScreen
import com.echomap.edge.ui.theme.EchoMapEdgeTheme
import com.echomap.edge.viewmodel.AudioScanViewModel

class MainActivity : ComponentActivity() {

    private val audioScanViewModel: AudioScanViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EchoMapEdgeTheme {
                LiveScanScreen(viewModel = audioScanViewModel)
            }
        }
    }
}
