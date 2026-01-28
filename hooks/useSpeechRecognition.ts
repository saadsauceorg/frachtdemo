import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    language = 'fr-FR',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Utiliser useRef pour stabiliser les callbacks et éviter de recréer l'instance
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Vérifier la compatibilité du navigateur et créer l'instance une seule fois
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;
    
    setState(prev => ({ ...prev, isSupported }));

    if (isSupported) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        setState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        if (onResultRef.current) {
          onResultRef.current(fullTranscript.trim(), !!finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = 'Erreur de reconnaissance vocale';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Aucune parole détectée';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone non disponible';
            break;
          case 'not-allowed':
            errorMessage = 'Permission microphone refusée';
            break;
          case 'network':
            errorMessage = 'Erreur réseau';
            break;
          case 'aborted':
            // Arrêt normal, pas d'erreur
            return;
          default:
            errorMessage = `Erreur: ${event.error}`;
        }

        setState(prev => ({ ...prev, isListening: false, error: errorMessage }));
        if (onErrorRef.current) {
          onErrorRef.current(errorMessage);
        }
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (e) {
          // Ignorer les erreurs lors du nettoyage
        }
        recognitionRef.current = null;
      }
    };
  }, [language, continuous, interimResults]); // Ne plus dépendre de onResult et onError

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setState(prev => ({ ...prev, error: 'Reconnaissance vocale non disponible' }));
      return;
    }
    
    if (state.isListening) {
      return; // Déjà en cours
    }
    
    try {
      // Réinitialiser l'erreur avant de démarrer
      setState(prev => ({ ...prev, error: null }));
      recognitionRef.current.start();
    } catch (error: any) {
      // Gérer les erreurs de démarrage
      let errorMessage = 'Impossible de démarrer l\'enregistrement';
      if (error?.message) {
        errorMessage = error.message;
      }
      setState(prev => ({ ...prev, isListening: false, error: errorMessage }));
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    }
  }, [state.isListening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      // Ignorer les erreurs
    }
  }, [state.isListening]);

  const toggle = useCallback(() => {
    if (state.isListening) {
      stop();
    } else {
      start();
    }
  }, [state.isListening, start, stop]);

  return {
    ...state,
    start,
    stop,
    toggle,
  };
};

// Types pour TypeScript
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

