/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Offline-versus-Online Truthful Capability Matrix
 * Exhaustive technical transparency of what works offline vs requires cellular or GPS.
 */

import React from 'react';
import { ArrowLeft, Check, X, AlertTriangle, ShieldCheck, Cpu, Wifi, Smartphone, Radio } from 'lucide-react';

interface CapabilitiesMatrixProps {
  onBack: () => void;
}

interface CapabilityItem {
  feature: string;
  offlineStatus: 'Full Offline' | 'Degraded Offline' | 'Network Required';
  cellularNeeded: boolean;
  gpsHardwareNeeded: boolean;
  modelInstalledNeeded: boolean;
  technicalMechanism: string;
  limitations: string;
}

const MATRIX: CapabilityItem[] = [
  {
    feature: 'Describe My Surroundings',
    offlineStatus: 'Full Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: true,
    technicalMechanism: 'Client-side Sobel edge gradient, contour clustering, & quantized LiteRT feature extractor in memory.',
    limitations: 'Advisory only. Does not guarantee clear travel path or detect transparent glass/drop-offs.',
  },
  {
    feature: 'Read Text (OCR)',
    offlineStatus: 'Full Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: true,
    technicalMechanism: 'Local binarization and optical stroke segmentation running purely in-memory.',
    limitations: 'Requires reasonable illumination; highly stylized artistic fonts may have low confidence.',
  },
  {
    feature: 'Find an Object & Audio Beacon',
    offlineStatus: 'Full Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: true,
    technicalMechanism: 'Edge contour classifier paired with Web Audio API real-time oscillator beacon.',
    limitations: 'Estimates 2D horizontal quadrant alignment only; does not provide millimeter depth.',
  },
  {
    feature: 'Ask About Surroundings',
    offlineStatus: 'Full Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: false,
    technicalMechanism: 'Offline natural language query parser grounded exclusively in active frame detections.',
    limitations: 'Answers only verifiable visual facts in the frame; rejects speculative questions.',
  },
  {
    feature: 'Offline Emergency Guides',
    offlineStatus: 'Full Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: false,
    technicalMechanism: 'Pre-bundled FEMA/Red Cross markdown database stored in local asset storage.',
    limitations: 'Static safety instructions; does not report live emergency broadcast radio frequencies.',
  },
  {
    feature: 'SOS Message Preparation',
    offlineStatus: 'Full Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: false,
    technicalMechanism: 'Local message synthesis with fallback manual indoor location description.',
    limitations: 'Preparation works 100% offline; cellular radio required for actual transmission.',
  },
  {
    feature: 'GPS Location Fix',
    offlineStatus: 'Degraded Offline',
    cellularNeeded: false,
    gpsHardwareNeeded: true,
    modelInstalledNeeded: false,
    technicalMechanism: 'Direct GNSS satellite receiver hardware (works without cell towers if outdoor sky is visible).',
    limitations: 'Times out indoors, basements, or tunnels. Manual location descriptor serves as fallback.',
  },
  {
    feature: 'Emergency SMS Transmission',
    offlineStatus: 'Network Required',
    cellularNeeded: true,
    gpsHardwareNeeded: false,
    modelInstalledNeeded: false,
    technicalMechanism: 'Android TelephonyManager direct SMS or standard mobile OS `sms:` Intent launcher.',
    limitations: 'Requires cellular tower connection or satellite SOS hardware on newer devices.',
  },
];

export const CapabilitiesMatrix: React.FC<CapabilitiesMatrixProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to previous screen"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <span className="text-xs font-mono text-slate-500">
          Hardware & Network Transparency
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Edge Capabilities & Offline Matrix
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Full disclosure of offline independence versus physical hardware or cellular requirements.
        </p>
      </header>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-4 h-4" />
            <span>On-Device AI</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">100% Local</p>
          <p className="text-[11px] text-slate-500">Zero cloud dependency</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Radio className="w-4 h-4" />
            <span>Local Database</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Room / SQLite</p>
          <p className="text-[11px] text-slate-500">Private on device</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Smartphone className="w-4 h-4" />
            <span>Location API</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">GNSS & Manual</p>
          <p className="text-[11px] text-slate-500">With indoor fallback</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <Wifi className="w-4 h-4" />
            <span>Distress SMS</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Cellular Path</p>
          <p className="text-[11px] text-slate-500">Truthful delivery states</p>
        </div>
      </div>

      {/* Exhaustive Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Feature</th>
                <th className="p-3.5">Offline Capability</th>
                <th className="p-3.5">Cellular?</th>
                <th className="p-3.5">GPS Chip?</th>
                <th className="p-3.5">Underlying Mechanism & Safety Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {MATRIX.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {item.feature}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block font-semibold text-xs px-2 py-0.5 rounded-full ${
                        item.offlineStatus === 'Full Offline'
                          ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
                          : item.offlineStatus === 'Degraded Offline'
                          ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60'
                          : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/60'
                      }`}
                    >
                      {item.offlineStatus}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {item.cellularNeeded ? (
                      <span className="text-red-500 font-semibold">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {item.gpsHardwareNeeded ? (
                      <span className="text-amber-500 font-semibold">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-3.5 space-y-1">
                    <p className="text-xs text-slate-800 dark:text-slate-200">{item.technicalMechanism}</p>
                    <p className="text-[11px] text-slate-500 italic">Caution: {item.limitations}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
