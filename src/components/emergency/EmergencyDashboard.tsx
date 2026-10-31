/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 2: Disaster & Emergency Assist Dashboard
 * Calm, high-contrast, uncluttered emergency center designed for high-stress scenarios.
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, EmergencyContact, UserLocation, EmergencyProfile } from '../../types';
import { dbService } from '../../services/db';
import { locationService } from '../../services/location';
import { speechService } from '../../services/tts';
import {
  ShieldAlert,
  Users,
  MapPin,
  BookOpen,
  FileText,
  History,
  AlertTriangle,
  ArrowRight,
  Send,
  Navigation,
  Compass,
} from 'lucide-react';

interface EmergencyDashboardProps {
  onNavigate: (screen: ScreenId) => void;
  onTriggerSos: () => void;
  isTestMode: boolean;
  onToggleTestMode: (val: boolean) => void;
}

export const EmergencyDashboard: React.FC<EmergencyDashboardProps> = ({
  onNavigate,
  onTriggerSos,
  isTestMode,
  onToggleTestMode,
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [location, setLocation] = useState<UserLocation>(locationService.getLastKnown());
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);

  useEffect(() => {
    loadDashboardData();
    speechService.speak(
      'EchoMap Edge Emergency Dashboard. Prominent SOS button at top. Contacts, location, and offline disaster guides below.'
    );
  }, []);

  const loadDashboardData = async () => {
    const [c, p] = await Promise.all([dbService.getContacts(), dbService.getProfile()]);
    setContacts(c);
    setProfile(p);
  };

  const handleRefreshLocation = async () => {
    setIsLocating(true);
    speechService.speak('Acquiring high accuracy GPS coordinates...');
    const result = await locationService.acquireLocation(6000);
    setLocation(result.location);
    setIsLocating(false);

    if (result.status === 'success') {
      speechService.speak(
        `Location fixed. Accuracy within ${result.location.accuracy} meters.`
      );
    } else {
      speechService.speak(`GPS signal unavailable. You can enter a floor or room description.`);
    }
  };

  const handleTriggerSosClick = () => {
    speechService.triggerHaptic([100, 50, 100]);
    onTriggerSos();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>TEST MODE ACTIVE: SOS actions will run as training drills without emergency alerts.</span>
          </div>
          <button
            onClick={() => onToggleTestMode(false)}
            className="underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
          <span>Mode: Disaster & Emergency Assist</span>
          <span aria-hidden="true">·</span>
          <span>Offline-Ready</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Emergency Command
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
          Calm, immediate access to distress dispatch, verified offline survival protocols, and ICE profile.
        </p>
      </header>

      {/* PROMINENT SOS BUTTON (Center stage, unmissable, high tactile hitbox) */}
      <section aria-label="Emergency Distress Action" className="pt-2">
        <button
          onClick={handleTriggerSosClick}
          className="group relative w-full min-h-[140px] md:min-h-[160px] p-6 rounded-3xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-2xl shadow-red-600/30 transition-all active:scale-[0.99] flex flex-col md:flex-row items-center justify-between gap-4 text-left border-4 border-red-500 focus-visible:ring-4 focus-visible:ring-red-400"
          aria-label={
            isTestMode
              ? 'Trigger SOS Test Drill. Opens 5 second countdown.'
              : 'Trigger Emergency SOS. Opens 5 second safety countdown and alerts emergency contacts.'
          }
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded text-white inline-block">
                {isTestMode ? 'TRAINING DRILL MODE' : 'DISTRESS BEACON'}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                ACTIVATE EMERGENCY SOS
              </h2>
              <p className="text-xs md:text-sm text-red-100 font-medium">
                Tap to prepare alert for {contacts.length} emergency contact(s). Includes 5s safety countdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-red-700 font-black text-base shadow shrink-0 group-hover:bg-red-50 transition-colors">
            <span>START SOS</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </button>
      </section>

      {/* Grid: Location Telemetry & Quick Emergency Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Status Card */}
        <section
          aria-labelledby="location-heading"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="location-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Location Status</span>
            </h2>
            <button
              onClick={handleRefreshLocation}
              disabled={isLocating}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Fixing...' : 'Update GPS'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-xs md:text-sm space-y-1">
            {location.latitude !== null ? (
              <div className="space-y-1">
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {location.latitude.toFixed(5)}, {location.longitude?.toFixed(5)}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  GPS Accuracy: ±{location.accuracy} meters · Source: GPS Sensor
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {location.manualDescription || 'GPS Not Acquired (Indoors/Basement)'}
                </p>
                <p className="text-xs text-slate-500">
                  Tap 'Location & Profile' to set room or floor description.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('location_profile')}
            className="w-full py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5"
          >
            <span>Edit Location & Medical Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Emergency Contacts Widget */}
        <section
          aria-labelledby="contacts-heading"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="contacts-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              <span>Emergency Contacts ({contacts.length})</span>
            </h2>
            <button
              onClick={() => onNavigate('contacts')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-1.5">
            {contacts.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
                No contacts configured. Add trusted family or neighbors.
              </div>
            ) : (
              contacts.slice(0, 2).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{c.phone}</p>
                  </div>
                  {c.isPrimary && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('contacts')}
            className="w-full py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5"
          >
            <span>View All Contacts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>

      {/* Quick Navigation Cards: Guides, History, ICE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* 1. Offline Emergency Guide */}
        <button
          onClick={() => onNavigate('offline_guide')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left space-y-2 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Offline Guides
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Earthquake, flood, fire, and storm emergency survival protocols.
          </p>
        </button>

        {/* 2. Medical Profile (ICE) */}
        <button
          onClick={() => onNavigate('location_profile')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left space-y-2 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            ICE Medical Profile
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Blood type, allergies, medications, and mobility support details.
          </p>
        </button>

        {/* 3. Event History */}
        <button
          onClick={() => onNavigate('history')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left space-y-2 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            SOS Event History
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Audit trail of dispatches, drills, and sensor recordings.
          </p>
        </button>
      </div>

      {/* Switch back to Accessibility Companion door */}
      <div className="pt-2">
        <button
          onClick={() => onNavigate('companion')}
          className="w-full min-h-[56px] p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-between font-semibold text-sm transition-colors"
        >
          <span>Switch to Accessibility Companion Mode</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
