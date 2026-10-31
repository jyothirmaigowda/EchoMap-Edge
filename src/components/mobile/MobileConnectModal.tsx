/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Real Mobile Device Connection & PWA Installation
 * Generates an on-screen QR code and provides direct mobile pairing
 */

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  Download,
  Wifi,
  Radio,
  Camera,
  ShieldAlert,
  Mic,
  Compass,
} from 'lucide-react';
import { speechService } from '../../services/tts';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Determine current active URL
  const mobileUrl = typeof window !== 'undefined'
    ? (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')
        ? 'https://ais-pre-d4adw2e2uvfzmcjqxbl7rp-569285180006.asia-southeast1.run.app'
        : window.location.origin)
    : 'https://ais-pre-d4adw2e2uvfzmcjqxbl7rp-569285180006.asia-southeast1.run.app';

  // Listen for PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Generate QR code
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(mobileUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });

    speechService.speak(
      'Connect to mobile phone opened. Scan the QR code with your smartphone camera to run EchoMap Edge natively on your phone.'
    );
  }, [isOpen, mobileUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    speechService.triggerHaptic([40]);
    speechService.speak('Mobile web app link copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      speechService.speak('To install, open this page in Chrome on Android and tap menu Add to Home Screen.');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
      speechService.speak('EchoMap Edge installation initiated.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-connect-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h2 id="mobile-connect-title" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                Connect to Real Mobile Phone
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run EchoMap Edge directly on Android or iOS hardware
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* QR Code Hero Display */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-md border-4 border-amber-500/30">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code to open EchoMap Edge on smartphone"
                className="w-56 h-56 rounded-lg object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center font-mono text-xs text-slate-400">
                Generating QR Code...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Point your Android or iPhone camera at this QR code
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Opens directly in your mobile browser without app store installation. All offline models run on your phone.
            </p>
          </div>
        </div>

        {/* URL Box & One-Tap Actions */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Live App URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 select-all"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-colors shrink-0 shadow-sm"
              aria-label="Copy mobile link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <a
              href={mobileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              title="Open directly in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Real Mobile Hardware Features Enabled */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Radio className="w-4 h-4" />
            <span>Why run directly on your phone?</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
              <Camera className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Real Camera</strong>: Reads physical surroundings, OCR, and object scanning.
              </span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
              <Mic className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Acoustic Sonar</strong>: Emits real speaker chirps and listens via microphone.
              </span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Real SMS & Calls</strong>: Opens your Android SMS app, WhatsApp, and 911/112 dialer.
              </span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/70 dark:bg-slate-900/70">
              <Compass className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span>
                <strong>Hardware GPS</strong>: High-precision latitude/longitude coordinate fix.
              </span>
            </div>
          </div>
        </div>

        {/* Install as Home Screen PWA */}
        {installPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="w-full min-h-[52px] p-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5 text-amber-500" />
            <span>Install EchoMap Edge to Home Screen</span>
          </button>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
