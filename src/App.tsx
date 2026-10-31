/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Main Application Architecture
 * Edge AI for Accessibility, Emergency Assistance, and Disaster Preparedness
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, SosAttempt, SceneAnalysisResult, OcrResult, EmergencyContact, EmergencyProfile, UserLocation } from './types';
import { dbService } from './services/db';
import { locationService } from './services/location';
import { smsService } from './services/sms';
import { speechService } from './services/tts';

// Layout & Global Components
import { Navbar } from './components/layout/Navbar';
import { AudioAnnouncer } from './components/layout/AudioAnnouncer';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { MobileConnectModal } from './components/mobile/MobileConnectModal';

// Accessibility Companion Screens
import { CompanionHome } from './components/accessibility/CompanionHome';
import { SceneDescriber } from './components/accessibility/SceneDescriber';
import { TextReader } from './components/accessibility/TextReader';
import { ObjectFinder } from './components/accessibility/ObjectFinder';
import { VoiceQuestion } from './components/accessibility/VoiceQuestion';
import { AcousticMapper } from './components/accessibility/AcousticMapper';

// Emergency Assist Screens
import { EmergencyDashboard } from './components/emergency/EmergencyDashboard';
import { SosConfirmationModal } from './components/emergency/SosConfirmationModal';
import { SosStatusScreen } from './components/emergency/SosStatusScreen';
import { EmergencyContactsManager } from './components/emergency/EmergencyContactsManager';
import { LocationAndProfile } from './components/emergency/LocationAndProfile';
import { OfflineGuides } from './components/emergency/OfflineGuides';
import { EmergencyHistoryView } from './components/emergency/EmergencyHistoryView';

// Transparency & Settings Screens
import { CapabilitiesMatrix } from './components/capabilities/CapabilitiesMatrix';
import { AndroidCodeExporter } from './components/native/AndroidCodeExporter';
import { SettingsAndPrivacy } from './components/settings/SettingsAndPrivacy';

