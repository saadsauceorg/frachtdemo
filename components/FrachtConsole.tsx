import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { DesignItem, FilterState } from '../types/fracht';
import { MasonryGrid } from './MasonryGrid';
import { HorizontalScrollGallery } from './HorizontalScrollGallery';
import { DetailPanel } from './DetailPanel';
import { Header, ViewMode } from './Header';
import { Sidebar } from './Sidebar';
import { FilterBar } from './FilterBar';
import { getDesigns } from '../services/designs';
import '../styles/fracht.css';

export const FrachtConsole: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isNewDesignMode, setIsNewDesignMode] = useState(false);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('fracht_view_mode');
    return (saved === 'horizontal' || saved === 'grid') ? saved : 'grid';
  });
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
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('fracht_sidebar_visible');
    return saved === 'true';
  });

  // Charger les designs depuis Supabase
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      setIsLoading(true);
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
    setIsNewDesignMode(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const handleAddDesign = useCallback(() => {
    setSelectedItem(null);
    setIsNewDesignMode(true);
    setIsPanelOpen(true);
  }, []);

  // ✅ Callback pour ajout optimiste - Ajoute immédiatement sans recharger
  const handleDesignCreated = useCallback((newDesign: DesignItem) => {
    // Ajouter le nouveau design au début de la liste avec animation
    setDesigns((prev) => [newDesign, ...prev]);
    setIsPanelOpen(false);
    setIsNewDesignMode(false);
    setSelectedItem(null);
    toast.success('Design ajouté avec succès');
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleUpdate = useCallback(() => {
    loadDesigns();
    // Mettre à jour l'item sélectionné si nécessaire
    if (selectedItem) {
      getDesigns().then((data) => {
        const updated = data.find((d) => d.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      });
    }
  }, [selectedItem]);

  // ✅ Callback optimiste pour le reorder - Met à jour localement sans recharger
  const handleReorder = useCallback((reorderedItems: DesignItem[]) => {
    // Créer un map des nouveaux order_index depuis les items réordonnés
    // Utiliser la position dans reorderedItems comme nouvel order_index
    const newOrderMap = new Map<string, number>();
    reorderedItems.forEach((item, index) => {
      newOrderMap.set(item.id, index);
    });
    
    // Mettre à jour designs en préservant l'ordre des items réordonnés
    // et en gardant les autres items à leur place
    setDesigns((prevDesigns) => {
      // Créer un nouveau tableau avec les order_index mis à jour
      const updated = prevDesigns.map((design) => {
        const newIndex = newOrderMap.get(design.id);
        if (newIndex !== undefined) {
          // Item présent dans le reorder - utiliser le nouvel order_index
          return { ...design, order_index: newIndex };
        }
        // Item non présent dans le reorder - garder son order_index actuel
        return design;
      });
      
      // Trier par order_index pour maintenir l'ordre visuel
      return updated.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    });
    
    // Mettre à jour l'item sélectionné si nécessaire
    if (selectedItem) {
      const updated = reorderedItems.find((d) => d.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [selectedItem]);

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

  if (isLoading) {
    return (
      <div className="fracht-console min-h-screen bg-white grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fracht-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des designs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fracht-console min-h-screen bg-white grid-bg">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#111827',
            border: '1px solid rgba(11, 60, 93, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(11, 60, 93, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header 
        onAddDesign={handleAddDesign} 
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          localStorage.setItem('fracht_view_mode', mode);
        }}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={() => {
          const newVisibility = !sidebarVisible;
          setSidebarVisible(newVisibility);
          localStorage.setItem('fracht_sidebar_visible', String(newVisibility));
        }}
      />
      <div className="flex">
        <Sidebar isVisible={sidebarVisible} />
        <main className={`flex-1 pt-16 bg-fracht-cream/50 transition-all duration-300 ${sidebarVisible ? 'lg:ml-56' : ''} ${viewMode === 'horizontal' ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
          <FilterBar filters={filters} onFilterChange={handleFilterChange} items={designs} />
          <div className="px-4 md:px-6 py-6 md:py-8">
            {viewMode === 'grid' ? (
              <MasonryGrid 
                items={filteredItems} 
                onItemClick={handleItemClick} 
                onUpdate={handleUpdate}
                onReorder={handleReorder}
              />
            ) : (
              <HorizontalScrollGallery 
                items={filteredItems} 
                onItemClick={handleItemClick} 
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {(isPanelOpen && (selectedItem || isNewDesignMode)) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-fracht-blue-overlay backdrop-blur-md z-40"
              onClick={handleClosePanel}
            />
            <DetailPanel
              item={selectedItem}
              isOpen={isPanelOpen}
              onClose={handleClosePanel}
              onUpdate={handleUpdate}
              onDesignCreated={handleDesignCreated}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
