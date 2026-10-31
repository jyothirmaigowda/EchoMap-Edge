/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 1B: Read Text (OCR)
 * On-device local text recognition engine with spoken readout and word-level inspection.
 * Zero cloud transmission.
 */

import React, { useState, useRef, useEffect } from 'react';
import { edgeAiService } from '../../services/edgeAi';
import { speechService } from '../../services/tts';
import { OcrResult } from '../../types';
import { ArrowLeft, BookOpen, Camera, Volume2, RotateCcw, Copy, Check, FileText } from 'lucide-react';

interface TextReaderProps {
  onBack: () => void;
  onOcrComplete?: (result: OcrResult) => void;
}

export const TextReader: React.FC<TextReaderProps> = ({ onBack, onOcrComplete }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported in this browser.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          speechService.speak('Text Reader active. Position camera over text or signage and tap Capture & Read.');
        }
      } catch (err) {
        if (active) {
          setCameraError('Camera access not granted or unavailable.');
          speechService.speak('Camera not available for text reading. Local sample OCR will be used.');
        }
      }
    }

    initCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCaptureOcr = async () => {
    speechService.triggerHaptic([40]);
    setIsProcessing(true);

    try {
      let sourceElement: HTMLVideoElement | HTMLCanvasElement = videoRef.current!;

      if (!sourceElement || !stream || videoRef.current?.videoWidth === 0) {
        // Fallback canvas with sign text
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 480, 360);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(40, 60, 400, 240);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('EMERGENCY EXIT', 80, 130);

        ctx.fillStyle = '#1e293b';
        ctx.font = '24px sans-serif';
        ctx.fillText('STAIRWELL B - LEVEL 2', 80, 180);
        ctx.fillText('PULL HANDLE TO OPEN', 80, 230);

        sourceElement = canvas;
      }

      const result = await edgeAiService.performOcr(sourceElement);
      setOcrResult(result);
      if (onOcrComplete) {
        onOcrComplete(result);
      }

      if (result.lines.length > 0) {
        speechService.speak(`Text detected: ${result.rawText.replace(/\n/g, '. ')}`, true);
      } else {
        speechService.speak('No legible text recognized. Please check lighting or hold steady.', true);
      }
    } catch (e) {
      console.error('OCR error:', e);
      speechService.speak('OCR engine encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepeat = () => {
    if (ocrResult) {
      speechService.speak(ocrResult.rawText.replace(/\n/g, '. '), true);
    }
  };

  const handleCopyText = () => {
    if (ocrResult?.rawText) {
      navigator.clipboard.writeText(ocrResult.rawText);
      setCopied(true);
      speechService.speak('Text copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to Companion Menu"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Companion Menu</span>
        </button>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Local Edge OCR · Offline
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Read Text (OCR)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Align documents, doorway signs, or prescription labels in the frame and capture.
        </p>
      </header>

      {/* Video Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-[4/3] max-h-[360px] flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center max-w-sm space-y-2 text-slate-400">
            <BookOpen className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-sm text-slate-300">Using simulated offline camera frame with emergency signage.</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Camera frame for text reading"
          />
        )}

        {/* Framing Guide Lines for visually impaired alignment */}
        <div className="absolute inset-8 border-2 border-dashed border-amber-400/50 rounded-xl pointer-events-none flex items-center justify-center">
          <span className="text-[11px] font-semibold text-amber-300/80 bg-slate-950/60 px-2 py-0.5 rounded">
            Text Target Area
          </span>
        </div>
      </div>

      {/* Capture Action */}
      <button
        onClick={handleCaptureOcr}
        disabled={isProcessing}
        className="w-full h-20 md:h-24 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xl md:text-2xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-3 focus-visible:ring-4 focus-visible:ring-amber-300"
        aria-label="Capture and extract text now"
      >
        <Camera className="w-7 h-7" />
        <span>{isProcessing ? 'Reading Text...' : 'Capture & Read'}</span>
      </button>

      {/* OCR Results Display */}
      {ocrResult && (
        <section
          aria-labelledby="ocr-heading"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 id="ocr-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Extracted Text</span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRepeat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Repeat text reading"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Repeat</span>
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Copy extracted text to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-base md:text-lg text-slate-900 dark:text-slate-100 whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
            {ocrResult.rawText}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Lines extracted: {ocrResult.lines.length}</span>
            <span>{ocrResult.processingTimeMs}ms execution</span>
          </div>
        </section>
      )}
    </div>
  );
};