// Icons
import {
  Eye,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Sliders,
  HelpCircle,
  Radio,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showMobileConnect, setShowMobileConnect] = useState<boolean>(false);

  // SOS state
  const [isSosConfirming, setIsSosConfirming] = useState<boolean>(false);
  const [activeSosAttempt, setActiveSosAttempt] = useState<SosAttempt | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation>(locationService.getLastKnown());

  // Memory state for grounding Q&A
  const [lastScene, setLastScene] = useState<SceneAnalysisResult | null>(null);
  const [lastOcr, setLastOcr] = useState<OcrResult | null>(null);

  // Initialize DB and settings
  useEffect(() => {
    async function initApp() {
      try {
        const settings = await dbService.getSettings();
        setTheme(settings.theme || 'dark');
        setIsHighContrast(settings.highContrast || false);
        setIsTestMode(settings.testModeEnabled || false);

        speechService.setSpeechParams(
          settings.speechRate || 1.0,
          settings.speechPitch || 1.0,
          settings.hapticEnabled ?? true,
          settings.audioBeaconsEnabled ?? true
        );

        const [c, p] = await Promise.all([dbService.getContacts(), dbService.getProfile()]);
        setContacts(c);
        setProfile(p);

        // Check if first-time user
        const seenOnboarding = localStorage.getItem('echomap_edge_onboarding');
        if (!seenOnboarding) {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error('App init error:', e);
      }
    }

    initApp();
  }, []);

  // Sync theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync high contrast class
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  // Global SOS Trigger
  const handleQuickSos = () => {
    speechService.triggerHaptic([80, 40, 80]);
    setIsSosConfirming(true);
  };

  const handleConfirmSos = async () => {
    setIsSosConfirming(false);
    speechService.playEmergencyAlarm();

    try {
      const attempt = await smsService.executeSosWorkflow(
        contacts,
        profile,
        'sms_uri_prefilled',
        isTestMode,
        (state, details) => {
          speechService.speak(details);
        }
      );
      setActiveSosAttempt(attempt);
      setCurrentScreen('sos_status');
    } catch (err) {
      console.error('SOS workflow error:', err);
    }
  };

  const handleCancelSos = () => {
    setIsSosConfirming(false);
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('echomap_edge_onboarding', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Universal 3-Zone Navigation Header */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onQuickSos={handleQuickSos}
        onOpenConnectMobile={() => setShowMobileConnect(true)}
      />

      {/* Screen Reader ARIA Live Region & Audio Controller */}
      <AudioAnnouncer />

      {/* Real Mobile Device Connection & PWA Installation Modal */}
      <MobileConnectModal isOpen={showMobileConnect} onClose={() => setShowMobileConnect(false)} />

      {/* Onboarding Dialog if First Run */}
      {showOnboarding && <OnboardingModal onComplete={handleDismissOnboarding} />}

      {/* SOS Accidental Cancellation Countdown Modal */}
      {isSosConfirming && (
        <SosConfirmationModal
          contacts={contacts}
          profile={profile}
          location={locationService.getLastKnown()}
          isTestMode={isTestMode}
          onConfirm={handleConfirmSos}
          onCancel={handleCancelSos}
        />
      )}

      {/* Main Viewport Routing */}
      <main className="flex-1 w-full pb-16">
        {/* SCREEN 1: HOME DASHBOARD (Two Primary Doors) */}
        {currentScreen === 'home' && (
          <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            {/* Mission Kicker */}
            <header className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Privacy-First</span>
                <span aria-hidden="true">·</span>
                <span>On-Device Edge AI</span>
                <span aria-hidden="true">·</span>
                <span>Local Room Database</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                EchoMap Edge
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Understand Your Surroundings. Get Help When It Matters. An offline-first mobile assistant for visually impaired users and disaster preparedness.
              </p>
            </header>

            {/* TWO PRIMARY DOORS: High Contrast, Generous Touch Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* PRIMARY DOOR 1: ACCESSIBILITY COMPANION */}
              <button
                onClick={() => {
                  speechService.triggerHaptic([40]);
                  setCurrentScreen('companion');
                }}
                className="group relative p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-400 text-left shadow-lg hover:shadow-xl transition-all flex flex-col justify-between gap-6 min-h-[260px] focus-visible:ring-4 focus-visible:ring-amber-400"
                aria-label="Door 1 of 2: Accessibility Companion. Camera-based scene understanding, OCR text reader, and object finder."
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Eye className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Primary Mode 1
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Accessibility Companion
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Camera-based edge vision, local OCR text recognition, audio proximity beacons for locating doors or chairs, and grounded voice queries.
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Enter Companion Mode</span>
                  <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* PRIMARY DOOR 2: DISASTER & EMERGENCY ASSIST */}
              <button
                onClick={() => {
                  speechService.triggerHaptic([40]);
                  setCurrentScreen('emergency');
                }}
                className="group relative p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-400 text-left shadow-lg hover:shadow-xl transition-all flex flex-col justify-between gap-6 min-h-[260px] focus-visible:ring-4 focus-visible:ring-red-400"
                aria-label="Door 2 of 2: Disaster and Emergency Assist. Prominent SOS beacon, GPS coordinates, offline disaster guides, and ICE profile."
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-600/15 text-red-600 dark:text-red-500 flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
                      Primary Mode 2
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      Disaster & Emergency Assist
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Prominent SOS trigger with accidental countdown, GPS coordinate telemetry, verified offline earthquake/flood/fire guides, and ICE medical profile.
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Enter Emergency Center</span>
                  <ArrowRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* CHALLENGE SPOTLIGHT: GHOST WALLS & WALKING PEOPLE */}
            <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                  Competition Hurdle Solution · Live Echolocation Radar
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Ghost Walls & Walking People Filter
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  Rejects 2nd-order acoustic multipath echoes, prevents walking pedestrians from corrupting maps, and auto-calibrates speaker-mic latency.
                </p>
              </div>

              <button
                onClick={() => {
                  speechService.triggerHaptic([40]);
                  setCurrentScreen('acoustic_mapper');
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm flex items-center gap-2 shadow shrink-0 transition-transform active:scale-95"
              >
                <span>Launch Acoustic Sonar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* REAL MOBILE HARDWARE PAIRING */}
            <div className="p-6 rounded-3xl bg-blue-600/10 border-2 border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 font-mono">
                  Real Mobile Hardware · Instant Pairing & PWA
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Connect & Run on Real Android Phone</span>
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  Scan QR code with your smartphone camera to run real CameraX, acoustic sonar speaker chirps, hardware microphone, and real SMS dispatch on your device.
                </p>
              </div>

              <button
                onClick={() => {
                  speechService.triggerHaptic([40]);
                  setShowMobileConnect(true);
                }}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center gap-2 shadow shrink-0 transition-transform active:scale-95"
              >
                <span>Scan Mobile QR Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Access Utility Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <button
                onClick={() => setCurrentScreen('offline_guide')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left space-y-1.5 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Offline Survival Guides</span>
                </div>
                <p className="text-xs text-slate-500">
                  Earthquake, flood, fire, and storm emergency survival protocols.
                </p>
              </button>

              <button
                onClick={() => setCurrentScreen('capabilities')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left space-y-1.5 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Offline Capability Matrix</span>
                </div>
                <p className="text-xs text-slate-500">
                  Verify technical mechanics: zero cloud requirement.
                </p>
              </button>

              <button
                onClick={() => setCurrentScreen('native_code')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left space-y-1.5 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <FileCode className="w-4 h-4" />
                  <span>Android Kotlin Source</span>
                </div>
                <p className="text-xs text-slate-500">
                  Inspect runnable Room, CameraX, and LiteRT code.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: ACCESSIBILITY COMPANION HOME */}
        {currentScreen === 'companion' && (
          <CompanionHome
            onNavigate={(s) => setCurrentScreen(s)}
            onQuickSos={handleQuickSos}
          />
        )}

        {/* SCREEN: DESCRIBE MY SURROUNDINGS */}
        {currentScreen === 'scene_describe' && (
          <SceneDescriber
            onBack={() => setCurrentScreen('companion')}
            onAnalysisComplete={(res) => setLastScene(res)}
          />
        )}

        {/* SCREEN: READ TEXT (OCR) */}
        {currentScreen === 'text_reader' && (
          <TextReader
            onBack={() => setCurrentScreen('companion')}
            onOcrComplete={(res) => setLastOcr(res)}
          />
        )}

        {/* SCREEN: FIND AN OBJECT */}
        {currentScreen === 'find_object' && (
          <ObjectFinder onBack={() => setCurrentScreen('companion')} />
        )}

        {/* SCREEN: ASK ABOUT SURROUNDINGS */}
        {currentScreen === 'voice_ask' && (
          <VoiceQuestion
            onBack={() => setCurrentScreen('companion')}
            lastScene={lastScene}
            lastOcr={lastOcr}
          />
        )}

        {/* SCREEN: ACOUSTIC SONAR & ROOM MAPPER (Ghost Walls & Walking People) */}
        {currentScreen === 'acoustic_mapper' && (
          <AcousticMapper
            onBack={() => setCurrentScreen('companion')}
          />
        )}

        {/* SCREEN: EMERGENCY DASHBOARD */}
        {currentScreen === 'emergency' && (
          <EmergencyDashboard
            onNavigate={(s) => setCurrentScreen(s)}
            onTriggerSos={handleQuickSos}
            isTestMode={isTestMode}
            onToggleTestMode={(val) => setIsTestMode(val)}
          />
        )}

        {/* SCREEN: SOS STATUS */}
        {currentScreen === 'sos_status' && activeSosAttempt && (
          <SosStatusScreen
            attempt={activeSosAttempt}
            onRetry={handleQuickSos}
            onDone={() => setCurrentScreen('emergency')}
          />
        )}

        {/* SCREEN: EMERGENCY CONTACTS */}
        {currentScreen === 'contacts' && (
          <EmergencyContactsManager onBack={() => setCurrentScreen('emergency')} />
        )}

        {/* SCREEN: LOCATION & ICE PROFILE */}
        {currentScreen === 'location_profile' && (
          <LocationAndProfile onBack={() => setCurrentScreen('emergency')} />
        )}

        {/* SCREEN: OFFLINE EMERGENCY GUIDES */}
        {currentScreen === 'offline_guide' && (
          <OfflineGuides onBack={() => setCurrentScreen('home')} />
        )}

        {/* SCREEN: EVENT HISTORY */}
        {currentScreen === 'history' && (
          <EmergencyHistoryView onBack={() => setCurrentScreen('emergency')} />
        )}

        {/* SCREEN: CAPABILITIES MATRIX */}
        {currentScreen === 'capabilities' && (
          <CapabilitiesMatrix onBack={() => setCurrentScreen('home')} />
        )}

        {/* SCREEN: ANDROID NATIVE SOURCE CODE */}
        {currentScreen === 'native_code' && (
          <AndroidCodeExporter onBack={() => setCurrentScreen('home')} />
        )}

        {/* SCREEN: SETTINGS & PRIVACY */}
        {currentScreen === 'settings' && (
          <SettingsAndPrivacy
            onBack={() => setCurrentScreen('home')}
            onThemeToggle={(newTheme) => setTheme(newTheme)}
            currentTheme={theme}
            onHighContrastToggle={(hc) => setIsHighContrast(hc)}
            isHighContrast={isHighContrast}
          />
        )}
      </main>

      {/* Quiet Accessible Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EchoMap Edge · On-device Edge AI & Offline Emergency Resilience</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setCurrentScreen('capabilities')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Offline Matrix
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentScreen('native_code')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Android Source Code
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentScreen('settings')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy & Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
