/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Settings & Data Privacy Controls
 * Speech rate, high contrast accessibility mode, haptic triggers, and complete data wipe.
 */

import React, { useState, useEffect } from 'react';
import { UserSettings } from '../../types';
import { dbService } from '../../services/db';
import { speechService } from '../../services/tts';
import {
  ArrowLeft,
  Volume2,
  Eye,
  Vibrate,
  ShieldCheck,
  Trash2,
  Download,
  AlertTriangle,
  Check,
  Moon,
  Sun,
  Radio,
} from 'lucide-react';

interface SettingsAndPrivacyProps {
  onBack: () => void;
  onThemeToggle: (theme: 'dark' | 'light') => void;
  currentTheme: 'dark' | 'light';
  onHighContrastToggle: (enabled: boolean) => void;
  isHighContrast: boolean;
}

export const SettingsAndPrivacy: React.FC<SettingsAndPrivacyProps> = ({
  onBack,
  onThemeToggle,
  currentTheme,
  onHighContrastToggle,
  isHighContrast,
}) => {
  const [settings, setSettings] = useState<UserSettings>({
    highContrast: isHighContrast,
    speechRate: 1.0,
    speechPitch: 1.0,
    hapticEnabled: true,
    audioBeaconsEnabled: true,
    largeText: true,
    testModeEnabled: false,
    emergencyNumberDefault: '911',
    smsPathwayPreference: 'prefilled',
    autoSpeakResults: true,
    theme: currentTheme,
  });

  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
    speechService.speak('Settings and Privacy. Adjust voice speed, high contrast visual mode, and data autonomy.');
  }, []);

  const loadSettings = async () => {
    const s = await dbService.getSettings();
    setSettings(s);
  };

  const handleUpdate = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await dbService.saveSettings(updated);

    speechService.setSpeechParams(
      updated.speechRate,
      updated.speechPitch,
      updated.hapticEnabled,
      updated.audioBeaconsEnabled
    );

    if (partial.highContrast !== undefined) {
      onHighContrastToggle(partial.highContrast);
    }
    if (partial.theme !== undefined) {
      onThemeToggle(partial.theme);
    }

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleTestSpeech = () => {
    speechService.speak(
      `EchoMap Edge voice testing at ${settings.speechRate.toFixed(1)} times normal speed.`,
      true
    );
  };

  const handleWipeAll = async () => {
    await dbService.wipeAllData();
    setShowWipeConfirm(false);
    speechService.speak('All local user data, contacts, and logs have been wiped from device.');
    await loadSettings();
  };

  const handleExportData = async () => {
    const jsonStr = await dbService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echomap-edge-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    speechService.speak('Local data exported.');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        {savedFeedback && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences saved</span>
          </span>
        )}
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Settings & Privacy Autonomy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Customize speech speed, audio beacons, visual themes, and local SQLite data lifecycle.
        </p>
      </header>

      {/* ACCESSIBILITY & AUDIO SETTINGS */}
      <section
        aria-labelledby="audio-settings"
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <h2 id="audio-settings" className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-500" />
          <span>Speech & Audio Feedback</span>
        </h2>

        {/* Speech Rate Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="speech-rate-slider" className="font-semibold text-slate-700 dark:text-slate-300">
              Spoken Speech Rate ({settings.speechRate.toFixed(1)}x):
            </label>
            <button
              onClick={handleTestSpeech}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Test Voice
            </button>
          </div>
          <input
            id="speech-rate-slider"
            type="range"
            min="0.7"
            max="1.6"
            step="0.1"
            value={settings.speechRate}
            onChange={(e) => handleUpdate({ speechRate: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0.7x (Slower)</span>
            <span>1.0x (Standard)</span>
            <span>1.6x (Faster for screen reader pros)</span>
          </div>
        </div>

        {/* Audio Beacon Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Spatial Audio Proximity Beacon
            </p>
            <p className="text-xs text-slate-500">
              Produces rising pitch tone when target object aligns in camera center.
            </p>
          </div>
          <button
            onClick={() => handleUpdate({ audioBeaconsEnabled: !settings.audioBeaconsEnabled })}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
              settings.audioBeaconsEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle audio beacon"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.audioBeaconsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Haptic Vibration Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Tactile Haptic Vibration
            </p>
            <p className="text-xs text-slate-500">
              Physical buzz feedback on button clicks, countdown ticks, and beacons.
            </p>
          </div>
          <button
            onClick={() => handleUpdate({ hapticEnabled: !settings.hapticEnabled })}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
              settings.hapticEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle haptic feedback"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.hapticEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* VISUAL & CONTRAST SETTINGS */}
      <section
        aria-labelledby="visual-settings"
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <h2 id="visual-settings" className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-500" />
          <span>Visual & Contrast Display</span>
        </h2>

        {/* High Contrast Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Ultra High Contrast Mode
            </p>
            <p className="text-xs text-slate-500">
              Increases borders, solidifies outlines, and sharpens text for low-vision users.
            </p>
          </div>
          <button
            onClick={() => handleUpdate({ highContrast: !settings.highContrast })}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
              settings.highContrast ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle ultra high contrast"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.highContrast ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Color Theme
            </p>
            <p className="text-xs text-slate-500">
              Toggle between deep dark mode and crisp daylight mode.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => handleUpdate({ theme: 'dark' })}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                settings.theme === 'dark'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => handleUpdate({ theme: 'light' })}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                settings.theme === 'light'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </section>

      {/* DATA PRIVACY & AUTONOMY (Local Storage Controls) */}
      <section
        aria-labelledby="privacy-settings"
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <h2 id="privacy-settings" className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>Local Data Autonomy & Privacy</span>
        </h2>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Zero Cloud Analytics:</p>
          <p>
            EchoMap Edge operates on local-first principles. Your medical profile, emergency contacts, camera frames, and SOS logs never leave this device. Camera frames are processed transiently in RAM and discarded immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Export Database (JSON)</span>
          </button>

          <button
            onClick={() => setShowWipeConfirm(true)}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe All Local Data</span>
          </button>
        </div>

        {showWipeConfirm && (
          <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 space-y-3">
            <p className="text-xs font-bold text-red-600 dark:text-red-400">
              Are you sure? This will delete all emergency contacts, SOS attempts, and medical profiles from local storage.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleWipeAll}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-xs"
              >
                Yes, Wipe Everything
              </button>
              <button
                onClick={() => setShowWipeConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
