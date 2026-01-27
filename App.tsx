
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, QuestionnaireAnswers, QuestionId } from './types';
import { SECTIONS, INITIAL_ANSWERS } from './constants';
import { QuestionRenderer } from './components/QuestionRenderer';
import { getUserId, saveResponse, getResponse } from './services/storage';
import AdminDashboard from './components/AdminDashboard';
import { FrachtConsole } from './components/FrachtConsole';
import { Login } from './components/Login';

const GabonFlag = () => (
  <div className="flex flex-col h-3 w-5 overflow-hidden border border-slate-200 rounded-[1px] flex-shrink-0">
    <div className="h-1/3 bg-[#3A7728]"></div>
    <div className="h-1/3 bg-[#FCD116]"></div>
    <div className="h-1/3 bg-[#36A1D4]"></div>
  </div>
);

const App: React.FC = () => {
  // État de connexion
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Tous les Hooks doivent être déclarés AVANT les returns conditionnels
  const [showFrachtConsole, setShowFrachtConsole] = useState(true);
  const [appState, setAppState] = useState<AppState>(AppState.ETHICS_SCREEN);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(INITIAL_ANSWERS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté (session stockée)
  useEffect(() => {
    const authStatus = localStorage.getItem('fracht_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Charger les réponses existantes
  useEffect(() => {
    if (isAuthenticated) {
      const init = async () => {
        const uid = getUserId();
        const existing = await getResponse(uid);
        if (existing) setAnswers(existing);
      };
      init();
    }
  }, [isAuthenticated]);

  // Gérer la connexion
  const handleLogin = () => {
    localStorage.setItem('fracht_authenticated', 'true');
    setIsAuthenticated(true);
  };

  // Si non authentifié, afficher la page de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show Fracht Console by default
  if (showFrachtConsole) {
    return <FrachtConsole />;
  }

  const allQuestionIds = SECTIONS.flatMap(s => s.questions);
  const currentQuestionId = allQuestionIds[currentQuestionIndex] as QuestionId;
  const currentSection = SECTIONS.find(s => s.questions.includes(currentQuestionId));
  const currentSectionIndex = SECTIONS.findIndex(s => s.id === currentSection?.id);

  const handleValueChange = useCallback((id: QuestionId, value: any) => {
    setValidationError(null);
    setAnswers(prev => {
      const next = { ...prev, [id]: value };
      setIsSaving(true);
      saveResponse(getUserId(), next).finally(() => {
        setTimeout(() => setIsSaving(false), 600);
      });
      return next;
    });
  }, []);

  const validate = (): boolean => {
    if (currentQuestionId === 'q5') {
      if (!answers.q5[0]?.trim() && !answers.q5[1]?.trim()) {
        setValidationError("Veuillez renseigner au moins un domaine d'amélioration.");
        return false;
      }
    }
    if (currentQuestionId === 'q6') {
      if (!answers.q6?.trim()) {
        setValidationError("Ce champ est obligatoire pour poursuivre.");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setValidationError(null);
    if (currentQuestionIndex < allQuestionIds.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAppState(AppState.SUBMITTED);
    }
  };

  const prev = () => {
    setValidationError(null);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getSectionFill = (sectionIdx: number) => {
    if (sectionIdx < currentSectionIndex) return 100;
    if (sectionIdx > currentSectionIndex) return 0;
    const section = SECTIONS[sectionIdx];
    const firstQOfSecIdx = allQuestionIds.indexOf(section.questions[0]);
    const questionsInSec = section.questions.length;
    const currentPosInSec = currentQuestionIndex - firstQOfSecIdx;
    return ((currentPosInSec + 1) / questionsInSec) * 100;
  };

  if (appState === AppState.ADMIN) {
    return <AdminDashboard onBack={() => setAppState(AppState.ETHICS_SCREEN)} />;
  }

  if (appState === AppState.ETHICS_SCREEN) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header Institutionnel */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GabonFlag />
              <h1 className="text-[10px] md:text-xs font-black tracking-[0.2em] text-slate-900 uppercase">
                URAI &bull; L’Union des représentants automobiles et industriels
              </h1>
            </div>
          </div>
        </header>

        {/* Corps de page structuré */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white executive-border rounded-sm shadow-2xl overflow-hidden">
            <div className="relative group">
              <img
                src="https://ibvmkhmjgpwwxkngllti.supabase.co/storage/v1/object/public/files/email-cover-urai.png"
                alt="URAI"
                className="w-full h-auto block max-h-[500px] object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
            </div>
            
            <div className="px-8 md:px-16 py-12 md:py-16 flex flex-col items-center space-y-8">
              <div className="w-full space-y-3 text-center">
                <button 
                  onClick={() => setAppState(AppState.QUESTIONNAIRE)}
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold py-5 rounded-sm tracking-[0.25em] uppercase transition-all shadow-lg active:scale-[0.98] transform hover:-translate-y-0.5"
                >
                  Accéder au questionnaire
                </button>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Anonymat & Confidentialité garantis
                </p>
              </div>
              
              <button 
                onClick={() => setShowPasswordPopup(true)} 
                className="text-[9px] text-slate-300 uppercase font-black tracking-[0.2em] hover:text-slate-600 transition-colors"
              >
                Accès Analyste &bull; Supervision
              </button>
            </div>
          </div>
        </main>

        {/* Footer Clôture Visuelle (Une seule ligne) */}
        <footer className="bg-white border-t border-slate-200 py-5 px-6">
          <div className="max-w-5xl mx-auto flex justify-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              © Bureau Exécutif URAI &bull; 2026
            </span>
          </div>
        </footer>

        {/* Popup mot de passe minimal */}
        {showPasswordPopup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPasswordPopup(false);
                setPassword('');
                setPasswordError(false);
              }
            }}
          >
            <div className="bg-white rounded-sm shadow-xl max-w-xs w-full p-5 space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (password === 'JULIEN2026@') {
                        setShowPasswordPopup(false);
                        setPassword('');
                        setPasswordError(false);
                        setAppState(AppState.ADMIN);
                      } else {
                        setPasswordError(true);
                        setPassword('');
                      }
                    }
                  }}
                  placeholder="Mot de passe"
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-black focus:outline-none focus:border-[#1e40af]"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-xs text-red-600">Mot de passe incorrect</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowPasswordPopup(false);
                    setPassword('');
                    setPasswordError(false);
                  }}
                  className="px-4 py-1.5 text-sm text-[#64748b] hover:bg-[#f8fafc] rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (password === 'JULIEN2026@') {
                      setShowPasswordPopup(false);
                      setPassword('');
                      setPasswordError(false);
                      setAppState(AppState.ADMIN);
                    } else {
                      setPasswordError(true);
                      setPassword('');
                    }
                  }}
                  className="px-4 py-1.5 text-sm bg-[#1e40af] text-white rounded hover:bg-[#1e3a8a] transition-colors"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (appState === AppState.SUBMITTED) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white executive-border p-12 text-center space-y-8 shadow-sm">
          <div className="flex justify-center mb-4"><GabonFlag /></div>
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Protocole Clôturé</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">Vos contributions stratégiques ont été transmises avec succès au Bureau Exécutif de l'URAI.</p>
          <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-blue-800 border-b border-blue-800 uppercase tracking-widest">Fermer la session</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 w-full shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-14 gap-4">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4 h-full">
              <GabonFlag />
              <span className="text-[10px] md:text-xs font-black text-slate-900 tracking-tighter">URAI</span>
            </div>
            <div className="flex-1 flex justify-between items-center gap-1 min-w-0">
              {SECTIONS.map((sec, idx) => (
                <div key={sec.id} className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[8px] md:text-[9px] font-black tracking-widest mb-1.5 transition-colors truncate text-center ${idx === currentSectionIndex ? 'text-blue-800' : 'text-slate-300'}`}>
                    {sec.id}
                  </span>
                  <div className="h-0.5 w-full bg-slate-100 overflow-hidden rounded-full">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${idx === currentSectionIndex ? 'bg-blue-800' : 'bg-slate-300'}`}
                      style={{ width: `${getSectionFill(idx)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16 overflow-x-hidden">
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span className="text-slate-900">SECTION {currentSection?.id}</span>
                <span>{currentQuestionIndex + 1} / {allQuestionIds.length}</span>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-tight">{currentSection?.title}</h3>
            </div>
            
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-snug max-w-full break-words">
              {getQuestionText(currentQuestionId)}
            </h2>

            {validationError && (
              <div className="bg-red-50 border-l-2 border-red-600 p-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">{validationError}</p>
              </div>
            )}
          </div>

          <div className="min-h-[200px] w-full">
            <QuestionRenderer 
              id={currentQuestionId} 
              answers={answers} 
              onChange={handleValueChange} 
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white/95 backdrop-blur-md p-4 md:p-6 sticky bottom-0 w-full shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={prev}
            className={`flex-1 md:flex-none px-6 py-4 border-2 border-blue-800 text-blue-800 hover:bg-blue-50 text-[10px] font-bold rounded-sm tracking-widest uppercase transition-all active:scale-95 ${currentQuestionIndex === 0 ? 'invisible' : ''}`}
          >
            Précédent
          </button>
          
          <div className="flex items-center gap-4 flex-1 md:flex-none justify-end">
            {isSaving && <span className="hidden sm:inline text-[9px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">Synchronisation...</span>}
            <button 
              onClick={next}
              className="flex-1 md:flex-none bg-blue-800 hover:bg-blue-900 text-white text-[10px] font-bold px-8 md:px-16 py-4 rounded-sm tracking-widest uppercase transition-all shadow-md active:scale-95"
            >
              {currentQuestionIndex === allQuestionIds.length - 1 ? 'Soumettre le rapport' : 'Suivant'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

function getQuestionText(id: QuestionId): string {
  const map: any = {
    q1: "1. Depuis combien de temps votre entreprise est-elle membre de l'URAI ?",
    q2: "2. Quel est votre niveau d'engagement personnel/celui de votre entreprise dans les activités de l'URAI (réunions, groupes de travail, etc.) ?",
    q3: "3. Dans quelle mesure estimez-vous que l'URAI représente et défend efficacement les intérêts collectifs de ses membres auprès des autorités gabonaises ?",
    q4: "4. Quels sont, selon vous, les deux plus grands succès de l'URAI au cours des 5 dernières années ?",
    q5: "5. Quels sont, selon vous, les deux principaux domaines où l'URAI doit impérativement s'améliorer ou intensifier ses actions ?",
    q6: "6. Si vous deviez résumer l'image actuelle de l'URAI en un mot, quel serait-il ?",
    q7: "7. Veuillez classer par ordre de priorité (1 étant la priorité la plus haute) les domaines d'action suivants pour l'URAI :",
    q8: "8. Quel rôle l'URAI devrait-elle jouer dans la transition vers des véhicules plus écologiques ou l'adoption de normes environnementales au Gabon ?",
    q9: "9. Si vous pouviez ajouter une nouvelle mission cruciale à l'URAI, quelle serait-elle ?",
    q10: "10. Les canaux de communication actuels de l'URAI (e-mails, réunions) sont-ils efficaces pour vous informer et vous consulter ?",
    q11: "11. À quelle fréquence souhaiteriez-vous recevoir des comptes rendus ou des communications de l'URAI sur ses actions ?",
    q12: "12. Comment évaluez-vous l'équité et la transparence dans la prise de décision au sein du Bureau Exécutif de l'URAI ?",
    q13: "13. Avez-vous une proposition spécifique à intégrer dans la future Charte de l'URAI concernant les valeurs, l'éthique ou les engagements des membres ?",
    q14: "14. Quels sont les principaux défis ou menaces qui, selon vous, pèsent actuellement sur le secteur de l'importation et de la distribution de véhicules neufs au Gabon ?",
    q15: "15. Avez-vous d'autres commentaires ou suggestions à faire valoir pour le développement et l'avenir de l'URAI ? (Réponse libre et confidentielle)",
  };
  return map[id] || "";
}

export default App;
