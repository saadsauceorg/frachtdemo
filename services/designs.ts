import { supabase } from './supabase';
import { DesignItem } from '../types/fracht';
import { logActivity } from './activityLog';

// Singleton Worker pour éviter de le recréer à chaque upload
let thumbnailWorker: Worker | null = null;
const pendingRequests = new Map<string, {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeoutId: number;
}>();

function getThumbnailWorker(): Worker {
  if (!thumbnailWorker) {
    thumbnailWorker = new Worker(
      new URL('../workers/image-thumbnail.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Gérer les messages du worker avec système d'ID
    thumbnailWorker.addEventListener('message', (e: MessageEvent) => {
      const { requestId, error, ...data } = e.data;
      const request = pendingRequests.get(requestId);
      
      if (request) {
        clearTimeout(request.timeoutId);
        pendingRequests.delete(requestId);
        
        if (error) {
          request.reject(new Error(error));
        } else {
          request.resolve(data);
        }
      }
    });

    thumbnailWorker.addEventListener('error', (error: ErrorEvent) => {
      // En cas d'erreur globale, rejeter toutes les requêtes en cours
      for (const [requestId, request] of pendingRequests.entries()) {
        clearTimeout(request.timeoutId);
        request.reject(error.error || new Error('Erreur dans le worker'));
      }
      pendingRequests.clear();
      resetThumbnailWorker();
    });
  }
  return thumbnailWorker;
}

function resetThumbnailWorker(): void {
  if (thumbnailWorker) {
    // Nettoyer toutes les requêtes en cours
    for (const [requestId, request] of pendingRequests.entries()) {
      clearTimeout(request.timeoutId);
      request.reject(new Error('Worker réinitialisé'));
    }
    pendingRequests.clear();
    
    thumbnailWorker.terminate();
    thumbnailWorker = null;
  }
}

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

// ✅ Upload image avec génération de thumbnail + original (optimisé)
export async function uploadImageAndGetDimensions(file: File): Promise<{
  originalUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const BUCKET_NAME = 'files';
  const THUMB_MAX_WIDTH = 800;
  const ORIGINAL_MAX_SIZE = 8 * 1024 * 1024; // 8MB
  const WORKER_TIMEOUT = 10000; // 10 secondes

  const contentType = file.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
  const shouldCompress = file.size > ORIGINAL_MAX_SIZE;

  // Utiliser le singleton Worker
  const thumbnailWorker = getThumbnailWorker();

  // Lire le fichier en ArrayBuffer pour le transfert (transferable objects)
  const fileData = await file.arrayBuffer();

  // Générer un ID unique pour cette requête
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Générer le thumbnail dans le Worker avec timeout de sécurité
  const { blob: thumbBlob, originalBlob, width, height, aspectRatio } = await new Promise<{
    blob: Blob;
    originalBlob: Blob;
    width: number;
    height: number;
    aspectRatio: number;
  }>((resolve, reject) => {
    // Créer le timeout
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      resetThumbnailWorker();
      reject(new Error('Timeout: le worker a pris plus de 10 secondes'));
    }, WORKER_TIMEOUT);

    // Stocker la requête
    pendingRequests.set(requestId, { resolve, reject, timeoutId: timeoutId as unknown as number });

    // Passer l'ArrayBuffer avec transferable objects (évite copie mémoire)
    thumbnailWorker.postMessage(
      {
        requestId,
        fileData,
        fileName: file.name,
        mimeType: contentType,
        maxWidth: THUMB_MAX_WIDTH,
        compressOriginal: shouldCompress,
        originalMaxSize: ORIGINAL_MAX_SIZE,
      },
      [fileData] // Transferable: ArrayBuffer transféré (pas copié)
    );
  });

  // Préparer les noms de fichiers
  const originalFileName = `${baseFileName}.${shouldCompress ? 'jpg' : fileExt}`;
  const thumbFileName = `${baseFileName}_thumb.${fileExt}`;
  const finalContentType = shouldCompress ? 'image/jpeg' : contentType;

  // Upload parallèle : original + thumbnail en même temps
  const [originalUpload, thumbUpload] = await Promise.all([
    supabase.storage
      .from(BUCKET_NAME)
      .upload(originalFileName, originalBlob, {
        contentType: finalContentType,
        upsert: false,
        cacheControl: '3600',
      }),
    supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbFileName, thumbBlob, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      }),
  ]);

  // Vérifier les erreurs
  if (originalUpload.error) {
    if (originalUpload.error.message?.includes('Bucket not found')) {
      throw new Error(`Le bucket "${BUCKET_NAME}" n'existe pas.`);
    }
    throw new Error(`Erreur upload original: ${originalUpload.error.message}`);
  }

  if (thumbUpload.error) {
    throw new Error(`Erreur upload thumbnail: ${thumbUpload.error.message}`);
  }

  if (!originalUpload.data?.path || !thumbUpload.data?.path) {
    throw new Error('Erreur: chemins manquants après upload');
  }

  // Obtenir les URLs publiques
  const { data: { publicUrl: originalUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(originalUpload.data.path);
  const { data: { publicUrl: thumbUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(thumbUpload.data.path);

  if (!originalUrl || !thumbUrl) {
    throw new Error('Impossible d\'obtenir les URLs publiques');
  }

  return {
    originalUrl,
    thumbUrl,
    width,
    height,
    aspectRatio,
  };
}

export async function createDesign(
  originalUrl: string,
  thumbUrl: string,
  aspectRatio: number,
  width?: number,
  height?: number
): Promise<DesignItem> {
  // Récupérer le dernier order_index (requête optimisée)
  const { data: lastDesign } = await supabase
    .from('designs')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextOrderIndex = lastDesign?.order_index != null
    ? lastDesign.order_index + 1
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

  // Logger l'activité
  await logActivity(
    data.id,
    'image_added',
    `Image ajoutée: ${title}`,
    { design_title: title },
    'Système'
  );

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

  // Récupérer le titre avant suppression pour le log
  const { data: design } = await supabase
    .from('designs')
    .select('title')
    .eq('id', designId)
    .single();

  // Supprimer le design
  const { error } = await supabase
    .from('designs')
    .delete()
    .eq('id', designId);

  if (error) throw error;

  // Logger l'activité
  if (design) {
    await logActivity(
      designId,
      'image_deleted',
      `Image supprimée: ${design.title}`,
      { design_title: design.title },
      'Utilisateur'
    );
  }
}

export async function updateDesignTitle(id: string, title: string): Promise<void> {
  // Récupérer l'ancien titre pour le log
  const { data: oldDesign } = await supabase
    .from('designs')
    .select('title')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('designs')
    .update({ title })
    .eq('id', id);

  if (error) throw error;

  // Logger l'activité
  if (oldDesign) {
    await logActivity(
      id,
      'title_updated',
      `Titre modifié: "${oldDesign.title}" → "${title}"`,
      { old_value: oldDesign.title, new_value: title, design_title: title },
      'Utilisateur'
    );
  }
}

export async function updateDesignStatus(
  id: string,
  status: 'draft' | 'review' | 'approved'
): Promise<void> {
  // Récupérer l'ancien statut et le titre pour le log
  const { data: oldDesign } = await supabase
    .from('designs')
    .select('status, title')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('designs')
    .update({ status })
    .eq('id', id);

  if (error) throw error;

  // Logger l'activité
  if (oldDesign && oldDesign.status !== status) {
    const statusLabels: Record<string, string> = {
      draft: 'Brouillon',
      review: 'En révision',
      approved: 'Approuvé'
    };
    await logActivity(
      id,
      'status_updated',
      `Statut modifié: ${statusLabels[oldDesign.status] || oldDesign.status} → ${statusLabels[status] || status}`,
      { old_value: oldDesign.status, new_value: status, design_title: oldDesign.title },
      'Utilisateur'
    );
  }
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

  // Récupérer les infos du tag et du design pour le log
  const [tagRes, designRes] = await Promise.all([
    supabase.from('tags').select('name, color').eq('id', tagId).single(),
    supabase.from('designs').select('title').eq('id', designId).single(),
  ]);

  if (tagRes.data && designRes.data) {
    await logActivity(
      designId,
      'tag_added',
      `Tag ajouté: ${tagRes.data.name}`,
      { tag_name: tagRes.data.name, tag_color: tagRes.data.color, design_title: designRes.data.title },
      'Utilisateur'
    );
  }
}

export async function removeTagFromDesign(designId: string, tagId: string): Promise<void> {
  // Récupérer les infos avant suppression pour le log
  const [tagRes, designRes] = await Promise.all([
    supabase.from('tags').select('name, color').eq('id', tagId).single(),
    supabase.from('designs').select('title').eq('id', designId).single(),
  ]);

  const { error } = await supabase
    .from('design_tags')
    .delete()
    .eq('design_id', designId)
    .eq('tag_id', tagId);

  if (error) throw error;

  // Logger l'activité
  if (tagRes.data && designRes.data) {
    await logActivity(
      designId,
      'tag_removed',
      `Tag retiré: ${tagRes.data.name}`,
      { tag_name: tagRes.data.name, tag_color: tagRes.data.color, design_title: designRes.data.title },
      'Utilisateur'
    );
  }
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

  // Récupérer le titre du design pour le log
  const { data: design } = await supabase
    .from('designs')
    .select('title')
    .eq('id', designId)
    .single();

  // Logger l'activité
  await logActivity(
    designId,
    'comment_added',
    text ? `Commentaire ajouté: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : 'Commentaire audio ajouté',
    { comment_text: text || undefined, design_title: design?.title },
    author
  );

  return data;
}

export async function updateComment(
  commentId: string,
  text?: string,
  audioUrl?: string
): Promise<CommentDB> {
  // Récupérer l'ancien commentaire pour le log
  const { data: oldComment } = await supabase
    .from('comments')
    .select('design_id, text')
    .eq('id', commentId)
    .single();

  const { data, error } = await supabase
    .from('comments')
    .update({
      text,
      audio_url: audioUrl,
    })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;

  // Logger l'activité
  if (oldComment) {
    const { data: design } = await supabase
      .from('designs')
      .select('title')
      .eq('id', oldComment.design_id)
      .single();

    await logActivity(
      oldComment.design_id,
      'comment_edited',
      text ? `Commentaire modifié: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : 'Commentaire audio modifié',
      { comment_text: text || undefined, design_title: design?.title },
      'Utilisateur'
    );
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  // Récupérer le commentaire avant suppression pour le log
  const { data: comment } = await supabase
    .from('comments')
    .select('design_id, text')
    .eq('id', commentId)
    .single();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;

  // Logger l'activité
  if (comment) {
    const { data: design } = await supabase
      .from('designs')
      .select('title')
      .eq('id', comment.design_id)
      .single();

    await logActivity(
      comment.design_id,
      'comment_deleted',
      `Commentaire supprimé`,
      { comment_text: comment.text || undefined, design_title: design?.title },
      'Utilisateur'
    );
  }
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
  // Récupérer l'ancienne location et le titre pour le log
  const { data: oldDesign } = await supabase
    .from('designs')
    .select('location_id, title')
    .eq('id', designId)
    .single();

  const { error } = await supabase
    .from('designs')
    .update({ location_id: locationId })
    .eq('id', designId);

  if (error) throw error;

  // Logger l'activité si la location a changé
  if (oldDesign && oldDesign.location_id !== locationId) {
    let oldLocationName = 'Aucune';
    let newLocationName = 'Aucune';

    if (oldDesign.location_id) {
      const { data: oldLoc } = await supabase
        .from('locations')
        .select('name')
        .eq('id', oldDesign.location_id)
        .single();
      if (oldLoc) oldLocationName = oldLoc.name;
    }

    if (locationId) {
      const { data: newLoc } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .single();
      if (newLoc) newLocationName = newLoc.name;
    }

    await logActivity(
      designId,
      'location_updated',
      `Emplacement modifié: ${oldLocationName} → ${newLocationName}`,
      { old_value: oldLocationName, new_value: newLocationName, design_title: oldDesign.title },
      'Utilisateur'
    );
  }
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

// Supprimer un emplacement
export async function deleteLocation(locationId: string): Promise<void> {
  // Récupérer l'emplacement pour obtenir l'URL de l'image
  const { data: location, error: fetchError } = await supabase
    .from('locations')
    .select('image_url, name')
    .eq('id', locationId)
    .single();

  if (fetchError) throw fetchError;
  if (!location) throw new Error('Emplacement non trouvé');

  // Vérifier si des designs utilisent cet emplacement
  const { data: designsUsingLocation } = await supabase
    .from('designs')
    .select('id')
    .eq('location_id', locationId)
    .limit(1);

  if (designsUsingLocation && designsUsingLocation.length > 0) {
    throw new Error('Impossible de supprimer cet emplacement car il est utilisé par des designs');
  }

  // Supprimer l'emplacement de la base de données
  const { error: deleteError } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId);

  if (deleteError) throw deleteError;

  // Optionnel: Supprimer l'image du storage si elle existe
  if (location.image_url) {
    try {
      const urlParts = location.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `locations/${fileName}`;
      
      await supabase.storage
        .from('files')
        .remove([filePath]);
    } catch (storageError) {
      // Ne pas faire échouer la suppression si l'image ne peut pas être supprimée
      console.warn('Impossible de supprimer l\'image du storage:', storageError);
    }
  }
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
  // Récupérer l'ancien rating et le titre pour le log
  const { data: oldDesign } = await supabase
    .from('designs')
    .select('rating, title')
    .eq('id', designId)
    .single();

  const { error } = await supabase
    .from('designs')
    .update({ rating })
    .eq('id', designId);

  if (error) throw error;

  // Logger l'activité si le rating a changé
  if (oldDesign && oldDesign.rating !== rating) {
    await logActivity(
      designId,
      'rating_updated',
      `Note modifiée: ${oldDesign.rating ?? 'Aucune'} → ${rating ?? 'Aucune'}`,
      { old_value: oldDesign.rating?.toString() || 'Aucune', new_value: rating?.toString() || 'Aucune', design_title: oldDesign.title },
      'Utilisateur'
    );
  }
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

  // Récupérer le titre du design pour le log
  const { data: design } = await supabase
    .from('designs')
    .select('title')
    .eq('id', designId)
    .single();

  // Logger l'activité
  await logActivity(
    designId,
    'version_added',
    `Nouvelle version ${versionNumber} ajoutée${changes ? `: ${changes}` : ''}`,
    { version_number: versionNumber, design_title: design?.title },
    author
  );

  return data;
}
