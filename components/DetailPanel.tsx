import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DesignItem } from '../types/fracht';
import { 
  HiX, 
  HiCheckCircle, 
  HiXCircle, 
  HiMicrophone,
  HiClock,
  HiUser,
  HiPlus,
  HiLocationMarker
} from 'react-icons/hi';
import { FiUpload } from 'react-icons/fi';
import { Waveform } from './Waveform';
import { LocationSelector } from './LocationSelector';
import { 
  updateDesignTitle, 
  updateDesignStatus, 
  addComment, 
  getTags, 
  addTagToDesign, 
  removeTagFromDesign,
  addVersion,
  updateRating,
  uploadImageAndGetDimensions,
  createDesign
} from '../services/designs';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

interface DetailPanelProps {
  item: DesignItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onDesignCreated?: (newDesign: DesignItem) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ item, isOpen, onClose, onUpdate, onDesignCreated }) => {
  const isNewDesign = item === null;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(item?.title || '');
  const [commentText, setCommentText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null | undefined>(item?.locationId ?? null);
  const [locationData, setLocationData] = useState(item?.locationData);
  const [rating, setRating] = useState<number | null>(item?.rating || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setSelectedLocationId(item.locationId);
      setLocationData(item.locationData);
      setRating(item.rating || null);
    } else {
      // Mode nouveau design
      setTitle('');
      setSelectedLocationId(null);
      setLocationData(undefined);
      setRating(null);
    }
    loadTags();
  }, [item]);

  const loadTags = async () => {
    try {
      const tags = await getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleTitleSave = async () => {
    if (isNewDesign) {
      // En mode nouveau design, le titre sera sauvegardé lors de l'upload
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateDesignTitle(item!.id, title);
      setIsEditingTitle(false);
      toast.success('Titre mis à jour');
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handleStatusChange = async (status: 'approved' | 'review') => {
    if (isNewDesign) return;
    try {
      await updateDesignStatus(item!.id, status);
      toast.success(status === 'approved' ? 'Design approuvé' : 'Modifications demandées');
      onUpdate?.();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handleAddComment = async () => {
    if (isNewDesign) return;
    if (!commentText.trim() && !audioUrl) return;

    try {
      await addComment(item!.id, commentText || undefined, audioUrl || undefined);
      toast.success('Commentaire ajouté');
      setCommentText('');
      setAudioUrl(null);
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
      console.error(error);
    }
  };

  const handleTagToggle = async (tagId: string) => {
    if (!item) return; // Protection contre les nouveaux designs
    
    const isTagged = item.tags.some((t) => t.id === tagId);
    
    try {
      if (isTagged) {
        await removeTagFromDesign(item.id, tagId);
        toast.success('Tag retiré');
      } else {
        await addTagToDesign(item.id, tagId);
        toast.success('Tag ajouté');
      }
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de la modification du tag');
      console.error(error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      if (isNewDesign) {
        // ✅ Mode nouveau design - Upload et création
        const { url, width, height, aspectRatio } = await uploadImageAndGetDimensions(file);
        
        // Créer le design avec titre optionnel
        const designTitle = title.trim() || file.name.replace(/\.[^/.]+$/, '');
        const newDesign = await createDesign(
          designTitle,
          url,
          aspectRatio,
          width,
          height
        );
        
        toast.success('Design ajouté avec succès');
        onDesignCreated?.(newDesign);
        onClose();
      } else {
        // Mode existant - Ajouter une version
        if (!item) return; // Protection supplémentaire
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${item.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('designs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('designs')
          .getPublicUrl(fileName);

        await addVersion(item.id, publicUrl, 'Nouvelle version uploadée');
        toast.success('Version uploadée avec succès');
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLocationSelect = async (locationId: string | null) => {
    setSelectedLocationId(locationId);
    // Si une location est sélectionnée, charger ses données
    if (locationId) {
      try {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .single();
        
        if (data) {
          setLocationData({
            id: data.id,
            name: data.name,
            imageUrl: data.image_url,
            description: data.description,
          });
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    } else {
      setLocationData(undefined);
    }
    // Recharger les données complètes
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleRatingClick = async (newRating: number) => {
    if (isNewDesign) return;
    const finalRating = rating === newRating ? null : newRating;
    setRating(finalRating);
    try {
      await updateRating(item!.id, finalRating);
      toast.success(finalRating ? `Note: ${finalRating} étoile${finalRating > 1 ? 's' : ''}` : 'Note retirée');
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
      setRating(item!.rating || null);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{
        type: 'spring',
        damping: 40,
        stiffness: 350,
      }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-gradient-to-b from-white via-fracht-cream to-white shadow-2xl z-50 flex flex-col drawer-rounded"
      onClick={(e) => e.stopPropagation()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 glass-fracht border-b border-fracht-blue/10 px-5 py-4 flex items-center justify-between z-10">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTitle(item?.title || '');
                setIsEditingTitle(false);
              }
            }}
            className="flex-1 text-sm font-semibold text-gray-900 fracht-heading bg-transparent border-b-2 border-fracht-blue focus:outline-none"
            autoFocus
          />
        ) : (
          <h2 
            className={`text-sm font-semibold text-gray-900 truncate pr-2 fracht-heading ${isNewDesign ? '' : 'cursor-text hover:text-fracht-blue transition-colors'}`}
            onClick={() => !isNewDesign && setIsEditingTitle(true)}
          >
            {isNewDesign ? 'Nouveau Design' : title}
          </h2>
        )}
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-fracht-blue-soft rounded-lg transition-all duration-300 flex-shrink-0 group"
          aria-label="Fermer"
        >
          {/* @ts-ignore */}
          <HiX className="w-5 h-5 text-gray-600 group-hover:text-fracht-blue transition-colors" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Image Preview ou Zone de Drop */}
          {isNewDesign ? (
            <div 
              className="rounded-xl overflow-hidden bg-gray-100 shadow-sm border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {isUploading ? (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-fracht-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Upload en cours...</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  {/* @ts-ignore */}
                  <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold mb-2">Glissez-déposez une image</p>
                  <p className="text-gray-400 text-sm">ou</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 bg-fracht-blue text-white rounded-lg hover:bg-fracht-blue-dark transition-colors"
                  >
                    Sélectionner un fichier
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {/* Nom de l'affiche - Champ éditable */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block fracht-label">
              Nom de l'affiche
            </label>
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setTitle(item?.title || '');
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-fracht-blue/20 rounded-lg text-sm text-gray-900 fracht-title focus:outline-none focus:ring-2 focus:ring-fracht-blue/30"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="w-full px-3 py-2 bg-white/80 border border-fracht-blue/20 rounded-lg text-sm text-gray-900 fracht-title cursor-text hover:border-fracht-blue/40 transition-colors"
              >
                {title || 'Cliquez pour modifier le nom'}
              </div>
            )}
          </div>

          {/* Star Rating */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block fracht-label">
              Note
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star)}
                  className={`transition-all duration-200 ${
                    rating && star <= rating
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-300 hover:text-yellow-300 hover:scale-105'
                  }`}
                  aria-label={`Noter ${star} étoile${star > 1 ? 's' : ''}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              {rating && (
                <span className="ml-2 text-xs text-gray-600 fracht-title">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Emplacement - Preview et sélecteur */}
          {!isNewDesign && (
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block fracht-label">
              Emplacement
            </label>
            {locationData ? (
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100 border border-fracht-blue/20 flex-shrink-0">
                  <img
                    src={locationData.imageUrl}
                    alt={locationData.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 fracht-title truncate">
                    {locationData.name}
                  </p>
                  {locationData.description && (
                    <p className="text-xs text-gray-500 truncate">{locationData.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowLocationSelector(true)}
                  className="px-3 py-1.5 text-xs font-medium glass-fracht-blue text-gray-700 rounded-lg hover:bg-fracht-blue-soft transition-colors fracht-label"
                >
                  Changer
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLocationSelector(true)}
                className="w-full px-3 py-2.5 bg-white/80 border border-fracht-blue/20 rounded-lg text-sm text-gray-600 fracht-title hover:border-fracht-blue/40 transition-colors flex items-center justify-center gap-2"
              >
                {/* @ts-ignore */}
                <HiLocationMarker className="w-4 h-4" />
                Sélectionner un emplacement
              </button>
            )}
          </div>
          )}

          {/* Tags - Cliquables pour add/remove */}
          {!isNewDesign && (
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 block fracht-label">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {item!.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className="px-3 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm border hover:opacity-70 transition-opacity"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                  }}
                >
                  {tag.label} ×
                </button>
              ))}
            </div>
            {/* Tags disponibles */}
            <div className="flex flex-wrap gap-1.5">
              {availableTags
                .filter((tag) => !item!.tags.some((t) => t.id === tag.id))
                .slice(0, 5)
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium glass-fracht-blue text-gray-600 hover:bg-fracht-blue-soft transition-all"
                  >
                    {/* @ts-ignore */}
                    <HiPlus className="w-3 h-3 inline mr-1" />
                    {tag.name}
                  </button>
                ))}
            </div>
          </div>
          )}

          {/* Divider */}
          {!isNewDesign && <div className="h-px bg-gradient-to-r from-transparent via-fracht-blue/20 to-transparent"></div>}

          {/* Commentaires - Simple */}
          {!isNewDesign && (
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 block fracht-label">
              Commentaires
            </label>
            <div className="space-y-3 mb-3">
              {item!.feedback.map((comment) => (
                <div key={comment.id} className="glass-fracht-blue rounded-lg p-3.5 border border-fracht-blue/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-900 fracht-title">{comment.author}</span>
                    <span className="text-[10px] text-gray-500 fracht-label">{comment.timestamp}</span>
                  </div>
                  {comment.text && (
                    <p className="text-xs text-gray-700 mb-2 leading-relaxed">{comment.text}</p>
                  )}
                  {comment.audioUrl && (
                    <audio controls className="w-full mt-2 h-8" src={comment.audioUrl}>
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  )}
                </div>
              ))}
            </div>
            
            {/* Input commentaire simple */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Ajouter un commentaire..."
                className="flex-1 px-3 py-2 bg-white/80 border border-fracht-blue/20 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-fracht-blue/30 fracht-title"
              />
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-premium-lg'
                    : 'glass-fracht-blue text-gray-700 hover:bg-fracht-blue-soft'
                }`}
              >
                {isRecording ? (
                  <>
                    <Waveform isActive={isRecording} />
                    <span className="ml-1">{formatTime(recordingTime)}</span>
                  </>
                ) : (
                  // @ts-ignore
                  <HiMicrophone className="w-4 h-4" />
                )}
              </button>
              {commentText && (
                <button
                  onClick={handleAddComment}
                  className="px-3 py-2 bg-fracht-blue text-white rounded-lg text-xs font-medium hover:bg-fracht-blue-dark transition-colors"
                >
                  Envoyer
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="mt-2">
                <audio controls className="w-full h-8" src={audioUrl} />
              </div>
            )}
          </div>
          )}

          {/* Versions - Discret */}
          {!isNewDesign && item!.versionHistory.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-fracht-blue/20 to-transparent"></div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 block fracht-label">
                  Versions ({item!.versionHistory.length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {item!.versionHistory.map((version) => (
                    <div key={version.id} className="flex items-center gap-2 text-xs text-gray-600">
                      {/* @ts-ignore */}
                      <HiClock className="w-3 h-3" />
                      <span>v{version.version}</span>
                      <span className="text-[10px] text-gray-400">• {version.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Footer - Actions */}
      {!isNewDesign && (
      <div className="sticky bottom-0 glass-fracht border-t border-fracht-blue/10 px-5 py-4 flex gap-2.5 z-10">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 glass-fracht-blue text-gray-700 rounded-lg text-sm font-semibold hover:bg-fracht-blue-soft transition-all fracht-label disabled:opacity-50"
        >
          {/* @ts-ignore */}
          <FiUpload className="w-4 h-4" />
          {isUploading ? 'Upload...' : 'Nouvelle version'}
        </button>
        <button
          onClick={() => handleStatusChange('approved')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-premium-lg fracht-label"
        >
          {/* @ts-ignore */}
          <HiCheckCircle className="w-4 h-4" />
          Approuver
        </button>
        <button
          onClick={() => handleStatusChange('review')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-premium-lg fracht-label"
        >
          {/* @ts-ignore */}
          <HiXCircle className="w-4 h-4" />
          Modifier
        </button>
      </div>
      )}

      {/* Location Selector Modal */}
      {showLocationSelector && !isNewDesign && (
        <LocationSelector
          designId={item!.id}
          selectedLocationId={selectedLocationId}
          onSelect={handleLocationSelect}
          onClose={() => setShowLocationSelector(false)}
        />
      )}
    </motion.div>
  );
};
