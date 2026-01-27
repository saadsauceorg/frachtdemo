
import React, { useEffect, useRef } from 'react';
import { QuestionnaireAnswers, QuestionId } from '../types';
import { MISSION_ICONS } from '../constants';
import { DictationButton } from './DictationButton';

interface Props {
  id: QuestionId;
  answers: QuestionnaireAnswers;
  onChange: (id: QuestionId, value: any) => void;
}

export const QuestionRenderer: React.FC<Props> = ({ id, answers, onChange }) => {
  const brandBlue = "text-blue-900";
  const baseInputStyle = "w-full bg-white border border-slate-200 rounded-sm p-4 text-sm md:text-base text-slate-900 font-medium focus:border-blue-800 transition-all placeholder-slate-300 outline-none shadow-sm";
  
  // Référence pour stocker le texte intermédiaire de dictée
  const interimTextRef = useRef<{ [key: string]: string }>({});
  
  // Nettoyer le texte intermédiaire quand on change de question
  useEffect(() => {
    return () => {
      // Nettoyer tous les textes intermédiaires au démontage
      interimTextRef.current = {};
    };
  }, [id]);

  switch (id) {
    case 'q1': {
      const options = ["Moins d'un an", "1 à 3 ans", "4 à 7 ans", "8 ans et plus"];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(id, opt)}
              className={`p-5 text-left border-2 rounded-sm text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                answers.q1 === opt 
                  ? 'bg-blue-800 border-blue-800 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    case 'q2': {
      const options = ["Très faible", "Faible", "Modéré", "Élevé", "Très élevé"];
      return (
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(id, opt)}
              className={`p-4 text-center border-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                answers.q2 === opt 
                  ? 'bg-blue-800 border-blue-800 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    case 'q3':
    case 'q12': {
      const value = answers[id] as number;
      const labelMin = id === 'q3' ? "Pas du tout efficace" : "Pas du tout transparent";
      const labelMax = id === 'q3' ? "Très efficace" : "Très transparent";
      return (
        <div className="space-y-6 w-full max-w-sm">
          <div className="flex border-2 border-slate-200 rounded-sm overflow-hidden w-full shadow-sm">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => onChange(id, val)}
                className={`flex-1 h-14 text-sm font-black transition-all border-r-2 last:border-r-0 ${
                  value === val 
                    ? 'bg-blue-800 border-blue-800 text-white' 
                    : 'bg-white border-slate-100 text-slate-300 hover:text-blue-500'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-tight">
            <span className="max-w-[100px]">{labelMin}</span>
            <span className="text-right max-w-[100px]">{labelMax}</span>
          </div>
        </div>
      );
    }

    case 'q4':
    case 'q5': {
      return (
        <div className="space-y-10 w-full max-w-2xl pt-2">
          {[0, 1].map((idx) => {
            const fieldKey = `${id}-${idx}`;
            const currentValue = answers[id][idx] || '';
            const displayValue = interimTextRef.current[fieldKey] !== undefined 
              ? interimTextRef.current[fieldKey] 
              : currentValue;
            
            return (
              <div key={idx} className="group space-y-1">
                <label className={`text-[9px] font-black uppercase tracking-[0.25em] ${brandBlue} group-focus-within:text-blue-600 transition-colors opacity-70`}>
                  AXE DE RÉPONSE N°{idx + 1}
                </label>
                <div className="bg-white rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-2 border-slate-200 group-focus-within:border-blue-800 transition-all overflow-hidden relative">
                  <input
                    type="text"
                    placeholder="Saisissez ici votre contribution stratégique..."
                    value={displayValue}
                    onChange={(e) => {
                      const newVals = [...answers[id]];
                      newVals[idx] = e.target.value;
                      onChange(id, newVals);
                      // Nettoyer le texte intermédiaire si l'utilisateur modifie manuellement
                      delete interimTextRef.current[fieldKey];
                    }}
                    className="w-full bg-white px-5 py-5 pr-10 text-sm md:text-lg text-slate-900 font-medium placeholder-slate-300 outline-none"
                  />
                  <DictationButton
                    onTranscript={(text, isFinal) => {
                      if (isFinal) {
                        // Résultat final : mettre à jour la valeur et nettoyer le texte intermédiaire
                        const newVals = [...answers[id]];
                        newVals[idx] = text;
                        onChange(id, newVals);
                        delete interimTextRef.current[fieldKey];
                      } else {
                        // Résultat intermédiaire : stocker temporairement pour affichage
                        interimTextRef.current[fieldKey] = text;
                        // Forcer le re-render en mettant à jour avec la valeur actuelle
                        const newVals = [...answers[id]];
                        onChange(id, newVals);
                      }
                    }}
                    currentValue={currentValue}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider italic">
                  Vous pouvez corriger le texte avant validation
                </p>
              </div>
            );
          })}
        </div>
      );
    }

    case 'q6': {
      return (
        <div className="space-y-4 w-full max-w-2xl">
           <label className={`text-[9px] font-black uppercase tracking-[0.25em] ${brandBlue} opacity-70`}>
            MOT-CLÉ IDENTITAIRE
          </label>
          <div className="bg-white border-b-2 border-slate-200 focus-within:border-blue-800 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
            <input
              type="text"
              placeholder="Un seul terme synthétique..."
              value={answers.q6}
              onChange={(e) => onChange(id, e.target.value)}
              className="w-full bg-white px-5 py-6 text-2xl md:text-3xl font-bold text-slate-900 uppercase tracking-tight focus:outline-none placeholder-slate-200 transition-colors"
            />
          </div>
          <p className={`text-[10px] font-bold ${brandBlue} opacity-60 leading-relaxed max-w-lg italic`}>
            Aide : Considérez la tonalité institutionnelle, la posture ou la perception globale du syndicat.
          </p>
        </div>
      );
    }

    case 'q7': {
      const list = answers.q7;
      const move = (idx: number, dir: 'up' | 'down') => {
        const newList = [...list];
        const newIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= list.length) return;
        [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
        onChange(id, newList);
      };

      return (
        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((item, idx) => (
              <div 
                key={item} 
                className="group bg-white border-2 border-slate-200 rounded-sm p-4 transition-all hover:border-blue-800 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-800 text-xs font-black text-white rounded-sm shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button 
                        disabled={idx === 0} 
                        onClick={() => move(idx, 'up')} 
                        className="p-1.5 bg-slate-100 hover:bg-blue-800 hover:text-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
                        title="Monter"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button 
                        disabled={idx === list.length - 1} 
                        onClick={() => move(idx, 'down')} 
                        className="p-1.5 bg-slate-100 hover:bg-blue-800 hover:text-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
                        title="Descendre"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="flex-1 text-sm md:text-base font-medium text-slate-900 leading-relaxed pt-1.5">
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider italic">
            Cliquez sur les flèches pour réorganiser par ordre de priorité
          </p>
        </div>
      );
    }

    case 'q8':
    case 'q9':
    case 'q13':
    case 'q14':
    case 'q15': {
      const fieldKey = id;
      const currentValue = id === 'q9' ? answers.q9.mission : (answers[id] as string) || '';
      const displayValue = interimTextRef.current[fieldKey] !== undefined 
        ? interimTextRef.current[fieldKey] 
        : currentValue;
      
      return (
        <div className="space-y-3">
          {id === 'q13' && <span className="inline-block px-2 py-1 bg-blue-50 text-[9px] font-black text-blue-800 uppercase tracking-widest border border-blue-100">Contribution à la Charte</span>}
          <div className="relative">
            <textarea
              rows={6}
              placeholder="Rédigez ici votre réflexion..."
              value={displayValue}
              onChange={(e) => {
                if (id === 'q9') {
                  onChange(id, { ...answers.q9, mission: e.target.value });
                } else {
                  onChange(id, e.target.value);
                }
                // Nettoyer le texte intermédiaire si l'utilisateur modifie manuellement
                delete interimTextRef.current[fieldKey];
              }}
              className={`${baseInputStyle} leading-relaxed w-full max-w-3xl pr-10`}
            />
            <DictationButton
              onTranscript={(text, isFinal) => {
                if (isFinal) {
                  // Résultat final : mettre à jour la valeur
                  if (id === 'q9') {
                    onChange(id, { ...answers.q9, mission: text });
                  } else {
                    onChange(id, text);
                  }
                  delete interimTextRef.current[fieldKey];
                } else {
                  // Résultat intermédiaire : stocker temporairement
                  interimTextRef.current[fieldKey] = text;
                  // Forcer le re-render
                  if (id === 'q9') {
                    onChange(id, { ...answers.q9, mission: answers.q9.mission });
                  } else {
                    onChange(id, answers[id] as string);
                  }
                }
              }}
              currentValue={currentValue}
            />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider italic">
            Vous pouvez corriger le texte avant validation
          </p>
          {id === 'q9' && (
             <div className="flex flex-wrap gap-2 pt-2">
             {MISSION_ICONS.map((m) => (
               <button
                 key={m.id}
                 onClick={() => onChange(id, { ...answers.q9, icon: m.id })}
                 className={`px-3 py-1.5 border-2 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all ${
                   answers.q9.icon === m.id ? 'bg-blue-800 border-blue-800 text-white shadow-md' : 'bg-white border-slate-100 text-slate-300'
                 }`}
               >
                 {m.label}
               </button>
             ))}
           </div>
          )}
        </div>
      );
    }

    case 'q10': {
      const opts = ["Oui, tout à fait", "Assez bien", "Peu efficaces", "Pas du tout efficaces"];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {opts.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(id, opt)}
              className={`p-5 text-left border-2 rounded-sm text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                answers.q10 === opt ? 'bg-blue-800 border-blue-800 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    case 'q11': {
      const cadences = ["Mensuellement", "Trimestriellement", "Semestriellement", "Uniquement si nécessaire"];
      return (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full">
          {cadences.map((c) => (
            <button
              key={c}
              onClick={() => onChange(id, c)}
              className={`px-6 py-4 border-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all flex-1 text-center min-w-[140px] ${
                answers.q11 === c 
                  ? 'bg-blue-800 border-blue-800 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      );
    }

    default: return null;
  }
};
