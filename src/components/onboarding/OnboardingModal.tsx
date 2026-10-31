/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Onboarding & Permission Setup Modal
 * Step-by-step accessible introduction explaining camera, speech, location, and SMS permissions.
 */

import React, { useState } from 'react';
import { speechService } from '../../services/tts';
import { ShieldCheck, Eye, ShieldAlert, Camera, MapPin, Check, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);

  const handleNext = () => {
    speechService.triggerHaptic([30]);
    if (step < 3) {
      setStep(step + 1);
      if (step === 1) {
        speechService.speak('Step 2: Permissions and Privacy. Camera, Speech, and Location permissions are kept entirely on-device.');
      } else if (step === 2) {
        speechService.speak('Step 3: Two Primary Modes. Accessibility Companion and Disaster Emergency Assist.');
      }
    } else {
      speechService.speak('Onboarding complete. Welcome to EchoMap Edge.');
      onComplete();
    }
  };

  const handleSkip = () => {
    speechService.triggerHaptic([20]);
    speechService.speak('Welcome to EchoMap Edge.');
    onComplete();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            <span>Step {step} of 3</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <span>Skip</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 id="onboarding-title" className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Welcome to EchoMap Edge
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Understand Your Surroundings. Get Help When It Matters. An offline-first, privacy-conscious Edge AI mobile assistant designed for visually impaired users and disaster situations.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Local-First Guarantee:</p>
              <p>Your camera feeds, location, and emergency data remain strictly on your device.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <h2 id="onboarding-title" className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Sensory Permissions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              EchoMap Edge accesses device hardware strictly on-demand:
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><strong>Camera:</strong> Frame analysis and OCR only upon your explicit tap.</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><strong>Location:</strong> Transmitted only when you confirm an SOS dispatch.</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><strong>Text-to-Speech:</strong> Built-in device voice synthesis for all guidance.</span>
              </li>
            </ul>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 id="onboarding-title" className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Two Primary Modes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">1. Accessibility Companion</p>
                <p className="text-slate-600 dark:text-slate-400">Describe scenes, read signs, and locate objects with audio tones.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-1">
                <p className="font-bold text-red-700 dark:text-red-400 text-sm">2. Disaster & Emergency Assist</p>
                <p className="text-slate-600 dark:text-slate-400">Prominent SOS with 5s cancel countdown, GPS fix, and offline guides.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full ${
                  step === s ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm flex items-center gap-2 shadow"
          >
            <span>{step === 3 ? 'Get Started' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
