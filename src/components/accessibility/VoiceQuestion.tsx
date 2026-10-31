/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 1D: Ask About My Surroundings
 * Voice input querying current scene and OCR with truthful uncertainty and text fallback.
 */

import React, { useState } from 'react';
import { sttService } from '../../services/stt';
import { edgeAiService } from '../../services/edgeAi';
import { speechService } from '../../services/tts';
import { SceneAnalysisResult, OcrResult } from '../../types';
import { ArrowLeft, Mic, MicOff, Send, MessageSquare, Volume2, HelpCircle } from 'lucide-react';

interface VoiceQuestionProps {
  onBack: () => void;
  lastScene: SceneAnalysisResult | null;
  lastOcr: OcrResult | null;
}

export const VoiceQuestion: React.FC<VoiceQuestionProps> = ({ onBack, lastScene, lastOcr }) => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: lastScene
        ? `I have your latest capture ready. You can ask: "What objects are in front of me?", "Where is the door?", or "What does the text say?"`
        : 'Welcome. Tap the microphone or type below to ask about your surroundings.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleToggleVoice = () => {
    if (isListening) {
      sttService.stopListening();
      setIsListening(false);
      return;
    }

    speechService.triggerHaptic([40]);
    setIsListening(true);
    speechService.speak('Listening. Ask your question now.');

    sttService.startListening(
      (state) => {
        setInputText(state.transcript);
        if (state.isFinal) {
          setIsListening(false);
          handleAskQuestion(state.transcript);
        }
      },
      (error) => {
        setIsListening(false);
        speechService.speak(`Voice recognition error: ${error}. Please type your question.`);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleAskQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    speechService.triggerHaptic([30]);
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user' as const, text: trimmed, time: userTime };

    // Grounded answer strictly based on current evidence
    const answer = edgeAiService.answerSurroundingsQuestion(trimmed, lastScene, lastOcr);
    const assistantMsg = {
      role: 'assistant' as const,
      text: answer,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversation((prev) => [...prev, userMsg, assistantMsg]);
    setInputText('');

    // Speak aloud response
    speechService.speak(answer, true);
  };

  const handlePresetQuestion = (q: string) => {
    handleAskQuestion(q);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to Companion Menu"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Companion Menu</span>
        </button>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Grounded Voice Q&A · Edge
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Ask About My Surroundings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Speak naturally or type your question. Responses are derived strictly from your active camera data.
        </p>
      </header>

      {/* Suggested Quick Questions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'What objects can you identify?',
            'Where is the door located?',
            'Can you read any signage?',
            'Is the floor ahead clear?',
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetQuestion(preset)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Large Microphone Action */}
      <button
        onClick={handleToggleVoice}
        className={`w-full h-24 md:h-28 rounded-2xl font-bold text-xl md:text-2xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-4 ${
          isListening
            ? 'bg-red-600 text-white animate-pulse'
            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start microphone voice input'}
      >
        {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        <span>{isListening ? 'Listening... Speak now' : 'Hold / Tap to Speak'}</span>
      </button>

      {/* Accessible Text Fallback Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion(inputText);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="question-input" className="sr-only">
          Type a question about your surroundings
        </label>
        <input
          id="question-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Or type your question here..."
          className="flex-1 h-14 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="h-14 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
          aria-label="Send question"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Conversation Thread */}
      <section
        aria-label="Conversation log"
        className="space-y-3 pt-2"
      >
        {conversation.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border ${
              msg.role === 'user'
                ? 'bg-amber-500/10 border-amber-500/20 ml-6 text-slate-900 dark:text-slate-100'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mr-6 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">
                {msg.role === 'user' ? 'You' : 'EchoMap Edge'}
              </span>
              <span>{msg.time}</span>
            </div>
            <p className="text-base leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
