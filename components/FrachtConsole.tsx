import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { DesignItem, FilterState } from '../types/fracht';
import { MasonryGrid } from './MasonryGrid';
import { DetailPanel } from './DetailPanel';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FilterBar } from './FilterBar';
import { getDesigns, getDesignById } from '../services/designs';
import '../styles/fracht.css';

interface FrachtConsoleProps {
  onLogout?: () => void;
}

export const FrachtConsole: React.FC<FrachtConsoleProps> = ({ onLogout }) => {
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedTags: [],
    selectedStatus: [],
    selectedProjects: [],
    selectedClients: [],
    selectedLocations: [],
    showPinnedOnly: false,
    locationFilter: 'all',
    groupBy: null,
    dateRange: { start: null, end: null },
    sortBy: 'default',
  });

  // Charger les designs depuis Supabase
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const data = await getDesigns();
      setDesigns(data);
    } catch (error) {
      console.error('Error loading designs:', error);
      toast.error('Erreur lors du chargement des designs');
      setDesigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = [...designs];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.project.toLowerCase().includes(searchLower) ||
          item.client.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower) ||
          item.tags.some((tag) => tag.label.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.selectedStatus.length > 0) {
      items = items.filter((item) => filters.selectedStatus.includes(item.status));
    }

    // Tags filter
    if (filters.selectedTags.length > 0) {
      items = items.filter((item) =>
        item.tags.some((tag) => filters.selectedTags.includes(tag.id))
      );
    }

    // Projects filter
    if (filters.selectedProjects.length > 0) {
      items = items.filter((item) => filters.selectedProjects.includes(item.project));
    }

    // Clients filter
    if (filters.selectedClients.length > 0) {
      items = items.filter((item) => filters.selectedClients.includes(item.client));
    }

    // Locations filter
    if (filters.selectedLocations.length > 0) {
      items = items.filter((item) => filters.selectedLocations.includes(item.location));
    }

    // Pinned filter
    if (filters.showPinnedOnly) {
      items = items.filter((item) => item.isPinned === true);
    }

    // Location filter (Affectés / Non affectés)
    if (filters.locationFilter === 'assigned') {
      items = items.filter((item) => item.locationId !== null && item.locationId !== undefined);
    } else if (filters.locationFilter === 'unassigned') {
      items = items.filter((item) => !item.locationId);
    }

    // Trier : les photos épinglées en premier, puis les autres
    items = items.sort((a, b) => {
      // Priorité 1: Les épinglées d'abord
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Si les deux sont épinglées ou non épinglées, respecter l'ordre existant
      // Priorité 2: order_index pour maintenir l'ordre de drag & drop
      if (a.isPinned && b.isPinned) {
        const orderA = a.orderIndex ?? 0;
        const orderB = b.orderIndex ?? 0;
        if (orderA !== orderB) return orderA - orderB;
      }
      
      // Priorité 3: Sort by rating si spécifié
      if (filters.sortBy === 'rating_desc') {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (ratingA !== ratingB) return ratingB - ratingA;
      } else if (filters.sortBy === 'rating_asc') {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (ratingA !== ratingB) return ratingA - ratingB;
      }
      
      // Priorité 4: Date de création (plus récent en premier)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return items;
  }, [designs, filters]);

  const handleItemClick = useCallback((item: DesignItem) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Mettre à jour un design spécifique dans l'état
  const updateDesignInState = useCallback((updatedDesign: DesignItem) => {
    setDesigns((prev) => 
      prev.map((d) => (d.id === updatedDesign.id ? updatedDesign : d))
    );
    // Mettre à jour l'item sélectionné si c'est celui qui a été modifié
    if (selectedItem && selectedItem.id === updatedDesign.id) {
      setSelectedItem(updatedDesign);
    }
  }, [selectedItem]);

  // Fonction pour recharger un design depuis Supabase si nécessaire
  const refreshDesign = useCallback(async (designId: string) => {
    const updated = await getDesignById(designId);
    if (updated) {
      updateDesignInState(updated);
    }
  }, [updateDesignInState]);

  // handleUpdate accepte maintenant un designId optionnel pour recharger seulement ce design
  const handleUpdate = useCallback((designId?: string) => {
    if (designId) {
      // Recharger seulement ce design
      refreshDesign(designId);
    } else {
      // Recharger tout (seulement si vraiment nécessaire)
      loadDesigns();
    }
  }, [refreshDesign]);

  // Supprimer un design de l'état (la suppression de la base de données est gérée par MasonryGrid)
  const handleDelete = useCallback((designId: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== designId));
    // Fermer le panel si l'item supprimé était sélectionné
    if (selectedItem && selectedItem.id === designId) {
      handleClosePanel();
    }
  }, [selectedItem, handleClosePanel]);

  // Ajouter une nouvelle image (sans toast individuel pour permettre le batch)
  const handleAddImage = useCallback(async (file: File, showToast: boolean = false) => {
    try {
      const { uploadImageAndGetDimensions, createDesign } = await import('../services/designs');
      const { originalUrl, thumbUrl, aspectRatio, width, height } = await uploadImageAndGetDimensions(file);
      const newDesign = await createDesign(originalUrl, thumbUrl, aspectRatio, width, height);
      if (showToast) {
        toast.success('Image ajoutée avec succès');
      }
      // Ajouter le nouveau design à l'état
      setDesigns((prev) => [...prev, newDesign]);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur inconnue lors de l\'ajout de l\'image';
      console.error('Erreur lors de l\'ajout de l\'image:', error);
      throw error; // Propager l'erreur pour le gestionnaire batch
    }
  }, []);

  // Gérer le drag & drop sur la grille
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ne pas désactiver si on entre dans un enfant
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const fileList = Array.from(e.dataTransfer.files) as File[];
    const files = fileList.filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) {
      toast.error('Veuillez déposer des images');
      return;
    }
    
    // Créer un toast persistant avec progression
    const toastId = toast.loading(`Upload en cours: 0/${files.length} images`, {
      duration: Infinity, // Reste affiché jusqu'à ce qu'on le ferme manuellement
    });
    
    let processedCount = 0;
    const totalFiles = files.length;
    
    // Fonction pour mettre à jour le toast
    const updateProgress = () => {
      processedCount++;
      const percentage = Math.round((processedCount / totalFiles) * 100);
      toast.loading(
        `Upload en cours: ${processedCount}/${totalFiles} images (${percentage}%)`,
        { id: toastId, duration: Infinity }
      );
    };
    
    // Traiter toutes les images en parallèle avec suivi de progression
    const promises = files.map(async (file) => {
      try {
        await handleAddImage(file, false);
        updateProgress();
        return { status: 'fulfilled' as const };
      } catch (error) {
        updateProgress();
        return { status: 'rejected' as const, error };
      }
    });
    
    try {
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;
      
      // Fermer le toast de progression
      toast.dismiss(toastId);
      
      if (successCount > 0) {
        toast.success(`${successCount} image(s) ajoutée(s) avec succès`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} image(s) n'ont pas pu être ajoutée(s)`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout des images:', error);
      toast.dismiss(toastId);
      toast.error('Erreur lors de l\'ajout des images');
    }
  }, [handleAddImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Close panel on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        handleClosePanel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isPanelOpen, handleClosePanel]);

  // Timeout de sécurité pour éviter le blocage
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      console.warn('Chargement trop long, arrêt du loading');
      setIsLoading(false);
    }, 10000); // 10 secondes max
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading && designs.length === 0) {
    return (
      <div className="fracht-console min-h-screen bg-white grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fracht-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des designs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fracht-console min-h-screen bg-white grid-bg">
      <Toaster position="top-right" />
      <Header 
        onDesignClick={(designId) => {
          const design = designs.find(d => d.id === designId);
          if (design) {
            handleItemClick(design);
          }
        }}
        onLogout={onLogout}
      />
      <div className="flex">
        <main className="flex-1 pt-16 bg-fracht-cream/50">
          <FilterBar filters={filters} onFilterChange={handleFilterChange} items={designs} />
          <div 
            className={`px-4 md:px-6 py-6 md:py-8 relative transition-all duration-300 ${
              isDragging ? 'bg-fracht-blue/5' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="glass-fracht-blue border-2 border-dashed border-fracht-blue rounded-2xl p-12 backdrop-blur-md">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📷</div>
                    <p className="text-lg font-semibold text-fracht-blue fracht-heading">
                      Déposez vos images ici
                    </p>
                    <p className="text-sm text-gray-600 mt-2 fracht-label">
                      Vous pouvez déposer plusieurs images à la fois
                    </p>
                  </div>
                </div>
              </div>
            )}
            <MasonryGrid 
              items={filteredItems} 
              onItemClick={handleItemClick} 
              onUpdate={(designId) => handleUpdate(designId)}
              onDelete={handleDelete}
              onReorder={(reorderedItems) => {
                // Mettre à jour l'ordre dans l'état
                const reorderedIds = reorderedItems.map(item => item.id);
                setDesigns((prev) => {
                  const sorted = [...prev].sort((a, b) => {
                    const indexA = reorderedIds.indexOf(a.id);
                    const indexB = reorderedIds.indexOf(b.id);
                    return indexA === -1 ? 1 : indexB === -1 ? -1 : indexA - indexB;
                  });
                  return sorted;
                });
              }}
            />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isPanelOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={handleClosePanel}
            />
            <DetailPanel
              item={selectedItem}
              isOpen={isPanelOpen}
              onClose={handleClosePanel}
              onUpdate={(designId) => handleUpdate(designId)}
              onDesignUpdate={updateDesignInState}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
