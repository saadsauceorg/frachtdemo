import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getAllResponses, deleteResponse } from '../services/storage';
import { QuestionnaireAnswers } from '../types';
import { INITIAL_ANSWERS } from '../constants';

interface Props {
  onBack: () => void;
}

const Q7_DOMAINS = INITIAL_ANSWERS.q7;

// Fonction pour calculer la médiane
const getMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

// Fonction pour calculer la distribution
const getDistribution = (values: (number | null)[]): { value: number; count: number }[] => {
  const counts: { [key: number]: number } = {};
  values.forEach(v => {
    if (v !== null && v !== undefined) {
      counts[v] = (counts[v] || 0) + 1;
    }
  });
  return [1, 2, 3, 4, 5].map(v => ({ value: v, count: counts[v] || 0 }));
};

const AdminDashboard: React.FC<Props> = ({ onBack }) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    const res = await getAllResponses();
    setResponses(res);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (responseId: string) => {
    setIsDeleting(true);
    const { error } = await deleteResponse(responseId);
    setIsDeleting(false);
    setDeleteConfirmId(null);
    if (error) {
      alert('Erreur lors de la suppression');
      return;
    }
    await fetchData();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseInsights = (answers: QuestionnaireAnswers) => {
    const insights: string[] = [];
    
    if (answers.q3 !== null && answers.q3 !== undefined) {
      insights.push(`Efficacité: ${answers.q3}/5`);
    }
    
    if (answers.q6 && answers.q6.trim()) {
      insights.push(`Image: "${answers.q6}"`);
    }
    
    if (answers.q4 && answers.q4.length > 0 && answers.q4[0]?.trim()) {
      const firstSuccess = answers.q4[0].substring(0, 50);
      insights.push(`Succès: ${firstSuccess}${firstSuccess.length >= 50 ? '...' : ''}`);
    }
    
    if (answers.q5 && answers.q5.length > 0 && answers.q5[0]?.trim()) {
      const firstImprovement = answers.q5[0].substring(0, 50);
      insights.push(`Amélioration: ${firstImprovement}${firstImprovement.length >= 50 ? '...' : ''}`);
    }

    if (answers.q12 !== null && answers.q12 !== undefined) {
      insights.push(`Transparence: ${answers.q12}/5`);
    }

    return insights;
  };

  if (responses.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-[#1e293b] text-lg">Chargement des contributions...</p>
      </div>
    );
  }

  const allAnswers = responses.map(r => r.answers_json as QuestionnaireAnswers);

  // Calculs pour Page 1
  const q3Values = allAnswers.map(a => a.q3).filter(v => v !== null) as number[];
  const q12Values = allAnswers.map(a => a.q12).filter(v => v !== null) as number[];
  const q3Median = q3Values.length > 0 ? getMedian(q3Values) : null;
  const q12Median = q12Values.length > 0 ? getMedian(q12Values) : null;
  const q3Dist = getDistribution(allAnswers.map(a => a.q3));
  const q12Dist = getDistribution(allAnswers.map(a => a.q12));

  // Q6 - Mots cités
  const q6Words = allAnswers
    .map(a => a.q6?.trim())
    .filter(w => w && w.length > 0);

  // Q7 - Priorités
  const q7Priorities: { domain: string; positions: number[]; avg: number }[] = Q7_DOMAINS.map(domain => {
    const positions: number[] = [];
    allAnswers.forEach(answer => {
      const index = answer.q7?.indexOf(domain);
      if (index !== undefined && index !== -1) {
        positions.push(index + 1); // Position 1-6
      }
    });
    const avg = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : 0;
    return { domain, positions, avg };
  });
  q7Priorities.sort((a, b) => a.avg - b.avg); // Plus petit = plus prioritaire
  const top3Priorities = q7Priorities.slice(0, 3).map(p => p.domain);

  // Q4 - Succès
  const q4Successes = allAnswers
    .flatMap(a => a.q4 || [])
    .filter(s => s?.trim() && s.trim().length > 0);

  // Q5 - Améliorations
  const q5Improvements = allAnswers
    .flatMap(a => a.q5 || [])
    .filter(s => s?.trim() && s.trim().length > 0);

  // Q8 - Rôle environnemental
  const q8Roles = allAnswers
    .map(a => a.q8?.trim())
    .filter(r => r && r.length > 0);

  // Q9 - Nouvelles missions
  const q9Missions = allAnswers
    .map(a => a.q9?.mission?.trim())
    .filter(m => m && m.length > 0);

  // Q10, Q11 - Communication
  const q10Dist: { [key: string]: number } = {};
  const q11Dist: { [key: string]: number } = {};
  allAnswers.forEach(a => {
    if (a.q10) q10Dist[a.q10] = (q10Dist[a.q10] || 0) + 1;
    if (a.q11) q11Dist[a.q11] = (q11Dist[a.q11] || 0) + 1;
  });

  // Q13 - Propositions Charte
  const q13Proposals = allAnswers
    .map(a => a.q13?.trim())
    .filter(p => p && p.length > 0);

  // Q14 - Défis
  const q14Challenges = allAnswers
    .map(a => a.q14?.trim())
    .filter(c => c && c.length > 0);

  // Q15 - Commentaires
  const q15Comments = allAnswers
    .map(a => a.q15?.trim())
    .filter(c => c && c.length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* En-tête fixe */}
      <header className="bg-white border-b border-[#cbd5e1] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1e293b] mb-1">Rapport Stratégique URAI</h1>
              <p className="text-sm text-[#64748b]">{responses.length} contribution{responses.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 text-sm text-[#1e40af] hover:bg-[#dbeafe] rounded"
              >
                {showSettings ? 'Rapport' : 'Paramètres'}
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-[#1e40af] text-white text-sm rounded hover:bg-[#1e3a8a]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {showSettings ? (
          /* SECTION PARAMÈTRES */
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] mb-6">Paramètres</h2>
            <div className="bg-white p-6 rounded border border-[#cbd5e1]">
              <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Réponses enregistrées</h3>
              <div className="space-y-4">
                {responses.map((response) => {
                  const answers = response.answers_json as QuestionnaireAnswers;
                  const insights = getResponseInsights(answers);
                  const isConfirming = deleteConfirmId === response.id;
                  
                  return (
                    <div
                      key={response.id}
                      className="p-5 border border-[#cbd5e1] rounded hover:bg-[#f8fafc] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#1e293b]">
                              Réponse #{response.id.substring(0, 8)}...
                            </span>
                            <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded">
                              {formatDate(response.created_at)}
                            </span>
                          </div>
                          
                          {insights.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {insights.map((insight, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-[#1e40af] bg-[#dbeafe] px-2 py-1 rounded"
                                >
                                  {insight}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {isConfirming ? (
                            <>
                              <button
                                onClick={() => handleDelete(response.id)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded border border-red-700 disabled:opacity-50"
                              >
                                {isDeleting ? 'Suppression...' : 'Confirmer'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 text-xs text-[#64748b] bg-white hover:bg-[#f8fafc] rounded border border-[#cbd5e1] disabled:opacity-50"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(response.id)}
                              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* RAPPORT COMPLET - ONE PAGE */
          <div className="space-y-16">
            {/* SYNTHÈSE */}
            <section>
              <h2 className="text-xl font-bold text-[#1e293b] mb-8">Synthèse</h2>
              
              {/* Indicateurs simples */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded border border-[#cbd5e1]">
                  <p className="text-sm text-[#64748b] mb-2">Efficacité de la représentation</p>
                  {q3Median !== null ? (
                    <>
                      <p className="text-3xl font-bold text-[#1e40af] mb-2">{q3Median.toFixed(1)}</p>
                      <p className="text-xs text-[#64748b]">sur 5 (médiane)</p>
                    </>
                  ) : (
                    <p className="text-lg text-[#94a3b8]">Non renseigné</p>
                  )}
                </div>
                <div className="bg-white p-6 rounded border border-[#cbd5e1]">
                  <p className="text-sm text-[#64748b] mb-2">Transparence de la gouvernance</p>
                  {q12Median !== null ? (
                    <>
                      <p className="text-3xl font-bold text-[#1e40af] mb-2">{q12Median.toFixed(1)}</p>
                      <p className="text-xs text-[#64748b]">sur 5 (médiane)</p>
                    </>
                  ) : (
                    <p className="text-lg text-[#94a3b8]">Non renseigné</p>
                  )}
                </div>
                <div className="bg-white p-6 rounded border border-[#cbd5e1]">
                  <p className="text-sm text-[#64748b] mb-2">Top 3 priorités</p>
                  <ul className="text-sm text-[#1e293b] space-y-1 mt-2">
                    {top3Priorities.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#1e40af] font-bold">{i + 1}.</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Distributions */}
              {q3Dist.some(d => d.count > 0) && (
                <div className="bg-white p-6 rounded border border-[#cbd5e1] mb-6">
                  <h3 className="text-base font-semibold text-[#1e293b] mb-4">Distribution : Efficacité de la représentation</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q3Dist}>
                        <XAxis dataKey="value" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1e40af" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {q12Dist.some(d => d.count > 0) && (
                <div className="bg-white p-6 rounded border border-[#cbd5e1] mb-6">
                  <h3 className="text-base font-semibold text-[#1e293b] mb-4">Distribution : Transparence de la gouvernance</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q12Dist}>
                        <XAxis dataKey="value" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1e40af" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Image perçue */}
              {q6Words.length > 0 && (
                <div className="bg-white p-6 rounded border border-[#cbd5e1]">
                  <h3 className="text-base font-semibold text-[#1e293b] mb-4">Image perçue de l'URAI</h3>
                  <div className="flex flex-wrap gap-2">
                    {q6Words.map((word, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-[#dbeafe] text-[#1e40af] rounded text-sm font-medium"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* RÉPONSES STRATÉGIQUES */}
            <section>
              <h2 className="text-xl font-bold text-[#1e293b] mb-8">Réponses Stratégiques</h2>

              {/* Q4 - Succès */}
              {q4Successes.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Les succès reconnus de l'URAI (Q4)
                  </h3>
                  <ul className="space-y-4">
                    {q4Successes.map((success, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{success}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Q5 - Améliorations */}
              {q5Improvements.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Domaines d'amélioration (Q5)
                  </h3>
                  <ul className="space-y-4">
                    {q5Improvements.map((improvement, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{improvement}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Q7 - Priorités */}
              {q7Priorities.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Hiérarchie des priorités d'action (Q7)
                  </h3>
                  <ol className="space-y-3 mb-8">
                    {q7Priorities.map((p, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="text-[#1e40af] font-bold text-lg min-w-[2rem]">{i + 1}.</span>
                        <div className="flex-1">
                          <p className="text-[#1e293b] font-medium">{p.domain}</p>
                          <p className="text-xs text-[#64748b] mt-1">
                            Position moyenne : {p.avg.toFixed(1)} / 6
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {/* Graphique optionnel */}
                  {q7Priorities.length > 0 && (
                    <div className="h-64 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={q7Priorities.map(p => ({ domain: p.domain.substring(0, 40) + '...', avg: p.avg }))}
                          layout="vertical"
                        >
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis dataKey="domain" type="category" stroke="#64748b" width={200} />
                          <Tooltip />
                          <Bar dataKey="avg" fill="#1e40af" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Q8 - Rôle environnemental */}
              {q8Roles.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Rôle environnemental de l'URAI (Q8)
                  </h3>
                  <ul className="space-y-4">
                    {q8Roles.map((role, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{role}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Q9 - Nouvelles missions */}
              {q9Missions.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1]">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Nouvelles missions proposées (Q9)
                  </h3>
                  <ul className="space-y-4">
                    {q9Missions.map((mission, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{mission}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* FONCTIONNEMENT ET CONTRIBUTIONS */}
            <section>
              <h2 className="text-xl font-bold text-[#1e293b] mb-8">Fonctionnement et Contributions</h2>

              {/* Q10, Q11 - Communication */}
              {(Object.keys(q10Dist).length > 0 || Object.keys(q11Dist).length > 0) && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">Communication</h3>
                  
                  {Object.keys(q10Dist).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-base font-medium text-[#1e293b] mb-3">
                        Efficacité des canaux actuels (Q10)
                      </h4>
                      <ul className="space-y-2">
                        {Object.entries(q10Dist).map(([option, count]) => (
                          <li key={option} className="flex justify-between items-center">
                            <span className="text-[#1e293b]">{option}</span>
                            <span className="text-[#64748b] font-medium">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Object.keys(q11Dist).length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-[#1e293b] mb-3">
                        Fréquence souhaitée (Q11)
                      </h4>
                      <ul className="space-y-2">
                        {Object.entries(q11Dist).map(([option, count]) => (
                          <li key={option} className="flex justify-between items-center">
                            <span className="text-[#1e293b]">{option}</span>
                            <span className="text-[#64748b] font-medium">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Q13 - Propositions Charte */}
              {q13Proposals.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Propositions pour la Charte (Q13)
                  </h3>
                  <ul className="space-y-4">
                    {q13Proposals.map((proposal, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{proposal}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Q14 - Défis */}
              {q14Challenges.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1] mb-8">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Défis et menaces du secteur (Q14)
                  </h3>
                  <ul className="space-y-4">
                    {q14Challenges.map((challenge, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{challenge}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Q15 - Commentaires */}
              {q15Comments.length > 0 && (
                <div className="bg-white p-8 rounded border border-[#cbd5e1]">
                  <h3 className="text-lg font-semibold text-[#1e293b] mb-6">
                    Commentaires libres (Q15)
                  </h3>
                  <ul className="space-y-4">
                    {q15Comments.map((comment, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-[#1e40af] font-bold mt-1">•</span>
                        <p className="text-[#1e293b] leading-relaxed flex-1">{comment}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
