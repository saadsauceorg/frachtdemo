import { supabase } from './supabase';
import { DesignItem } from '../types/fracht';

export interface DesignDB {
  id: string;
  title: string;
  image_url: string;
  image_original_url?: string | null;
  image_thumb_url?: string | null;
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
    // UNIQUEMENT Supabase Storage - image_original_url doit exister et être une URL https://
    .not('image_original_url', 'is', null)
    .like('image_original_url', 'https://%')
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

      // UNIQUEMENT Supabase Storage
      const originalUrl = design.image_original_url;
      const thumbUrl = design.image_thumb_url;
      
      return {
        id: design.id,
        title: design.title,
        imageUrl: originalUrl,
        thumbnailUrl: thumbUrl || undefined,
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

// Récupérer un seul design complet par ID
export async function getDesignById(designId: string): Promise<DesignItem | null> {
  const { data: design, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', designId)
    .single();

  if (error || !design) return null;

  // Récupérer les tags
  const { data: designTags } = await supabase
    .from('design_tags')
    .select('tag_id')
    .eq('design_id', design.id);

  const tagIds = designTags?.map((dt) => dt.tag_id) || [];
  let tags: Array<{ id: string; label: string; color: string }> = [];
  
  if (tagIds.length > 0) {
    const { data: tagsData } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds);

    tags = (tagsData || []).map((tag) => ({
      id: tag.id,
      label: tag.name,
      color: tag.color || '#0B3C5D',
    }));
  }

  // Récupérer commentaires, versions et location
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

  // UNIQUEMENT Supabase Storage
  const originalUrl = design.image_original_url;
  const thumbUrl = design.image_thumb_url;
  
  return {
    id: design.id,
    title: design.title,
    imageUrl: originalUrl,
    thumbnailUrl: thumbUrl || undefined,
    aspectRatio: Number(design.aspect_ratio),
    project: design.project || 'Projet Fracht',
    location: design.location || 'France',
    client: design.client || 'Fracht Group',
    status: design.status,
    tags,
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
}

// ✅ Upload image avec génération de thumbnail + original
export async function uploadImageAndGetDimensions(file: File): Promise<{
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / height;

      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const BUCKET_NAME = 'files';
        
        // Générer thumbnail (max 800px de largeur, qualité 80%)
        const thumbCanvas = document.createElement('canvas');
        const thumbMaxWidth = 800;
        const thumbScale = Math.min(thumbMaxWidth / width, 1);
        thumbCanvas.width = width * thumbScale;
        thumbCanvas.height = height * thumbScale;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (!thumbCtx) throw new Error('Impossible de créer le contexte canvas');
        thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        
        // Convertir thumbnail en blob
        const thumbBlob = await new Promise<Blob>((resolve, reject) => {
          thumbCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Erreur génération thumbnail'));
          }, `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`, 0.8);
        });
        
        // Upload original
        const originalArrayBuffer = await file.arrayBuffer();
        const originalFileName = `${baseFileName}.${fileExt}`;
        const { data: originalUpload, error: originalError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(originalFileName, originalArrayBuffer, {
            contentType: file.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: false,
            cacheControl: '31536000', // 1 an cache pour originaux
          });

        if (originalError) {
          if (originalError.message?.includes('Bucket not found')) {
            throw new Error(`Le bucket "${BUCKET_NAME}" n'existe pas.`);
          }
          throw new Error(`Erreur upload original: ${originalError.message}`);
        }

        // Upload thumbnail
        const thumbArrayBuffer = await thumbBlob.arrayBuffer();
        const thumbFileName = `${baseFileName}_thumb.${fileExt}`;
        const { data: thumbUpload, error: thumbError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(thumbFileName, thumbArrayBuffer, {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: false,
            cacheControl: '31536000', // 1 an cache pour thumbnails
          });

        if (thumbError) {
          throw new Error(`Erreur upload thumbnail: ${thumbError.message}`);
        }

        if (!originalUpload?.path || !thumbUpload?.path) {
          throw new Error('Erreur: chemins manquants après upload');
        }

        const { data: { publicUrl: originalUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(originalUpload.path);
        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(thumbUpload.path);

        if (!originalUrl || !thumbUrl) {
          throw new Error('Impossible d\'obtenir les URLs publiques');
        }

        URL.revokeObjectURL(objectUrl);
        
        resolve({
          originalUrl,
          thumbUrl,
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
  originalUrl: string,
  thumbUrl: string,
  aspectRatio: number,
  width?: number,
  height?: number
): Promise<DesignItem> {
  // Récupérer le dernier order_index (gérer le cas où la table est vide)
  const { data: designs, error: orderError } = await supabase
    .from('designs')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrderIndex = designs && designs.length > 0 && designs[0]?.order_index !== null && designs[0]?.order_index !== undefined
    ? designs[0].order_index + 1 
    : 0;

  const title = `Design #${nextOrderIndex + 1}`;

  const { data, error } = await supabase
    .from('designs')
    .insert({
      title,
      image_url: originalUrl, // Garder pour compatibilité
      image_original_url: originalUrl,
      image_thumb_url: thumbUrl,
      aspect_ratio: aspectRatio,
      status: 'draft',
      project: 'Projet Fracht',
      location: 'France',
      client: 'Fracht Group',
      order_index: nextOrderIndex,
    })
    .select()
    .single();

  if (error) throw error;

  const fullDesign = await getDesignById(data.id);
  if (!fullDesign) throw new Error('Erreur lors de la création du design');

  return fullDesign;
}

// Supprimer un design
export async function deleteDesign(designId: string): Promise<void> {
  // Supprimer les relations d'abord
  await Promise.all([
    supabase.from('design_tags').delete().eq('design_id', designId),
    supabase.from('comments').delete().eq('design_id', designId),
    supabase.from('versions').delete().eq('design_id', designId),
  ]);

  // Supprimer le design
  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', designId);

  if (error) throw error;
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

// Créer un nouvel emplacement avec une image
export async function createLocation(name: string, imageFile: File): Promise<LocationDB> {
  // Upload de l'image vers Supabase Storage
  const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `locations/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Utiliser le bucket "files" qui existe réellement dans Supabase
  const BUCKET_NAME = 'files';
  
  // Convertir le File en ArrayBuffer pour éviter les problèmes de type
  const arrayBuffer = await imageFile.arrayBuffer();
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, arrayBuffer, {
      contentType: imageFile.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) {
    if (uploadError.message?.includes('Bucket not found')) {
      throw new Error(`Le bucket "${BUCKET_NAME}" n'existe pas. Veuillez vérifier votre configuration Supabase Storage.`);
    } else if (uploadError.message?.includes('new row violates row-level security')) {
      throw new Error(`Permissions insuffisantes. Vérifiez les politiques RLS du bucket "${BUCKET_NAME}" dans Supabase.`);
    }
    throw uploadError;
  }

  if (!uploadData?.path) {
    throw new Error('Erreur: aucun chemin retourné après l\'upload');
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uploadData.path);

  if (!publicUrl) {
    throw new Error('Impossible d\'obtenir l\'URL publique du fichier');
  }

  // Créer l'emplacement dans la base de données
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name,
      image_url: publicUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Pin
export async function togglePin(designId: string, isPinned: boolean): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ is_pinned: isPinned })
    .eq('id', designId);

  if (error) throw error;
}

// Rating
export async function updateRating(designId: string, rating: number | null): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ rating })
    .eq('id', designId);

  if (error) throw error;
}

// Mettre à jour l'ordre des designs (batch simple)
export async function updateDesignsOrder(updates: Array<{ id: string; order_index: number }>): Promise<void> {
  // Utiliser Promise.all pour faire toutes les mises à jour en parallèle
  const promises = updates.map(({ id, order_index }) =>
    supabase
      .from('designs')
      .update({ order_index })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  
  // Vérifier s'il y a des erreurs
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw new Error(`Erreur lors de la mise à jour de l'ordre: ${errors[0].error?.message}`);
  }
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
