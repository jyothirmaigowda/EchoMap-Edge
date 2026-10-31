/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 1: Accessibility Companion Home Screen
 * Large touch targets (min 80px), TalkBack semantics, high contrast, clean unboxed metadata.
 */

import React, { useEffect } from 'react';
import { ScreenId } from '../../types';
import { speechService } from '../../services/tts';
import { Eye, BookOpen, Target, Mic, ShieldAlert, ArrowRight, Sparkles, Radio } from 'lucide-react';

interface CompanionHomeProps {
  onNavigate: (screen: ScreenId) => void;
  onQuickSos: () => void;
}

export const CompanionHome: React.FC<CompanionHomeProps> = ({ onNavigate, onQuickSos }) => {
  useEffect(() => {
    speechService.speak(
      'EchoMap Edge Accessibility Companion. Four primary actions available: Describe My Surroundings, Read Text, Find an Object, and Ask About My Surroundings.'
    );
  }, []);

  const handleAction = (screen: ScreenId, label: string) => {
    speechService.triggerHaptic([40]);
    speechService.speak(`Opening ${label}`);
    onNavigate(screen);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Title & Mission Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span>Mode: Accessibility Companion</span>
          <span aria-hidden="true">·</span>
          <span>Offline Edge AI</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Understand Your Surroundings
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Designed specifically for visually impaired and low-vision individuals. Usable with screen readers, TalkBack, and high-contrast voice feedback.
        </p>
      </header>

      {/* 4 Main Accessibility Actions (Generous touch targets >= 80px, high contrast, numbered for TalkBack) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" role="group" aria-label="Accessibility actions">
        {/* 1. Describe My Surroundings */}
        <button
          onClick={() => handleAction('scene_describe', 'Describe My Surroundings')}
          className="group relative min-h-[100px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between gap-4 focus-visible:ring-4 focus-visible:ring-amber-400"
          aria-label="Action 1 of 4: Describe My Surroundings. Tap to capture and hear an on-device scene description."
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Eye className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">01</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Describe My Surroundings
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Identifies doors, chairs, tables, and ground level textures.
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
        </button>

        {/* 2. Read Text (OCR) */}
        <button
          onClick={() => handleAction('text_reader', 'Read Text')}
          className="group relative min-h-[100px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between gap-4 focus-visible:ring-4 focus-visible:ring-amber-400"
          aria-label="Action 2 of 4: Read Text. Tap to point camera at documents or signs and hear text read aloud."
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">02</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Read Text (OCR)
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Recognizes room numbers, exits, documents, and labels.
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
        </button>

        {/* 3. Find an Object */}
        <button
          onClick={() => handleAction('find_object', 'Find an Object')}
          className="group relative min-h-[100px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between gap-4 focus-visible:ring-4 focus-visible:ring-amber-400"
          aria-label="Action 3 of 4: Find an Object. Tap to choose an object and follow an audio beacon."
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">03</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Find an Object
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Auditory tone rises as you point toward doors, chairs, or bags.
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
        </button>

        {/* 4. Ask About My Surroundings */}
        <button
          onClick={() => handleAction('voice_ask', 'Ask About My Surroundings')}
          className="group relative min-h-[100px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between gap-4 focus-visible:ring-4 focus-visible:ring-amber-400"
          aria-label="Action 4 of 5: Ask About My Surroundings. Tap to ask questions using voice or text."
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Mic className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">04</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Ask Surroundings
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Voice question answering based on your current camera view.
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors shrink-0" />
        </button>

        {/* 5. Acoustic Sonar & Room Mapper (Challenge: Ghost Walls & Walking People) */}
        <button
          onClick={() => handleAction('acoustic_mapper', 'Acoustic Sonar and Room Mapper')}
          className="md:col-span-2 group relative min-h-[100px] p-6 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border-2 border-amber-500/40 hover:border-amber-500 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between gap-4 focus-visible:ring-4 focus-visible:ring-amber-400"
          aria-label="Action 5 of 5: Acoustic Sonar and Room Mapper. Phone audio echolocation that filters ghost walls and walking people."
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <Radio className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                  Acoustic Echolocation Radar
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">05</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Acoustic Sonar & Room Mapper
              </h2>
              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300">
                Solves multipath 2nd-order ghost walls, filters out transient walking people from room maps, and auto-calibrates speaker-mic latency.
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>
      </div>

      {/* Accessible Safety Disclaimers */}
      <section
        aria-label="Essential safety disclaimer"
        className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs md:text-sm text-slate-700 dark:text-slate-300 space-y-2"
      >
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          Important Mobility Notice:
        </p>
        <p className="leading-relaxed">
          EchoMap Edge is a secondary sensory companion. It does not replace a white cane, guide dog, or mobility orientation specialist. Never use camera AI to navigate hazardous areas or traffic intersections.
        </p>
      </section>

      {/* Switch to Disaster & Emergency Assist door */}
      <div className="pt-2">
        <button
          onClick={() => onNavigate('emergency')}
          className="w-full min-h-[64px] p-4 rounded-2xl bg-red-600/10 hover:bg-red-600/20 text-red-700 dark:text-red-400 border border-red-500/30 flex items-center justify-between font-bold text-base transition-colors"
          aria-label="Open Disaster and Emergency Assist Dashboard"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <span>Switch to Disaster & Emergency Assist</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
