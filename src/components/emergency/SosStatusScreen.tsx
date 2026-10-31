/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 2C: Truthful SOS Status Screen
 * Reflects real delivery state machine without fabricated delivery claims.
 */

import React from 'react';
import { SosAttempt, SosState } from '../../types';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  Copy,
  MapPin,
  Check,
  Send,
  MessageSquare,
  Share2,
  PhoneCall,
  Phone,
} from 'lucide-react';
import { speechService } from '../../services/tts';
import { smsService } from '../../services/sms';

interface SosStatusScreenProps {
  attempt: SosAttempt;
  onRetry: () => void;
  onDone: () => void;
}

export const SosStatusScreen: React.FC<SosStatusScreenProps> = ({ attempt, onRetry, onDone }) => {
  const [copied, setCopied] = React.useState(false);
  const [shareSuccess, setShareSuccess] = React.useState(false);

  const primaryPhone = attempt.recipientNumbers.length > 0 ? attempt.recipientNumbers[0] : '';
  const smsUri = smsService.buildSmsUri(attempt.recipientNumbers, attempt.messagePayload);
  const whatsappUri = smsService.buildWhatsAppUri(primaryPhone, attempt.messagePayload);
  const telUri = smsService.buildTelUri(primaryPhone);

  const getStateBadge = (state: SosState) => {
    switch (state) {
      case 'opening_messaging_app':
      case 'awaiting_user_to_send':
        return {
          label: 'Awaiting User to Send (In SMS App)',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
          desc: 'Your mobile messaging app has been opened with the emergency text prepared. You must tap the Send arrow in that app to transmit.',
        };
      case 'delivery_report_received':
        return {
          label: 'Delivery Report Confirmed',
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
          desc: 'Cellular carrier receipt acknowledged. The recipient handset received the alert.',
        };
      case 'sent_to_messaging_service':
        return {
          label: 'Sent to Carrier Radio Buffer',
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
          desc: 'Message accepted by mobile telephony stack. Delivery to recipient depends on tower coverage.',
        };
      case 'location_unavailable':
        return {
          label: 'Location Fix Timed Out',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
          desc: 'GPS coordinates unavailable (common indoors). Dispatched with manual/approximate location descriptor.',
        };
      case 'failed':
        return {
          label: 'Dispatch Failed',
          color: 'text-red-500 bg-red-500/10 border-red-500/30',
          desc: 'Carrier error or permission revoked. Please tap Retry or use manual phone dialer.',
        };
      default:
        return {
          label: state.replace(/_/g, ' '),
          color: 'text-slate-400 bg-slate-800 border-slate-700',
          desc: attempt.statusDetails,
        };
    }
  };

  const badgeInfo = getStateBadge(attempt.state);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(attempt.messagePayload);
    setCopied(true);
    speechService.speak('Emergency message text copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Return to Emergency Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          ID: {attempt.id}
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          SOS Transmission Status
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Truthful audit report of your emergency alert attempt.
        </p>
      </header>

      {/* Main Status Hero Card */}
      <div className={`p-6 rounded-3xl border-2 space-y-4 ${badgeInfo.color}`}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8" />
          <div>
            <span className="text-xs uppercase tracking-wider font-bold">Current State</span>
            <h2 className="text-xl md:text-2xl font-black">{badgeInfo.label}</h2>
          </div>
        </div>

        <p className="text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200">
          {badgeInfo.desc}
        </p>
      </div>

      {/* Recipients Audit */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Target Recipients ({attempt.recipientNumbers.length})
        </h3>
        <div className="space-y-2">
          {attempt.recipientNumbers.map((phone, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-sm"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {attempt.recipientNames[i] || 'Contact ' + (i + 1)}
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{phone}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actual Message Payload Sent */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dispatched Text Payload
          </h3>
          <button
            onClick={handleCopyPayload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Payload'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {attempt.messagePayload}
        </div>
      </div>

      {/* Real Multi-Channel Mobile Dispatch Panel */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Send className="w-4 h-4" />
            <span>Send Alert to Phone / Mobile Apps</span>
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">1-Tap Direct</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Tap any pathway below to immediately open your handset's native app with your prefilled GPS emergency alert:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Direct SMS App */}
          <a
            href={smsUri}
            target="_top"
            rel="noopener noreferrer"
            onClick={() => speechService.speak('Opening native SMS messaging application.')}
            className="min-h-[50px] p-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open in SMS App</span>
          </a>

          {/* WhatsApp Direct */}
          <a
            href={whatsappUri}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => speechService.speak('Opening WhatsApp emergency dispatch.')}
            className="min-h-[50px] p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
          >
            <Send className="w-4 h-4" />
            <span>Send via WhatsApp</span>
          </a>

          {/* Native OS Share Sheet */}
          <button
            onClick={async () => {
              const shared = await smsService.triggerNativeShare(
                '🚨 EMERGENCY SOS ALERT - EchoMap Edge',
                attempt.messagePayload
              );
              if (shared) {
                setShareSuccess(true);
                speechService.speak('Android share sheet opened.');
                setTimeout(() => setShareSuccess(false), 3000);
              } else {
                speechService.speak('Sharing unavailable. Message copied to clipboard.');
                handleCopyPayload();
              }
            }}
            className="min-h-[50px] p-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareSuccess ? 'Shared to System' : 'Android Share Sheet'}</span>
          </button>

          {/* Direct Phone Dialer */}
          <a
            href={telUri}
            onClick={() => speechService.speak('Opening telephone dialer.')}
            className="min-h-[50px] p-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Contact / 112</span>
          </a>
        </div>
      </div>

      {/* Action Buttons: Retry or Return */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onRetry}
          className="min-h-[56px] px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-base flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-amber-500" />
          <span>Retry Dispatch</span>
        </button>

        <button
          onClick={onDone}
          className="min-h-[56px] px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span>Return to Dashboard</span>
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 text-center">
        All SOS attempts are logged securely in local-first storage and never shared with commercial analytics.
      </div>
    </div>
  );
};
