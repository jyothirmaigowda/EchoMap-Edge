/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Location Details & ICE Medical Profile
 * GPS telemetry, manual indoor floor/room location description, and local-first In-Case-of-Emergency profile.
 */

import React, { useState, useEffect } from 'react';
import { UserLocation, EmergencyProfile } from '../../types';
import { dbService } from '../../services/db';
import { locationService } from '../../services/location';
import { speechService } from '../../services/tts';
import {
  ArrowLeft,
  MapPin,
  HeartPulse,
  Save,
  Navigation,
  Compass,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface LocationAndProfileProps {
  onBack: () => void;
}

export const LocationAndProfile: React.FC<LocationAndProfileProps> = ({ onBack }) => {
  const [location, setLocation] = useState<UserLocation>(locationService.getLastKnown());
  const [manualText, setManualText] = useState<string>(location.manualDescription || '');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [savedLocFeedback, setSavedLocFeedback] = useState<boolean>(false);

  // ICE Profile state
  const [profile, setProfile] = useState<EmergencyProfile>({
    fullName: '',
    bloodType: 'Unknown',
    allergies: '',
    medicalConditions: '',
    medications: '',
    mobilityNeeds: 'Visual impairment - relies on sensory cues and white cane',
    emergencyNotes: '',
    updatedAt: Date.now(),
  });
  const [savedProfileFeedback, setSavedProfileFeedback] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    speechService.speak('Location and Emergency Profile. Update your GPS fix, indoor room description, and medical details.');
  }, []);

  const loadData = async () => {
    const prof = await dbService.getProfile();
    setProfile(prof);
    const loc = locationService.getLastKnown();
    setLocation(loc);
    setManualText(loc.manualDescription || '');
  };

  const handleAcquireGps = async () => {
    setIsLocating(true);
    speechService.speak('Requesting fresh GPS coordinates...');
    const res = await locationService.acquireLocation(7000);
    setLocation(res.location);
    setIsLocating(false);

    if (res.status === 'success') {
      speechService.speak(`GPS fix acquired with ${res.location.accuracy} meters accuracy.`);
    } else {
      speechService.speak(`GPS acquisition timed out. Ensure your manual location descriptor is filled.`);
    }
  };

  const handleSaveManualLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = locationService.setManualDescription(manualText);
    setLocation(updated);
    setSavedLocFeedback(true);
    speechService.speak('Manual location description saved.');
    setTimeout(() => setSavedLocFeedback(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: EmergencyProfile = {
      ...profile,
      updatedAt: Date.now(),
    };
    await dbService.saveProfile(updatedProfile);
    setSavedProfileFeedback(true);
    speechService.speak('Emergency profile updated successfully.');
    setTimeout(() => setSavedProfileFeedback(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to Emergency Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Emergency Dashboard</span>
        </button>

        <span className="text-xs font-mono text-slate-500">
          Local Profile · Offline
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Location & Emergency Profile
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure physical location telemetry and medical In-Case-of-Emergency (ICE) parameters.
        </p>
      </header>

      {/* SECTION 1: PHYSICAL LOCATION TELEMETRY */}
      <section
        aria-labelledby="location-telemetry-heading"
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 id="location-telemetry-heading" className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span>Physical Location Telemetry</span>
          </h2>

          <button
            onClick={handleAcquireGps}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600 transition-colors"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Acquiring...' : 'Refresh GPS Fix'}</span>
          </button>
        </div>

        {/* GPS readout */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm space-y-2">
          {location.latitude !== null ? (
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Latitude:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{location.latitude.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Longitude:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{location.longitude?.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horizontal Accuracy:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">±{location.accuracy} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {new Date(location.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No active GPS lock. If you are inside a reinforced concrete building or basement, enter your exact indoor location below.</span>
            </div>
          )}
        </div>

        {/* Manual Indoor Descriptor Form */}
        <form onSubmit={handleSaveManualLocation} className="space-y-2">
          <label htmlFor="manual-loc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Manual Indoor / Floor / Room Descriptor:
          </label>
          <div className="flex gap-2">
            <input
              id="manual-loc"
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="e.g. 2nd Floor, Room 204, West stairwell corridor"
              className="flex-1 h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="px-4 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              {savedLocFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{savedLocFeedback ? 'Saved' : 'Save'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            This description will be included in the SOS message payload if GPS signal is weak.
          </p>
        </form>
      </section>

      {/* SECTION 2: IN-CASE-OF-EMERGENCY (ICE) MEDICAL PROFILE */}
      <section
        aria-labelledby="ice-heading"
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 id="ice-heading" className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-500" />
            <span>In Case of Emergency (ICE) Medical Card</span>
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="full-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                User Full Name:
              </label>
              <input
                id="full-name"
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="e.g. Alex Morgan"
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="blood-type" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Blood Type:
              </label>
              <select
                id="blood-type"
                value={profile.bloodType}
                onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Unknown">Unknown / Not Tested</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="mobility-needs" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mobility & Sensory Assistance Needs (Shared in SOS):
            </label>
            <input
              id="mobility-needs"
              type="text"
              value={profile.mobilityNeeds}
              onChange={(e) => setProfile({ ...profile, mobilityNeeds: e.target.value })}
              placeholder="e.g. Visually impaired, uses guide dog / white cane"
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="allergies" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Severe Allergies:
            </label>
            <input
              id="allergies"
              type="text"
              value={profile.allergies}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Latex, Bee stings"
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="medical-conditions" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chronic Medical Conditions & Critical Medications:
            </label>
            <input
              id="medical-conditions"
              type="text"
              value={profile.medicalConditions}
              onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
              placeholder="e.g. Type 1 Diabetes (requires insulin in grab-bag)"
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {savedProfileFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{savedProfileFeedback ? 'Medical Profile Saved' : 'Save Emergency Profile'}</span>
          </button>
        </form>
      </section>
    </div>
  );
};
