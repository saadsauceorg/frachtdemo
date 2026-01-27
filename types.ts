
export type QuestionId = 
  | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' 
  | 'q8' | 'q9' | 'q10' | 'q11' | 'q12' | 'q13' | 'q14' | 'q15';

export interface QuestionnaireAnswers {
  q1: string; 
  q2: string; 
  q3: number | null; 
  q4: string[]; 
  q5: string[]; 
  q6: string; 
  q7: string[]; 
  q8: string; 
  q9: { mission: string, icon: string }; 
  q10: string; 
  q11: string; 
  q12: number | null; 
  q13: string; 
  q14: string; 
  q15: string;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  questions: QuestionId[];
}

export enum AppState {
  ETHICS_SCREEN = 'ETHICS_SCREEN',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  SUBMITTED = 'SUBMITTED',
  ADMIN = 'ADMIN'
}
