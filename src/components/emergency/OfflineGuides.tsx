/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 3: Offline Emergency Guide & Preparation Checklist
 * Reviewed safety instructions for Earthquakes, Floods, Fires, and Severe Storms.
 * 100% offline-accessible with persistent checklist state in local IndexedDB.
 */

import React, { useState, useEffect } from 'react';
import { EMERGENCY_GUIDES, EmergencyGuide } from '../../data/emergencyGuides';
import { ChecklistItem } from '../../types';
import { dbService } from '../../services/db';
import { speechService } from '../../services/tts';
import {
  ArrowLeft,
  Activity,
  Waves,
  Flame,
  Wind,
  CheckSquare,
  ShieldCheck,
  Volume2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OfflineGuidesProps {
  onBack: () => void;
}

export const OfflineGuides: React.FC<OfflineGuidesProps> = ({ onBack }) => {
  const [selectedGuide, setSelectedGuide] = useState<EmergencyGuide>(EMERGENCY_GUIDES[0]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [activeTab, setActiveTab] = useState<'guides' | 'checklist'>('guides');
  const [expandedSection, setExpandedSection] = useState<'immediate' | 'during' | 'aftermath' | 'sensory'>('immediate');

  useEffect(() => {
    loadChecklist();
    speechService.speak(
      'Offline Emergency Guide. Verified protocols for earthquakes, floods, fires, and storms.'
    );
  }, []);

  const loadChecklist = async () => {
    const items = await dbService.getChecklist();
    setChecklist(items);
  };

  const handleToggleChecklist = async (item: ChecklistItem) => {
    speechService.triggerHaptic([30]);
    const updated = { ...item, isCompleted: !item.isCompleted };
    await dbService.updateChecklistItem(updated);
    speechService.speak(
      `${updated.isCompleted ? 'Marked complete' : 'Marked incomplete'}: ${item.text}`
    );
    await loadChecklist();
  };

  const handleSelectGuide = (guide: EmergencyGuide) => {
    setSelectedGuide(guide);
    speechService.triggerHaptic([30]);
    speechService.speak(`Selected guide: ${guide.title}. ${guide.shortSummary}`);
  };

  const handleSpeakSection = (title: string, items: string[]) => {
    const textToSpeak = `${title}. ${items.join('. ')}`;
    speechService.speak(textToSpeak, true);
  };

  const getGuideIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity':
        return <Activity className="w-5 h-5 text-amber-500" />;
      case 'Waves':
        return <Waves className="w-5 h-5 text-blue-500" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-teal-500" />;
      default:
        return <Activity className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to Emergency Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Offline Guide</span>
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Disaster Preparedness & Guides
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          FEMA and red cross reviewed life-safety protocols. Available with zero cellular signal or internet.
        </p>
      </header>

      {/* Segmented Control: Guides vs Checklist */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('guides')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'guides'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Emergency Protocols
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'checklist'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Go-Bag Checklist ({checklist.filter((c) => c.isCompleted).length}/{checklist.length})
        </button>
      </div>

      {activeTab === 'guides' ? (
        <div className="space-y-6">
          {/* Guide Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {EMERGENCY_GUIDES.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelectGuide(g)}
                className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all ${
                  selectedGuide.id === g.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-transparent shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  {getGuideIcon(g.iconName)}
                  <span className="text-[10px] font-mono opacity-80 uppercase">
                    {g.category.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-xs md:text-sm leading-snug">
                  {g.title.split(' ')[0]}
                </h3>
              </button>
            ))}
          </div>

          {/* Active Guide Content Container */}
          <section
            aria-labelledby="guide-title"
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
          >
            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 font-mono">
                  Source: {selectedGuide.authoritativeSource}
                </span>
                <button
                  onClick={() =>
                    handleSpeakSection(
                      selectedGuide.title,
                      [selectedGuide.shortSummary, ...selectedGuide.immediateActions]
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                  aria-label={`Read ${selectedGuide.title} aloud`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Guide</span>
                </button>
              </div>
              <h2 id="guide-title" className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">
                {selectedGuide.title}
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {selectedGuide.shortSummary}
              </p>
            </div>

            {/* Accordion / Content Sections */}
            <div className="space-y-3">
              {/* 1. Immediate Actions */}
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-red-700 dark:text-red-400 uppercase tracking-wide">
                    1. Immediate Life-Safety Actions
                  </h3>
                  <button
                    onClick={() => handleSpeakSection('Immediate Actions', selectedGuide.immediateActions)}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak</span>
                  </button>
                </div>
                <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
                  {selectedGuide.immediateActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. During the Disaster */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    2. During the Emergency
                  </h3>
                  <button
                    onClick={() => handleSpeakSection('During Emergency', selectedGuide.duringDisaster)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak</span>
                  </button>
                </div>
                <ul className="space-y-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                  {selectedGuide.duringDisaster.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 3. Sensory & Mobility Guidance */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    3. Visually Impaired & Sensory Guidance
                  </h3>
                  <button
                    onClick={() => handleSpeakSection('Sensory Guidance', selectedGuide.sensoryMobilityTips)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak</span>
                  </button>
                </div>
                <ul className="space-y-1.5 text-xs md:text-sm text-slate-800 dark:text-slate-200 list-disc pl-5">
                  {selectedGuide.sensoryMobilityTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>{selectedGuide.criticalDisclaimer}</p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Preparation Go-Bag Checklist */
        <section
          aria-labelledby="checklist-title"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 id="checklist-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              72-Hour Survival & Sensory Go-Bag
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Check off essentials stored in your emergency backpack. Persisted locally on this device.
            </p>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-sm"
              >
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => handleToggleChecklist(item)}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    item.isCompleted
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100 font-medium'
                  }`}
                >
                  {item.text}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  {item.category}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
