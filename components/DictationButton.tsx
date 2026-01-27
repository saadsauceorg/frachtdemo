import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface DictationButtonProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  currentValue: string;
  disabled?: boolean;
}

export const DictationButton: React.FC<DictationButtonProps> = ({
  onTranscript,
  currentValue,
  disabled = false,
}) => {
  const { isListening, isSupported, error, toggle, stop } = useSpeechRecognition({
    language: 'fr-FR',
    continuous: true,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        // Pour les résultats finaux, ajouter au texte existant
        const newText = currentValue ? `${currentValue} ${transcript}` : transcript;
        onTranscript(newText, true);
      } else {
        // Pour les résultats intermédiaires, remplacer temporairement
        const baseText = currentValue || '';
        onTranscript(baseText + ' ' + transcript, false);
      }
    },
    onError: (errorMessage) => {
      // Afficher l'erreur dans la console pour le débogage
      console.error('Erreur de reconnaissance vocale:', errorMessage);
    },
  });

  // Arrêter la dictée si le composant est désactivé
  React.useEffect(() => {
    if (disabled && isListening) {
      stop();
    }
  }, [disabled, isListening, stop]);

  if (!isSupported) {
    return null; // Masquer l'icône si non supporté
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && isSupported) {
      toggle();
    }
  };

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          text-slate-900 hover:text-slate-700
          transition-all cursor-pointer flex flex-col items-center justify-center gap-1
          ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
          ${isListening ? 'text-red-600 animate-pulse' : ''}
        `}
        title={error ? error : (isListening ? 'Arrêter la dictée' : 'Démarrer la dictée')}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={isListening ? 'animate-pulse' : ''}
        >
          {isListening ? (
            // Icône microphone avec animation (ondes)
            <>
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" className="animate-ping" />
              <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
              <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12V10H19Z" fill="currentColor"/>
            </>
          ) : (
            // Icône microphone normale
            <>
              <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
              <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12V10H19Z" fill="currentColor"/>
              <path d="M11 22H13V24H11V22Z" fill="currentColor"/>
            </>
          )}
        </svg>
        <span className={`text-[8px] font-bold uppercase tracking-wider leading-none ${
          isListening ? 'text-red-600' : 'text-slate-600'
        }`}>
          {isListening ? 'Arrêter' : 'Parler'}
        </span>
      </button>
      {error && (
        <span className="text-[7px] text-red-600 font-bold uppercase tracking-wider max-w-[80px] text-right">
          {error}
        </span>
      )}
    </div>
  );
};

