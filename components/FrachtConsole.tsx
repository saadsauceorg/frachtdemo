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

export const FrachtConsole: React.FC = () => {
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
    groupBy: null,
    dateRange: { start: null, end: null },
  });

  // Charger les designs depuis Supabase
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      // Pas de setIsLoading(true) ici si on a déjà des données ou si on veut éviter le flash
      const data = await getDesigns();
      setDesigns(data);
    } catch (error) {
      console.error('Error loading designs:', error);
      toast.error('Erreur lors du chargement des designs');
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

  // Mettre à jour un design spécifique dans l'état local
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

  // Supprimer un design de l'état local (la suppression de la base de données est gérée par MasonryGrid)
  const handleDelete = useCallback((designId: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== designId));
    // Fermer le panel si l'item supprimé était sélectionné
    if (selectedItem && selectedItem.id === designId) {
      handleClosePanel();
    }
  }, [selectedItem, handleClosePanel]);

  // Ajouter une nouvelle image
  const handleAddImage = useCallback(async (file: File) => {
    try {
      const { uploadImageAndGetDimensions, createDesign } = await import('../services/designs');
      const { url, aspectRatio, width, height } = await uploadImageAndGetDimensions(file);
      const newDesign = await createDesign(url, aspectRatio, width, height);
      toast.success('Image ajoutée avec succès');
      // Ajouter le nouveau design à l'état local
      setDesigns((prev) => [...prev, newDesign]);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur inconnue lors de l\'ajout de l\'image';
      console.error('Erreur lors de l\'ajout de l\'image:', error);
      toast.error(errorMessage, {
        duration: 5000,
        description: errorMessage.includes('Bucket') 
          ? 'Vérifiez que le bucket "files" existe et est public dans Supabase Storage'
          : undefined
      });
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleAddImage(file);
    } else {
      toast.error('Veuillez déposer une image');
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
      <Header />
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
                      Déposez votre image ici
                    </p>
                    <p className="text-sm text-gray-600 mt-2 fracht-label">
                      Les images seront ajoutées automatiquement
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
                // Mettre à jour l'ordre dans l'état local
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
