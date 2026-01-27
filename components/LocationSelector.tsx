import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiX } from 'react-icons/hi';
import { getLocations, updateDesignLocation, LocationDB } from '../services/designs';
import toast from 'react-hot-toast';

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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fracht-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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

          {/* Galerie scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
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
                return (
                  <motion.button
                    key={location.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(location.id)}
                    disabled={isSaving}
                    className={`relative group rounded-xl overflow-hidden bg-gray-100 border-2 transition-all ${
                      isSelected
                        ? 'border-fracht-blue shadow-lg ring-4 ring-fracht-blue/20'
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>

                    {/* Nom de l'emplacement */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-xs font-semibold text-white fracht-title truncate">
                        {location.name}
                      </p>
                    </div>

                    {/* Check icon si sélectionné */}
                    {isSelected && (
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
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
