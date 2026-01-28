import { supabase } from './supabase';

export interface ActivityLog {
  id: string;
  design_id: string;
  activity_type: 'comment_added' | 'comment_edited' | 'comment_deleted' | 'tag_added' | 'tag_removed' | 'image_added' | 'image_deleted' | 'version_added' | 'title_updated' | 'status_updated' | 'location_updated' | 'rating_updated';
  description: string;
  metadata?: {
    tag_name?: string;
    tag_color?: string;
    comment_text?: string;
    old_value?: string;
    new_value?: string;
    version_number?: number;
    design_title?: string;
  };
  author: string;
  created_at: string;
  design_title?: string;
  design_image_url?: string;
}

// Logger une activité
export async function logActivity(
  designId: string,
  activityType: ActivityLog['activity_type'],
  description: string,
  metadata?: ActivityLog['metadata'],
  author: string = 'Utilisateur'
): Promise<void> {
  try {
    await supabase
      .from('activity_log')
      .insert({
        design_id: designId,
        activity_type: activityType,
        description,
        metadata: metadata || {},
        author,
      });
  } catch (error) {
    // Ne pas bloquer l'application si le log échoue
    console.error('Erreur lors du log d\'activité:', error);
  }
}

// Récupérer les 10 dernières activités
export async function getRecentActivities(limit: number = 10): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      designs!left (
        title,
        image_original_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    return [];
  }

  return (data || []).map((item: any) => {
    const design = Array.isArray(item.designs) ? item.designs[0] : item.designs;
    return {
      id: item.id,
      design_id: item.design_id,
      activity_type: item.activity_type,
      description: item.description,
      metadata: item.metadata,
      author: item.author,
      created_at: item.created_at,
      design_title: design?.title,
      design_image_url: design?.image_original_url,
    };
  });
}

// Récupérer toutes les activités (pour le drawer détaillé)
export async function getAllActivities(limit: number = 50): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      designs!left (
        title,
        image_original_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    return [];
  }

  return (data || []).map((item: any) => {
    const design = Array.isArray(item.designs) ? item.designs[0] : item.designs;
    return {
      id: item.id,
      design_id: item.design_id,
      activity_type: item.activity_type,
      description: item.description,
      metadata: item.metadata,
      author: item.author,
      created_at: item.created_at,
      design_title: design?.title,
      design_image_url: design?.image_original_url,
    };
  });
}
