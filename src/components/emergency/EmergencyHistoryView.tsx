/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 2: Local Emergency Event History & SOS Attempts
 * Inspectable, timestamped audit log of all dispatches, drills, and location recordings stored locally.
 */

import React, { useState, useEffect } from 'react';
import { SosAttempt, EmergencyEvent } from '../../types';
import { dbService } from '../../services/db';
import { speechService } from '../../services/tts';
import { ArrowLeft, History, ShieldAlert, CheckCircle2, Clock, MapPin, Trash2, Download } from 'lucide-react';

interface EmergencyHistoryViewProps {
  onBack: () => void;
}

export const EmergencyHistoryView: React.FC<EmergencyHistoryViewProps> = ({ onBack }) => {
  const [attempts, setAttempts] = useState<SosAttempt[]>([]);
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [viewTab, setViewTab] = useState<'attempts' | 'audit'>('attempts');

  useEffect(() => {
    loadHistory();
    speechService.speak('Emergency History and audit log. Review previous alerts and recordings.');
  }, []);

  const loadHistory = async () => {
    const [att, ev] = await Promise.all([
      dbService.getSosAttempts(),
      dbService.getEmergencyEvents(),
    ]);
    setAttempts(att);
    setEvents(ev);
  };

  const handleExportJson = async () => {
    const jsonStr = await dbService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echomap-edge-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    speechService.speak('Local database exported as JSON.');
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

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log</span>
        </button>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Emergency Event History
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Cryptographically timestamped local records of all SOS triggers, drills, and sensor captures.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs">
        <button
          onClick={() => setViewTab('attempts')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewTab === 'attempts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          SOS Attempts ({attempts.length})
        </button>
        <button
          onClick={() => setViewTab('audit')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewTab === 'audit'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          All Events ({events.length})
        </button>
      </div>

      {viewTab === 'attempts' ? (
        <section aria-label="SOS Attempts History" className="space-y-3">
          {attempts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
              <History className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No SOS attempts on record.</p>
              <p className="text-xs">Any emergency alert or test drill performed will be recorded here.</p>
            </div>
          ) : (
            attempts.map((att) => (
              <div
                key={att.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`w-5 h-5 ${
                        att.triggerType === 'test_mode' ? 'text-amber-500' : 'text-red-500'
                      }`}
                    />
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {att.triggerType === 'test_mode' ? 'Training Drill SOS' : 'Emergency SOS Alert'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {new Date(att.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">State: </span>
                    <span className="font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {att.state.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pathway: </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{att.pathwayUsed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Recipients: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {att.recipientNames.join(', ') || 'Manual phone composer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Location Fix: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {att.location.latitude !== null
                        ? `GPS (±${att.location.accuracy}m)`
                        : att.location.manualDescription || 'Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 line-clamp-2">
                  "{att.messagePayload}"
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        <section aria-label="System Event Audit Trail" className="space-y-2">
          {events.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
              <p>No audit events logged yet.</p>
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{evt.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {evt.severity}
                    </span>
                  </div>
                  <p className="text-slate-500">{evt.summary}</p>
                </div>
                <span className="font-mono text-slate-400 shrink-0 ml-4">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
};
