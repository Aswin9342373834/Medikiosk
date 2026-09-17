'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTranslation, normalizeLanguageCode } from '../contexts/LanguageContext';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
  autoStopMs?: number;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  language: propLang,
  placeholder,
  className = '',
  autoStopMs = 8000
}) => {
  const { t, language: contextLang, speechLang } = useTranslation();
  
  // Use prop language if supplied, otherwise context
  const activeCode = normalizeLanguageCode(propLang || contextLang);
  const activeSpeechCode = (
    activeCode === 'ta' ? 'ta-IN' : activeCode === 'hi' ? 'hi-IN' : 'en-IN'
  );

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [captured, setCaptured] = useState<boolean>(false);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeSpeechCode;

      recognition.onstart = () => {
        setIsListening(true);
        setCaptured(false);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i][0];
          if (item && item.transcript) {
            currentTranscript += item.transcript;
          }
        }
        if (currentTranscript.trim()) {
          setLiveTranscript(currentTranscript);
          onTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[WebSpeech API] Event error or silence:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (liveTranscript.trim()) {
          setCaptured(true);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeSpeechCode, onTranscript]);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      if (liveTranscript.trim()) setCaptured(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setLiveTranscript('');
      setCaptured(false);
      try {
        recognitionRef.current.lang = activeSpeechCode;
        recognitionRef.current.start();
        setIsListening(true);

        timerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }
          setIsListening(false);
          if (liveTranscript.trim()) setCaptured(true);
        }, autoStopMs);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const resetRecording = () => {
    setLiveTranscript('');
    setCaptured(false);
    onTranscript('');
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3 text-xs sm:text-sm ${className}`}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {t('clinicalHistory.touchOptions')}
          </p>
          <p className="text-amber-700 text-xs">
            {activeCode === 'ta'
              ? 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. தயவுசெய்து தொடுதிரை தேர்வுகளைப் பயன்படுத்தவும் அல்லது தட்டச்சு செய்யவும்.'
              : activeCode === 'hi'
              ? 'इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया टच विकल्पों का उपयोग करें या टाइप करें।'
              : 'Voice recognition is not supported in this browser. Please use the touch options or type your response.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-xs ${
            isListening
              ? 'bg-red-600 text-white animate-pulse hover:bg-red-700 shadow-md ring-4 ring-red-200'
              : 'bg-hospital-50 text-hospital-800 border-2 border-hospital-600 hover:bg-hospital-100 hover:border-hospital-700'
          }`}
          title={isListening ? t('common.stopSpeaking') : t('common.tapToSpeak')}
          aria-label={isListening ? t('common.stopSpeaking') : t('common.tapToSpeak')}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>{t('common.stopSpeaking')}</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-hospital-700" />
              <span>{t('common.tapToSpeak')} ({activeSpeechCode})</span>
            </>
          )}
        </button>

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-red-600 font-bold animate-pulse">
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            <span>{t('common.listening')}</span>
          </div>
        )}

        {captured && liveTranscript && !isListening && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('common.answerCaptured')}</span>
            <button
              type="button"
              onClick={resetRecording}
              className="ml-2 underline text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('common.recordAgain')}</span>
            </button>
          </div>
        )}
      </div>

      {liveTranscript && (
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-sm text-slate-900">
          <span className="text-xs font-bold uppercase text-blue-700 block mb-1">
            {t('common.answerCaptured')} ({activeSpeechCode}):
          </span>
          <p className="italic font-medium">"{liveTranscript}"</p>
        </div>
      )}
    </div>
  );
};
