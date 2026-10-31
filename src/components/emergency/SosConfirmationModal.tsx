/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 2A: SOS Confirmation Modal
 * Accidental-trigger cancellation countdown (5 seconds), auditory ticking earcon, and immediate override.
 */

import React, { useEffect, useState } from 'react';
import { speechService } from '../../services/tts';
import { EmergencyContact, EmergencyProfile, UserLocation } from '../../types';
import { ShieldAlert, X, Send, AlertTriangle, MapPin, Users } from 'lucide-react';

interface SosConfirmationModalProps {
  contacts: EmergencyContact[];
  profile: EmergencyProfile | null;
  location: UserLocation;
  isTestMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SosConfirmationModal: React.FC<SosConfirmationModalProps> = ({
  contacts,
  profile,
  location,
  isTestMode,
  onConfirm,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState<number>(5);
  const onConfirmRef = React.useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  // Spoken feedback once on mount
  useEffect(() => {
    speechService.speak(
      isTestMode
        ? 'Test emergency drill initiated. Five second cancellation countdown active. Press cancel to abort.'
        : 'Emergency SOS activated. Five second countdown. Press cancel to abort, or send now.'
    );
  }, [isTestMode]);

  // Safe countdown state transition outside render phase
  useEffect(() => {
    if (countdown <= 0) {
      onConfirmRef.current();
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next > 0) {
          speechService.playCountdownTick(next);
        }
        return next;
      });
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [countdown]);

  const handleCancel = () => {
    speechService.triggerHaptic([100]);
    speechService.speak('Emergency alert cancelled.');
    onCancel();
  };

  const handleImmediateSend = () => {
    speechService.triggerHaptic([60, 40, 60]);
    onConfirm();
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-confirm-title"
      aria-describedby="sos-confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-red-600 shadow-2xl p-6 md:p-8 space-y-6 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Circular Countdown Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 id="sos-confirm-title" className="text-xl md:text-2xl font-black text-red-600 dark:text-red-500">
                {isTestMode ? 'TEST DRILL COUNTDOWN' : 'EMERGENCY SOS'}
              </h2>
              <p id="sos-confirm-desc" className="text-xs text-slate-500 dark:text-slate-400">
                Prevent accidental activation
              </p>
            </div>
          </div>

          <div
            className="w-14 h-14 rounded-full border-4 border-red-600 flex items-center justify-center font-black text-2xl text-red-600 dark:text-red-400 font-mono"
            aria-label={`${countdown} seconds remaining before dispatch`}
          >
            {countdown}
          </div>
        </div>

        {/* Dispatch details preview */}
        <div className="space-y-3 text-sm bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4 text-red-500" />
            <span>Recipients: {contacts.length} trusted contact(s)</span>
          </div>
          <div className="pl-6 text-xs text-slate-700 dark:text-slate-300">
            {contacts.length > 0 ? (
              contacts.map((c) => `${c.name} (${c.phone})`).join(', ')
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                No emergency contacts configured yet. Message will open in SMS app for manual entry.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>Location:</span>
          </div>
          <div className="pl-6 text-xs text-slate-700 dark:text-slate-300">
            {location.latitude !== null
              ? `GPS: ${location.latitude.toFixed(4)}, ${location.longitude?.toFixed(4)} (±${location.accuracy}m)`
              : location.manualDescription
              ? `Manual: "${location.manualDescription}"`
              : 'Acquiring GPS fix...'}
          </div>
        </div>

        {/* Large Buttons: Cancel vs Immediate Send */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Cancel Button (Very prominent to easily abort) */}
          <button
            onClick={handleCancel}
            className="min-h-[64px] px-6 py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-lg flex items-center justify-center gap-2 transition-colors focus-visible:ring-4 focus-visible:ring-slate-400"
            aria-label="Cancel emergency alert now"
          >
            <X className="w-6 h-6" />
            <span>Cancel (Abort)</span>
          </button>

          {/* Immediate Send Button */}
          <button
            onClick={handleImmediateSend}
            className="min-h-[64px] px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg focus-visible:ring-4 focus-visible:ring-red-400"
            aria-label="Send emergency alert immediately"
          >
            <Send className="w-6 h-6" />
            <span>Send Now</span>
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
          Accidental activation safeguard. You can cancel at any second during the countdown.
        </p>
      </div>
    </div>
  );
};
