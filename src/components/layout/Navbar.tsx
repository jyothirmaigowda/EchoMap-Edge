/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Top Bar adhering to the 3-Zone Contract
 */

import React from 'react';
import { ScreenId } from '../../types';
import { ShieldAlert, Smartphone } from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onQuickSos: () => void;
  onOpenConnectMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate, onQuickSos, onOpenConnectMobile }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onNavigate('home')}
        className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
        aria-label="EchoMap Edge Home"
      >
        EchoMap Edge
      </button>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => onNavigate('companion')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentScreen === 'companion' ||
            currentScreen === 'scene_describe' ||
            currentScreen === 'text_reader' ||
            currentScreen === 'find_object' ||
            currentScreen === 'voice_ask' ||
            currentScreen === 'acoustic_mapper'
              ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-500'
              : ''
          }`}
        >
          Companion
        </button>

        <button
          onClick={() => onNavigate('emergency')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentScreen === 'emergency' || currentScreen === 'sos_confirm' || currentScreen === 'sos_status'
              ? 'text-red-600 dark:text-red-400 font-semibold border-b-2 border-red-500'
              : ''
          }`}
        >
          Disaster SOS
        </button>

        <button
          onClick={() => onNavigate('offline_guide')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentScreen === 'offline_guide'
              ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-500'
              : ''
          }`}
        >
          Offline Guides
        </button>

        <button
          onClick={() => onNavigate('native_code')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentScreen === 'native_code'
              ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-500'
              : ''
          }`}
        >
          Android Source
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentScreen === 'settings' || currentScreen === 'capabilities'
              ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-500'
              : ''
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenConnectMobile}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Connect to Real Mobile Phone via QR Code"
          aria-label="Connect to Real Mobile Phone"
        >
          <Smartphone className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Connect Phone</span>
        </button>

        <button
          onClick={onQuickSos}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label="Trigger Emergency SOS confirmation dialog"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency SOS</span>
        </button>
      </div>
    </header>
  );
};
