import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DesignItem } from '../types/fracht';
import { 
  HiX, 
  HiClock,
  HiPlus,
  HiLocationMarker
} from 'react-icons/hi';
import { HiMicrophone } from 'react-icons/hi2';
import { FiUpload } from 'react-icons/fi';
import { Waveform } from './Waveform';
import { LocationSelector } from './LocationSelector';
import { 
  updateDesignTitle, 
  addComment,
  updateComment,
  deleteComment,
  getTags, 
  createTag,
  addTagToDesign, 
  removeTagFromDesign,
  addVersion,
  updateRating,
  updateDesignLocation
} from '../services/designs';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

interface DetailPanelProps {
  item: DesignItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (designId: string) => void;
  onDesignUpdate?: (design: DesignItem) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ item, isOpen, onClose, onUpdate, onDesignUpdate }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [commentText, setCommentText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null | undefined>(item.locationId);
  const [locationData, setLocationData] = useState(item.locationData);
  const [rating, setRating] = useState<number | null>(item.rating || null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    setTitle(item.title);
    setSelectedLocationId(item.locationId);
    setLocationData(item.locationData);
    setRating(item.rating || null);
    setIsEditingTitle(false); // Réinitialiser l'état d'édition
    loadTags();
    
    // Nettoyer le debounce si existant
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
  }, [item]);

  // Nettoyer le debounce au démontage
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
        titleDebounceRef.current = null;
      }
    };
  }, []);

  const loadTags = async () => {
    try {
      const tags = await getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleTitleSave = async (skipDebounce = false) => {
    // Annuler le debounce précédent si existant
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }

    if (!skipDebounce) {
      // Utiliser debounce pour éviter les syncs multiples
      titleDebounceRef.current = setTimeout(async () => {
        if (title.trim() === item.title.trim()) {
          setIsEditingTitle(false);
          return;
        }
        
        try {
          await updateDesignTitle(item.id, title.trim());
          setIsEditingTitle(false);
          toast.success('Titre mis à jour');
          // Mettre à jour l'état directement
          const updated = { ...item, title: title.trim() };
          onDesignUpdate?.(updated);
          onUpdate?.(item.id);
        } catch (error) {
          toast.error('Erreur lors de la mise à jour');
          console.error(error);
          // Restaurer le titre original en cas d'erreur
          setTitle(item.title);
        }
      }, 800); // 800ms de debounce
    } else {
      // Sauvegarde immédiate (Enter ou Escape)
      if (title.trim() === item.title.trim()) {
        setIsEditingTitle(false);
        return;
      }
      
      try {
        await updateDesignTitle(item.id, title.trim());
        setIsEditingTitle(false);
        toast.success('Titre mis à jour');
        const updated = { ...item, title: title.trim() };
        onDesignUpdate?.(updated);
        onUpdate?.(item.id);
      } catch (error) {
        toast.error('Erreur lors de la mise à jour');
        console.error(error);
        setTitle(item.title);
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && !audioUrl) return;

    try {
      let finalText = commentText.trim() || transcriptionText.trim();
      let finalAudioUrl = audioUrl;

      // Upload l'audio vers Supabase Storage si présent
      if (audioUrl && audioUrl.startsWith('blob:')) {
        try {
          setIsTranscribing(true);
          const response = await fetch(audioUrl);
          const audioBlob = await response.blob();
          const fileExt = 'webm';
          const fileName = `${item.id}/comments/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('files')
            .upload(fileName, audioBlob, {
              contentType: 'audio/webm',
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('files')
            .getPublicUrl(fileName);
          
          finalAudioUrl = publicUrl;
        } catch (error) {
          console.error('Erreur upload audio:', error);
          toast.error('Erreur lors de l\'upload de l\'audio');
        } finally {
          setIsTranscribing(false);
        }
      }

      const comment = await addComment(item.id, finalText || undefined, finalAudioUrl || undefined);
      toast.success('Commentaire ajouté');
      
      // Mettre à jour l'état avec le nouveau commentaire
      const newFeedback = {
        id: comment.id,
        author: comment.author,
        timestamp: new Date(comment.created_at).toISOString().split('T')[0],
        text: comment.text || undefined,
        audioUrl: comment.audio_url || undefined,
      };
      const updated = {
        ...item,
        feedback: [newFeedback, ...item.feedback],
      };
      onDesignUpdate?.(updated);
      
      setCommentText('');
      setAudioUrl(null);
      setTranscriptionText('');
      finalTranscriptRef.current = '';
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
      console.error(error);
    }
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText || '');
  };

  const handleSaveComment = async (commentId: string) => {
    try {
      await updateComment(commentId, editingCommentText || undefined);
      toast.success('Commentaire modifié');
      
      const updated = {
        ...item,
        feedback: item.feedback.map((f) =>
          f.id === commentId
            ? { ...f, text: editingCommentText || undefined }
            : f
        ),
      };
      onDesignUpdate?.(updated);
      
      setEditingCommentId(null);
      setEditingCommentText('');
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de la modification');
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    try {
      await deleteComment(commentId);
      toast.success('Commentaire supprimé');
      
      const updated = {
        ...item,
        feedback: item.feedback.filter((f) => f.id !== commentId),
      };
      onDesignUpdate?.(updated);
      
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  const handleTagToggle = async (tagId: string) => {
    const isTagged = item.tags.some((t) => t.id === tagId);
    
    try {
      if (isTagged) {
        await removeTagFromDesign(item.id, tagId);
        toast.success('Tag retiré');
        // Mettre à jour l'état directement
        const updated = {
          ...item,
          tags: item.tags.filter((t) => t.id !== tagId),
        };
        onDesignUpdate?.(updated);
      } else {
        await addTagToDesign(item.id, tagId);
        toast.success('Tag ajouté');
        // Trouver le tag dans availableTags pour l'ajouter
        const tagToAdd = availableTags.find((t) => t.id === tagId);
        if (tagToAdd) {
          const updated = {
            ...item,
            tags: [
              ...item.tags,
              {
                id: tagToAdd.id,
                label: tagToAdd.name,
                color: tagToAdd.color,
              },
            ],
          };
          onDesignUpdate?.(updated);
        }
      }
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de la modification du tag');
      console.error(error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreatingTag(true);
    try {
      // Générer une couleur aléatoire pour le nouveau tag
      const colors = ['#0B3C5D', '#4A90E2', '#E94B3C', '#9B59B6', '#27AE60', '#F5A623', '#16A085', '#E67E22'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newTag = await createTag(newTagName.trim(), randomColor);
      await loadTags(); // Recharger les tags
      
      // Ajouter automatiquement le tag au design
      await addTagToDesign(item.id, newTag.id);
      toast.success('Tag créé et ajouté');
      
      const updated = {
        ...item,
        tags: [
          ...item.tags,
          {
            id: newTag.id,
            label: newTag.name,
            color: newTag.color,
          },
        ],
      };
      onDesignUpdate?.(updated);
      setNewTagName('');
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de la création du tag');
      console.error(error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setTranscriptionText('');
      // Initialiser avec le texte existant dans le champ (si l'utilisateur a déjà tapé quelque chose)
      finalTranscriptRef.current = commentText.trim();

      // Démarrer la transcription avec Web Speech API
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            // Ajouter le texte final au texte accumulé
            finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + finalTranscript).trim();
            setTranscriptionText(finalTranscriptRef.current);
            // Mettre à jour le champ de commentaire avec le texte final accumulé
            setCommentText(finalTranscriptRef.current);
          } else if (interimTranscript) {
            // Afficher la transcription intermédiaire combinée avec le texte final accumulé
            setCommentText((finalTranscriptRef.current + ' ' + interimTranscript).trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Erreur de transcription:', event.error);
        };

        recognition.start();
      }

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
        // Arrêter la reconnaissance vocale
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
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
      // Arrêter la reconnaissance vocale
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      // S'assurer que le texte final accumulé est dans commentText
      if (finalTranscriptRef.current) {
        setCommentText(finalTranscriptRef.current);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName);

      const version = await addVersion(item.id, publicUrl, 'Nouvelle version uploadée');
      toast.success('Version uploadée avec succès');
      
      // Mettre à jour l'état avec la nouvelle version
      const newVersion = {
        id: version.id,
        version: version.version_number.toString(),
        timestamp: new Date(version.created_at).toISOString().split('T')[0],
        author: version.author,
        changes: version.changes || 'Nouvelle version',
      };
      const updated = {
        ...item,
        versionHistory: [newVersion, ...item.versionHistory],
      };
      onDesignUpdate?.(updated);
      
      onUpdate?.(item.id);
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
    
    // Mettre à jour dans Supabase
    await updateDesignLocation(item.id, locationId);
    
    // Si une location est sélectionnée, charger ses données
    let newLocationData = undefined;
    if (locationId) {
      try {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .single();
        
        if (data) {
          newLocationData = {
            id: data.id,
            name: data.name,
            imageUrl: data.image_url,
            description: data.description,
          };
          setLocationData(newLocationData);
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    } else {
      setLocationData(undefined);
    }
    
    // Mettre à jour l'état directement
    const updated = {
      ...item,
      locationId,
      locationData: newLocationData,
    };
    onDesignUpdate?.(updated);
    onUpdate?.(item.id);
  };

  const handleRatingClick = async (newRating: number) => {
    const finalRating = rating === newRating ? null : newRating;
    setRating(finalRating);
    try {
      await updateRating(item.id, finalRating);
      toast.success(finalRating ? `Note: ${finalRating} étoile${finalRating > 1 ? 's' : ''}` : 'Note retirée');
      
      // Mettre à jour l'état directement
      const updated = { ...item, rating: finalRating };
      onDesignUpdate?.(updated);
      
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
      setRating(item.rating || null);
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
      {/* Sticky Header - Compact */}
      <div className="sticky top-0 glass-fracht border-b border-fracht-blue/10 px-4 py-3 flex items-center justify-between z-10">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              // Ne pas sauvegarder automatiquement sur chaque changement
            }}
            onBlur={() => {
              // Ne sauvegarder que si le focus est vraiment perdu (pas juste un retour à la ligne)
              setTimeout(() => {
                if (document.activeElement !== titleInputRef.current) {
                  handleTitleSave();
                }
              }, 100);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTitleSave(true); // Sauvegarde immédiate
              }
              if (e.key === 'Escape') {
                setTitle(item.title);
                setIsEditingTitle(false);
                if (titleDebounceRef.current) {
                  clearTimeout(titleDebounceRef.current);
                  titleDebounceRef.current = null;
                }
              }
            }}
            className="flex-1 text-sm font-semibold text-gray-900 fracht-heading bg-transparent border-b-2 border-fracht-blue focus:outline-none"
            autoFocus
          />
        ) : (
          <h2 
            className="text-sm font-semibold text-gray-900 truncate pr-2 fracht-heading cursor-text hover:text-fracht-blue transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h2>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:bg-fracht-blue-soft rounded transition-all duration-200 flex-shrink-0 group"
          aria-label="Fermer"
        >
          <HiX className="w-3.5 h-3.5 text-gray-600 group-hover:text-fracht-blue transition-colors" {...({} as any)} />
        </button>
      </div>

      {/* Scrollable Content - Compact */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Image Preview - Compact - Utilise thumbnail */}
          <div className="rounded-lg overflow-hidden bg-gray-100 shadow-sm">
            <img
              src={item.thumbnailUrl || item.imageUrl}
              alt={item.title}
              className="w-full h-auto object-contain max-h-[300px]"
            />
          </div>

          {/* Actions rapides - Compact inline */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating - Compact */}
            <div className="flex items-center gap-0.5">
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
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Emplacement - Action rapide */}
            <button
              onClick={() => setShowLocationSelector(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                locationData
                  ? 'bg-fracht-blue/10 text-fracht-blue border border-fracht-blue/20'
                  : 'bg-white/80 border border-fracht-blue/20 text-gray-600 hover:border-fracht-blue/40'
              }`}
            >
              <HiLocationMarker className="w-3 h-3" {...({} as any)} />
              {locationData ? locationData.name : 'Emplacement'}
            </button>
          </div>


          {/* Tags - Compact inline */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className="px-2 py-0.5 rounded-full text-[9px] font-medium backdrop-blur-sm border hover:opacity-70 transition-opacity"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                  }}
                >
                  {tag.label} ×
                </button>
              ))}
              {/* Créer tag rapide */}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTagName.trim()) {
                      handleCreateTag();
                    }
                  }}
                  placeholder="+ tag"
                  className="w-16 px-2 py-0.5 bg-white/80 border border-fracht-blue/20 rounded-lg text-[9px] focus:outline-none focus:ring-1 focus:ring-fracht-blue/30 fracht-title"
                />
              </div>
            </div>
            {/* Tags disponibles - Afficher tous les tags */}
            {availableTags.filter((tag) => !item.tags.some((t) => t.id === tag.id)).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter((tag) => !item.tags.some((t) => t.id === tag.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className="px-2 py-0.5 rounded-full text-[9px] font-medium glass-fracht-blue text-gray-600 hover:bg-fracht-blue-soft transition-all"
                    >
                      {/* @ts-ignore */}
                      <HiPlus className="w-2.5 h-2.5 inline mr-0.5" />
                      {tag.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Commentaires - Compact */}
          <div>
            {/* Commentaires existants - Compact */}
            {item.feedback.length > 0 && (
              <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                {item.feedback.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="glass-fracht-blue rounded-lg p-2 border border-fracht-blue/10 group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-900 fracht-title">{comment.author}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 fracht-label">{comment.timestamp}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditComment(comment.id, comment.text || '')}
                            className="p-0.5 hover:bg-fracht-blue/20 rounded text-[8px] text-gray-600 hover:text-fracht-blue"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-0.5 hover:bg-red-100 rounded text-[8px] text-gray-600 hover:text-red-600"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-1 mt-1">
                        <input
                          type="text"
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveComment(comment.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-white/90 border border-fracht-blue/30 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-fracht-blue/30"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveComment(comment.id)}
                          className="px-2 py-1 bg-fracht-blue text-white rounded text-[9px] hover:bg-fracht-blue-dark"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[9px] hover:bg-gray-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        {comment.text && (
                          <p className="text-[10px] text-gray-700 leading-relaxed line-clamp-2">{comment.text}</p>
                        )}
                        {comment.audioUrl && (
                          <audio controls className="w-full mt-1 h-6" src={comment.audioUrl}>
                            Votre navigateur ne supporte pas l'élément audio.
                          </audio>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Input commentaire - Compact inline */}
            <div className="flex gap-1.5">
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
                placeholder="Commentaire..."
                className="flex-1 px-2.5 py-1.5 bg-white/80 border border-fracht-blue/20 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-fracht-blue/30 fracht-title"
              />
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-premium-lg'
                    : isTranscribing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'glass-fracht-blue text-gray-700 hover:bg-fracht-blue-soft'
                }`}
              >
                {isTranscribing ? (
                  <span className="text-[9px]">⏳</span>
                ) : isRecording ? (
                  <span className="text-[9px]">{formatTime(recordingTime)}</span>
                ) : (
                  <>
                    <HiMicrophone className="w-3 h-3" />
                  </>
                )}
              </button>
              {commentText && (
                <button
                  onClick={handleAddComment}
                  className="px-2.5 py-1.5 bg-fracht-blue text-white rounded-lg text-[10px] font-medium hover:bg-fracht-blue-dark transition-colors"
                >
                  ✓
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="mt-1.5">
                <audio controls className="w-full h-6" src={audioUrl} />
              </div>
            )}
          </div>

          {/* Versions - Très discret */}
          {item.versionHistory.length > 0 && (
            <div className="pt-1 border-t border-fracht-blue/10">
              <div className="flex items-center gap-1 text-[9px] text-gray-400">
                {/* @ts-ignore */}
                <HiClock className="w-2.5 h-2.5" />
                <span>{item.versionHistory.length} version{item.versionHistory.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer - Actions compactes */}
      <div className="sticky bottom-0 glass-fracht border-t border-fracht-blue/10 px-4 py-2.5 flex gap-2 z-10">
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
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 glass-fracht-blue text-gray-700 rounded-lg text-xs font-semibold hover:bg-fracht-blue-soft transition-all fracht-label disabled:opacity-50"
        >
          {/* @ts-ignore */}
          <FiUpload className="w-3 h-3" />
          {isUploading ? 'Upload...' : 'Version'}
        </button>
      </div>

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelector
          designId={item.id}
          selectedLocationId={selectedLocationId}
          onSelect={handleLocationSelect}
          onClose={() => setShowLocationSelector(false)}
        />
      )}
    </motion.div>
  );
};
