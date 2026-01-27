
import React from 'react';
import { Section } from './types';

export const SECTIONS: Section[] = [
  { 
    id: 'I', 
    title: 'Informations Générales et Profil du Membre', 
    description: '',
    questions: ['q1', 'q2'] 
  },
  { 
    id: 'II', 
    title: 'Évaluation de la Mission Actuelle et de l\'Image de l’URAI', 
    description: '',
    questions: ['q3', 'q4', 'q5', 'q6'] 
  },
  { 
    id: 'III', 
    title: 'Attentes et Priorités Futures/Vision', 
    description: '',
    questions: ['q7', 'q8', 'q9'] 
  },
  { 
    id: 'IV', 
    title: 'Fonctionnement Interne et Communication', 
    description: '',
    questions: ['q10', 'q11', 'q12'] 
  },
  { 
    id: 'V', 
    title: 'Commentaires Libres et Suggestions pour la Charte', 
    description: '',
    questions: ['q13', 'q14', 'q15'] 
  },
];

export const INITIAL_ANSWERS = {
  q1: '',
  q2: '',
  q3: 3,
  q4: ['', ''],
  q5: ['', ''],
  q6: '',
  q7: [
    'La lutte contre l\'importation parallèle/le marché gris.',
    'La facilitation des procédures douanières et fiscales spécifiques au secteur.',
    'L\'amélioration du cadre réglementaire (normes techniques, sécurité routière, etc.).',
    'L\'organisation d\'événements promotionnels (Salons de l\'Auto, JPO) et la communication institutionnelle.',
    'Le développement de la formation professionnelle et de la certification des métiers.',
    'Le renforcement de la cohésion et de la collaboration entre les membres.'
  ],
  q8: '',
  q9: { mission: '', icon: '' },
  q10: '',
  q11: '',
  q12: 3,
  q13: '',
  q14: '',
  q15: '',
};

export const MISSION_ICONS = [
  { id: 'tech', label: 'Technologie' },
  { id: 'env', label: 'Environnement' },
  { id: 'gov', label: 'Gouvernance' },
  { id: 'data', label: 'Analytique' },
];
