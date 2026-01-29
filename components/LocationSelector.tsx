import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiX, HiCamera, HiTrash } from 'react-icons/hi';
import { getLocations, updateDesignLocation, createLocation, deleteLocation, LocationDB } from '../services/designs';
import { toast } from 'sonner';

interface LocationSelectorProps {
  designId: string;
  selectedLocationId: string | null | undefined;
  onSelect: (locationId: string | null) => void;
  onClose: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  designId,
  selectedLocationId,
  onSelect,
  onClose,
}) => {
  const [locations, setLocations] = useState<LocationDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Erreur lors du chargement des emplacements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (locationId: string | null) => {
    setIsSaving(true);
    try {
      await updateDesignLocation(designId, locationId);
      onSelect(locationId);
      toast.success('Emplacement mis à jour');
      onClose();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    
    // Première confirmation
    if (pendingDeleteId !== locationId) {
      setPendingDeleteId(locationId);
      toast('', { duration: 2000 }); // Toast sans texte
      return;
    }

    // Deuxième confirmation - Supprimer réellement
    try {
      await deleteLocation(locationId);
      await loadLocations();
      setPendingDeleteId(null);
      
      // Si l'emplacement supprimé était sélectionné, désélectionner
      if (selectedLocationId === locationId) {
        await handleSelect(null);
      }
      
      toast.success('Emplacement supprimé');
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
      setPendingDeleteId(null);
    }
  };


  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
  };

  const processImageFile = async (file: File) => {
    // Générer un nom automatique si aucun nom n'est fourni
    const locationName = newLocationName.trim() || `Emplacement ${new Date().toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    setIsCreatingLocation(true);
    try {
      const newLocation = await createLocation(locationName, file);
      await loadLocations();
      await handleSelect(newLocation.id);
      setNewLocationName('');
      toast.success('Emplacement créé');
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreatingLocation(false);
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Caméra arrière sur mobile
        } 
      });
      
      streamRef.current = stream;
      setShowCamera(true);
      
      // Attendre que la vidéo soit prête
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error: any) {
      console.error('Erreur accès caméra:', error);
      // Si getUserMedia échoue, utiliser l'input file avec capture comme fallback
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        toast.error('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          await processImageFile(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Nettoyer le stream quand le composant se démonte
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      {/* Modal caméra - au-dessus de tout */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center"
          >
            <div className="relative w-full max-w-2xl aspect-[3/4] bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-3 bg-fracht-blue text-white rounded-lg font-medium hover:bg-fracht-blue-dark transition-colors"
                  >
                    Capturer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal sélection emplacement */}
      <AnimatePresence>
        {!showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 glass-fracht border-b border-fracht-blue/10 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-gray-900 fracht-heading">
                  Sélectionner un emplacement
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-fracht-blue-soft rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <HiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Créer nouvel emplacement - Simple */}
              <div className="px-6 py-3 border-b border-fracht-blue/10 bg-gray-50/50 relative z-20">
                <div className="flex gap-2 relative z-30">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Nom de l'emplacement (optionnel)..."
                    className="flex-1 px-3 py-2 bg-white border border-fracht-blue/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/30 fracht-title"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isCreatingLocation) {
                        startCamera();
                      }
                    }}
                    disabled={isCreatingLocation}
                    className="px-4 py-2 bg-fracht-blue text-white rounded-lg text-sm font-medium hover:bg-fracht-blue-dark transition-colors flex items-center gap-2 fracht-label cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Prendre une photo"
                  >
                    <HiCamera className="w-4 h-4" />
                    PHOTO
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isCreatingLocation && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={isCreatingLocation}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors fracht-label cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Choisir un fichier"
                  >
                    📁
                  </button>
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageCapture}
                  className="hidden"
                />
              </div>

          {/* Galerie scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fracht-blue mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 fracht-label">Chargement des emplacements...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Option "Aucun emplacement" */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(null)}
                  disabled={isSaving}
                  className={`relative group rounded-xl overflow-hidden bg-gray-50 border-2 transition-all ${
                    selectedLocationId === null
                      ? 'border-fracht-blue shadow-lg ring-4 ring-fracht-blue/20'
                      : 'border-gray-200 hover:border-fracht-blue/40'
                  }`}
                >
                  <div className="aspect-[3/4] flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                        <HiX className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-600 fracht-title">Aucun</p>
                    </div>
                  </div>
                  {selectedLocationId === null && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-fracht-blue rounded-full p-1">
                        <HiCheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </motion.button>

                {/* Emplacements */}
                {locations.map((location) => {
                  const isSelected = selectedLocationId === location.id;
                  const isPendingDelete = pendingDeleteId === location.id;
                  return (
                    <motion.button
                      key={location.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Si en attente de suppression, annuler la suppression au lieu de sélectionner
                        if (isPendingDelete) {
                          setPendingDeleteId(null);
                        } else {
                          handleSelect(location.id);
                        }
                      }}
                      disabled={isSaving}
                      className={`relative group rounded-xl overflow-hidden bg-gray-100 border-2 transition-all ${
                        isSelected
                          ? 'border-fracht-blue shadow-lg ring-4 ring-fracht-blue/20'
                          : isPendingDelete
                          ? 'border-red-500 shadow-lg ring-4 ring-red-500/20'
                          : 'border-gray-200 hover:border-fracht-blue/40'
                      }`}
                    >
                      {/* Image avec ratio naturel */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <img
                          src={location.image_url}
                          alt={location.name}
                          className="w-full h-full object-contain"
                        />
                        {/* Overlay au survol */}
                        <div className={`absolute inset-0 transition-colors ${
                          isPendingDelete ? 'bg-red-500/20' : 'bg-black/0 group-hover:bg-black/10'
                        }`} />
                      </div>

                      {/* Nom de l'emplacement */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-xs font-semibold text-white fracht-title truncate">
                          {location.name}
                        </p>
                      </div>

                      {/* Bouton de suppression */}
                      <button
                        onClick={(e) => handleDeleteClick(e, location.id)}
                        className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all ${
                          isPendingDelete
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500'
                        }`}
                        title={isPendingDelete ? 'Cliquer à nouveau pour confirmer la suppression' : 'Supprimer l\'emplacement'}
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>

                      {/* Check icon si sélectionné */}
                      {isSelected && !isPendingDelete && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="bg-fracht-blue rounded-full p-1 shadow-lg">
                            <HiCheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </motion.div>
                      )}

                      {/* Indicateur de confirmation de suppression */}
                      {isPendingDelete && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="bg-red-500 rounded-full p-1 shadow-lg">
                            <HiX className="w-5 h-5 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
