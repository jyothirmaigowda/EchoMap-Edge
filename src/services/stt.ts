/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Speech-to-Text (STT) Service
 * Accessible voice question input with browser recognition and accessible text fallback.
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

// Browser API types
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: { error: string }) => void) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
}

export class SpeechToTextService {
  private recognition: IWindowSpeechRecognition | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((state: SpeechRecognitionResultState) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as unknown as { SpeechRecognition?: { new (): IWindowSpeechRecognition } }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: { new (): IWindowSpeechRecognition } }).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          this.recognition = new SpeechRecognitionClass();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const item = event.results[i];
              if (item.isFinal) {
                finalTranscript += item[0].transcript;
              } else {
                interimTranscript += item[0].transcript;
              }
            }

            const current = finalTranscript || interimTranscript;
            if (this.onResultCallback && current) {
              this.onResultCallback({
                transcript: current.trim(),
                isFinal: Boolean(finalTranscript),
              });
            }
          };

          this.recognition.onerror = (event) => {
            console.warn('SpeechRecognition error:', event.error);
            this.isListening = false;
            if (this.onErrorCallback) {
              this.onErrorCallback(event.error);
            }
          };

          this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEndCallback) {
              this.onEndCallback();
            }
          };
        } catch (e) {
          console.warn('SpeechRecognition initialization error:', e);
        }
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onResult: (state: SpeechRecognitionResultState) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser environment. Please use text input.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      onError('Microphone access denied or service unavailable.');
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignored
      }
      this.isListening = false;
    }
  }
}

export const sttService = new SpeechToTextService();
