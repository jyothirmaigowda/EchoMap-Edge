/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Accessible Spoken Feedback & ARIA Live Controller
 */

import React, { useEffect, useState } from 'react';
import { speechService } from '../../services/tts';
import { Volume2, VolumeX, RotateCcw, Pause, Play } from 'lucide-react';

export const AudioAnnouncer: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsubscribe = speechService.subscribe((speaking, text) => {
      setIsSpeaking(speaking);
      setCurrentText(text);
      if (!speaking) {
        setIsPaused(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRepeat = () => {
    speechService.repeatLast();
  };

  const handleTogglePause = () => {
    if (isPaused) {
      speechService.resume();
      setIsPaused(false);
    } else {
      speechService.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    speechService.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <>
      {/* Offscreen ARIA Live Region for Native TalkBack / Screen Readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {currentText}
      </div>

      {/* Accessible Spoken Feedback Bar when speech is active or recent text exists */}
      {currentText && (
        <aside
          aria-label="Spoken assistant audio bar"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 p-3 bg-slate-900/95 dark:bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="font-semibold text-slate-200">
                {isSpeaking ? (isPaused ? 'Speech Paused' : 'Speaking...') : 'Last Spoken Output'}
              </p>
              <p className="text-slate-400 truncate max-w-[210px]">{currentText}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isSpeaking && (
              <button
                onClick={handleTogglePause}
                title={isPaused ? 'Resume speech' : 'Pause speech'}
                aria-label={isPaused ? 'Resume speech' : 'Pause speech'}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={handleRepeat}
              title="Repeat last speech"
              aria-label="Repeat last speech"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {isSpeaking && (
              <button
                onClick={handleStop}
                title="Stop speaking"
                aria-label="Stop speaking"
                className="w-8 h-8 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </aside>
      )}
    </>
  );
};
