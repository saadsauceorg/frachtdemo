import { supabase } from './supabase';
import { DesignItem } from '../types/fracht';

export interface DesignDB {
  id: string;
  title: string;
  image_url: string;
  aspect_ratio: number;
  status: 'draft' | 'review' | 'approved';
  project?: string;
  location?: string;
  client?: string;
  location_id?: string | null;
  is_pinned?: boolean;
  order_index?: number;
  rating?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TagDB {
  id: string;
  name: string;
  color: string;
}

export interface CommentDB {
  id: string;
  design_id: string;
  text?: string;
  audio_url?: string;
  author: string;
  created_at: string;
}

export interface VersionDB {
  id: string;
  design_id: string;
  version_number: number;
  file_url: string;
  changes?: string;
  author: string;
  created_at: string;
}

export interface LocationDB {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// CRUD Designs
export async function getDesigns(): Promise<DesignItem[]> {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Récupérer les tags pour chaque design
  const designsWithTags = await Promise.all(
    (data || []).map(async (design) => {
      const { data: designTags } = await supabase
        .from('design_tags')
        .select('tag_id')
        .eq('design_id', design.id);

      const tagIds = designTags?.map((dt) => dt.tag_id) || [];
      
      if (tagIds.length > 0) {
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);

        return {
          ...design,
          tags: (tags || []).map((tag) => ({
            id: tag.id,
            label: tag.name,
            color: tag.color || '#0B3C5D',
          })),
        };
      }

      return { ...design, tags: [] };
    })
  );

  // Récupérer les commentaires, versions et location
  const fullDesigns = await Promise.all(
    designsWithTags.map(async (design) => {
      const [commentsRes, versionsRes, locationRes] = await Promise.all([
        supabase
          .from('comments')
          .select('*')
          .eq('design_id', design.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('versions')
          .select('*')
          .eq('design_id', design.id)
          .order('version_number', { ascending: false }),
        design.location_id
          ? supabase.from('locations').select('*').eq('id', design.location_id).single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const locationData = locationRes.data
        ? {
            id: locationRes.data.id,
            name: locationRes.data.name,
            imageUrl: locationRes.data.image_url,
            description: locationRes.data.description,
          }
        : undefined;

      return {
        id: design.id,
        title: design.title,
        imageUrl: design.image_url,
        aspectRatio: Number(design.aspect_ratio),
        project: design.project || 'Projet Fracht',
        location: design.location || 'France',
        client: design.client || 'Fracht Group',
        status: design.status,
        tags: design.tags,
        locationId: design.location_id || null,
        locationData,
        isPinned: design.is_pinned || false,
        orderIndex: design.order_index || 0,
        rating: design.rating || null,
        versionHistory: (versionsRes.data || []).map((v) => ({
          id: v.id,
          version: v.version_number.toString(),
          timestamp: new Date(v.created_at).toISOString().split('T')[0],
          author: v.author,
          changes: v.changes || 'Nouvelle version',
        })),
        feedback: (commentsRes.data || []).map((c) => ({
          id: c.id,
          author: c.author,
          timestamp: new Date(c.created_at).toISOString().split('T')[0],
          text: c.text || undefined,
          audioUrl: c.audio_url || undefined,
        })),
        createdAt: design.created_at,
        updatedAt: design.updated_at,
      } as DesignItem;
    })
  );

  return fullDesigns;
}

// ✅ Upload image avec détection automatique des dimensions
export async function uploadImageAndGetDimensions(file: File): Promise<{
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    // Créer une image pour détecter les dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / height;

      try {
        // Upload vers Supabase Storage
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('designs')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('designs')
          .getPublicUrl(fileName);

        URL.revokeObjectURL(objectUrl);
        
        resolve({
          url: publicUrl,
          width,
          height,
          aspectRatio,
        });
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erreur lors du chargement de l\'image'));
    };

    img.src = objectUrl;
  });
}

export async function createDesign(
  title: string,
  imageUrl: string,
  aspectRatio: number,
  width?: number,
  height?: number,
  project?: string,
  location?: string
): Promise<DesignItem> {
  // Récupérer le dernier order_index pour placer le nouveau design à la fin
  const { data: lastDesign } = await supabase
    .from('designs')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextOrderIndex = lastDesign?.order_index ? lastDesign.order_index + 1 : 0;

  const { data, error } = await supabase
    .from('designs')
    .insert({
      title,
      image_url: imageUrl,
      aspect_ratio: aspectRatio,
      width: width || null,
      height: height || null,
      status: 'draft',
      project: project || 'Projet Fracht',
      location: location || 'France',
      client: 'Fracht Group',
      order_index: nextOrderIndex,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    imageUrl: data.image_url,
    aspectRatio: Number(data.aspect_ratio),
    width: data.width || undefined,
    height: data.height || undefined,
    project: data.project || 'Projet Fracht',
    location: data.location || 'France',
    client: data.client || 'Fracht Group',
    status: data.status,
    tags: [],
    versionHistory: [],
    feedback: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orderIndex: data.order_index,
  };
}

export async function updateDesignTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ title })
    .eq('id', id);

  if (error) throw error;
}

export async function updateDesignStatus(
  id: string,
  status: 'draft' | 'review' | 'approved'
): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

// Tags
export async function getTags(): Promise<TagDB[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createTag(name: string, color: string = '#0B3C5D'): Promise<TagDB> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, color })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addTagToDesign(designId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('design_tags')
    .insert({ design_id: designId, tag_id: tagId });

  if (error) throw error;
}

export async function removeTagFromDesign(designId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('design_tags')
    .delete()
    .eq('design_id', designId)
    .eq('tag_id', tagId);

  if (error) throw error;
}

// Comments
export async function addComment(
  designId: string,
  text?: string,
  audioUrl?: string,
  author: string = 'Utilisateur'
): Promise<CommentDB> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      design_id: designId,
      text,
      audio_url: audioUrl,
      author,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Locations
export async function getLocations(): Promise<LocationDB[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function updateDesignLocation(designId: string, locationId: string | null): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ location_id: locationId })
    .eq('id', designId);

  if (error) throw error;
}

// Pin
export async function togglePin(designId: string, isPinned: boolean): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ is_pinned: isPinned })
    .eq('id', designId);

  if (error) throw error;
}

// Reorder
export async function reorderDesigns(updates: Array<{ id: string; order_index: number }>): Promise<void> {
  // Utiliser une transaction via Promise.all pour mettre à jour tous les designs
  const promises = updates.map(({ id, order_index }) =>
    supabase
      .from('designs')
      .update({ order_index })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error);
  
  if (errors.length > 0) {
    throw new Error(`Erreur lors du réordonnancement: ${errors[0].error?.message}`);
  }
}

// Rating
export async function updateRating(designId: string, rating: number | null): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ rating })
    .eq('id', designId);

  if (error) throw error;
}

// Versions
export async function addVersion(
  designId: string,
  fileUrl: string,
  changes?: string,
  author: string = 'Système'
): Promise<VersionDB> {
  // Récupérer le dernier numéro de version
  const { data: lastVersion } = await supabase
    .from('versions')
    .select('version_number')
    .eq('design_id', designId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const versionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

  const { data, error } = await supabase
    .from('versions')
    .insert({
      design_id: designId,
      version_number: versionNumber,
      file_url: fileUrl,
      changes: changes || `Version ${versionNumber}`,
      author,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
