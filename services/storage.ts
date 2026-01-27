import { QuestionnaireAnswers } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'urai_user_uuid';

// Fonction simple pour générer un ID unique
const generateUniqueId = (): string => {
  // Essayer d'utiliser crypto.randomUUID si disponible
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: générer un ID simple basé sur timestamp et random
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

export const getUserId = (): string => {
  let uuid = localStorage.getItem(STORAGE_KEY);
  if (!uuid) {
    uuid = `test-user-${generateUniqueId()}`;
    localStorage.setItem(STORAGE_KEY, uuid);
  }
  return uuid;
};

export const saveResponse = async (userId: string, answers: QuestionnaireAnswers) => {
  try {
    console.log('Saving to Supabase...', { userId, answers });
    
    // Utiliser upsert pour insérer ou mettre à jour selon le user_id
    const { data, error } = await supabase
      .from('urai_responses')
      .upsert(
        {
          user_id: userId,
          answers_json: answers,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )
      .select();

    if (error) {
      console.error('Error saving response:', error);
      return { error };
    }

    console.log('Response saved successfully:', data);
    return { error: null, data };
  } catch (err) {
    console.error('Exception saving response:', err);
    return { error: err };
  }
};

export const getResponse = async (userId: string): Promise<QuestionnaireAnswers | null> => {
  try {
    const { data, error } = await supabase
      .from('urai_responses')
      .select('answers_json')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // PGRST116 signifie "aucun résultat" - c'est normal pour un nouvel utilisateur
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching response:', error);
      return null;
    }

    return data?.answers_json as QuestionnaireAnswers || null;
  } catch (err) {
    console.error('Exception fetching response:', err);
    return null;
  }
};

export const getAllResponses = async () => {
  try {
    const { data, error } = await supabase
      .from('urai_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all responses:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching all responses:', err);
    return [];
  }
};

export const deleteResponse = async (responseId: string) => {
  try {
    const { error } = await supabase
      .from('urai_responses')
      .delete()
      .eq('id', responseId);

    if (error) {
      console.error('Error deleting response:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('Exception deleting response:', err);
    return { error: err };
  }
};
