/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 1C: Find an Object with Spatial Audio Beacon
 * Locates chosen targets (doors, chairs, tables, bags) with auditory pitch feedback and direction guidance.
 */

import React, { useState, useRef, useEffect } from 'react';
import { edgeAiService } from '../../services/edgeAi';
import { speechService } from '../../services/tts';
import { DetectedObject } from '../../types';
import { ArrowLeft, Target, Volume2, Radio, AlertCircle } from 'lucide-react';

interface ObjectFinderProps {
  onBack: () => void;
}

const COMMON_TARGETS = [
  { label: 'Door / Exit', value: 'door' },
  { label: 'Chair / Seat', value: 'chair' },
  { label: 'Table / Desk', value: 'table' },
  { label: 'Bag / Backpack', value: 'bag' },
  { label: 'Bottle / Drink', value: 'bottle' },
  { label: 'Staircase', value: 'stair' },
];

export const ObjectFinder: React.FC<ObjectFinderProps> = ({ onBack }) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('door');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [guidanceMessage, setGuidanceMessage] = useState<string>('Select an object above and tap Start Tracking.');
  const [matchedObject, setMatchedObject] = useState<DetectedObject | null>(null);
  const [alignment, setAlignment] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingIntervalRef = useRef<number | null>(null);

  // Initialize camera
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch {
        // Handled with canvas simulator
      }
    }

    initCamera();

    return () => {
      active = false;
      if (trackingIntervalRef.current) {
        window.clearInterval(trackingIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStartTracking = () => {
    speechService.triggerHaptic([60]);
    setIsSearching(true);
    speechService.speak(`Searching for ${selectedTarget}. Pan your device slowly around the room.`);

    if (trackingIntervalRef.current) {
      window.clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = window.setInterval(async () => {
      let sourceElement: HTMLVideoElement | HTMLCanvasElement = videoRef.current!;

      if (!sourceElement || !stream || videoRef.current?.videoWidth === 0) {
        // Simulated room canvas
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 320, 240);

        if (selectedTarget.includes('door')) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(130, 30, 60, 180);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(130, 30, 60, 180);
        } else {
          ctx.fillStyle = '#475569';
          ctx.fillRect(110, 100, 60, 50);
        }
        sourceElement = canvas;
      }

      const match = await edgeAiService.findTarget(sourceElement, selectedTarget);
      setAlignment(match.alignmentScore);

      if (match.found && match.object) {
        setMatchedObject(match.object);
        setGuidanceMessage(match.guidance);

        // Sound audio beacon!
        speechService.playObjectBeacon(match.alignmentScore);
      } else {
        setMatchedObject(null);
        setGuidanceMessage(`Searching for ${selectedTarget}... pan slowly.`);
      }
    }, 700);
  };

  const handleStopTracking = () => {
    if (trackingIntervalRef.current) {
      window.clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsSearching(false);
    speechService.speak('Object tracking paused.');
  };

  const handleSelectTarget = (targetVal: string, targetLabel: string) => {
    setSelectedTarget(targetVal);
    speechService.speak(`Selected target: ${targetLabel}`);
    if (isSearching) {
      handleStopTracking();
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

        <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Spatial Audio Beacon Active</span>
        </div>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Find an Object
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select target. An audio tone rises in pitch and pulses faster as you point toward the object.
        </p>
      </header>

      {/* Target Selector Grid */}
      <section aria-labelledby="target-selection" className="space-y-2">
        <h2 id="target-selection" className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
          Choose Target Object
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {COMMON_TARGETS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleSelectTarget(t.value, t.label)}
              className={`min-h-[52px] p-3 rounded-xl font-semibold text-sm text-left transition-all border ${
                selectedTarget === t.value
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-2 ring-amber-400/50'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Video Viewport with Target Reticle */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-[4/3] max-h-[340px] flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Object finder camera preview"
        />

        {/* Reticle Guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-24 h-24 rounded-full border-2 transition-all flex items-center justify-center ${
              alignment > 0.7
                ? 'border-emerald-400 bg-emerald-500/20 scale-110'
                : alignment > 0.3
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-500/50'
            }`}
          >
            <Target className="w-8 h-8 text-white/70" />
          </div>
        </div>

        {/* Status banner */}
        <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md text-white border border-slate-700 text-xs flex items-center justify-between">
          <span className="font-medium truncate">{guidanceMessage}</span>
          <span className="font-mono text-amber-400 shrink-0">
            {alignment > 0 ? `${Math.round(alignment * 100)}% align` : 'Scanning'}
          </span>
        </div>
      </div>

      {/* Start / Stop Tracking Toggle */}
      <button
        onClick={isSearching ? handleStopTracking : handleStartTracking}
        className={`w-full h-20 md:h-24 rounded-2xl font-bold text-xl md:text-2xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-3 ${
          isSearching
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
        }`}
        aria-label={isSearching ? 'Stop tracking target object' : `Start finding ${selectedTarget}`}
      >
        <Radio className="w-7 h-7" />
        <span>{isSearching ? 'Pause Tracking' : `Start Finding ${selectedTarget}`}</span>
      </button>

      {/* Spoken Guidance Card */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <Volume2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-slate-800 dark:text-slate-200">
          <p className="font-semibold">How Audio Beacon Works:</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Listen with headphones or speaker. As the target aligns with the center of your phone, the pitch will rise from low to high. When you hear the high chime, the target is directly ahead.
          </p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p>
          Audio guidance estimates horizontal direction only. It does not measure ground hazards or sudden drop-offs. Move slowly with a cane.
        </p>
      </div>
    </div>
  );
};
