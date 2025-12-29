import { useState, useCallback, useRef, useEffect } from 'react';
import '@/types/speech.d.ts';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let currentTranscript = '';

      // Get all results and combine them
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        currentTranscript += result[0].transcript;

        // Add space between final results
        if (result.isFinal) {
          currentTranscript += ' ';
        }
      }

      console.log('Speech recognition result:', currentTranscript.trim());
      setTranscript(currentTranscript.trim());
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);

      // Don't stop listening on "no-speech" error, just continue
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    console.log('Starting speech recognition...');
    setError(null);
    setTranscript(''); // Clear previous transcript when starting fresh

    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('Speech recognition started successfully');
    } catch (err: any) {
      console.error('Speech recognition start error:', err);
      setError(err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
};
