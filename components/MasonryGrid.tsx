import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DesignItem } from '../types/fracht';
import { HiEye, HiStar } from 'react-icons/hi';
import { togglePin, reorderDesigns } from '../services/designs';
import toast from 'react-hot-toast';

interface MasonryGridProps {
  items: DesignItem[];
  onItemClick: (item: DesignItem) => void;
  onUpdate?: () => void;
  onReorder?: (reorderedItems: DesignItem[]) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({ items, onItemClick, onUpdate, onReorder }) => {
  const [columns, setColumns] = useState(4);
  const [imageLoaded, setImageLoaded] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<DesignItem[]>(items);
  const isReorderingRef = useRef(false);
  
  // Synchroniser localItems avec items quand ils changent (sauf pendant un reorder)
  useEffect(() => {
    if (!isReorderingRef.current) {
      setLocalItems(items);
    }
  }, [items]);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1920) setColumns(6);
      else if (width >= 1440) setColumns(5);
      else if (width >= 1024) setColumns(4);
      else if (width >= 768) setColumns(3);
      else setColumns(2);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const handleImageLoad = (itemId: string) => {
    setImageLoaded((prev) => new Set(prev).add(itemId));
  };

  const handlePinClick = async (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    try {
      await togglePin(item.id, !item.isPinned);
      toast.success(item.isPinned ? 'Épinglé retiré' : 'Épinglé');
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem !== itemId) {
      setDraggedOver(itemId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDraggedOver(null);
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }
    
    // Trouver les indices dans localItems
    const draggedIndex = localItems.findIndex((item) => item.id === draggedItem);
    const targetIndex = localItems.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // Sauvegarder l'ordre précédent pour rollback en cas d'erreur
    const previousItems = [...localItems];

    // ✅ MISE À JOUR OPTIMISTE IMMÉDIATE - Pas de rechargement, pas de skeleton
    const newItems = [...localItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    
    // Marquer qu'on est en train de réordonner
    isReorderingRef.current = true;
    
    // Appliquer immédiatement le nouvel ordre localement
    setLocalItems(newItems);
    
    // Notifier le parent pour synchroniser son state
    onReorder?.(newItems);

    // ✅ MISE À JOUR SUPABASE EN ARRIÈRE-PLAN (non-bloquant)
    // Préparer les updates pour Supabase
    const updates = newItems.map((item, index) => ({
      id: item.id,
      order_index: index,
    }));

    // Lancer la synchronisation en arrière-plan sans bloquer
    reorderDesigns(updates)
      .then(() => {
        // Succès silencieux - pas de toast pour éviter l'interruption
        // L'ordre est déjà appliqué visuellement
        isReorderingRef.current = false;
      })
      .catch((error) => {
        // En cas d'erreur, rollback vers l'ordre précédent
        console.error('Erreur lors de la synchronisation:', error);
        isReorderingRef.current = false;
        setLocalItems(previousItems);
        onReorder?.(previousItems);
        toast.error('Erreur lors de la synchronisation. Retour à l\'ordre précédent.');
      });
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400 text-sm">Aucun résultat trouvé</p>
      </div>
    );
  }

  return (
    <div
      className="masonry-container"
      style={{
        columnCount: columns,
        columnGap: '12px',
      }}
    >
      {localItems.map((item, index) => {
        const isLoaded = imageLoaded.has(item.id);

        const isDragged = draggedItem === item.id;
        const isDraggedOver = draggedOver === item.id;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isDragged ? 0.5 : 1, 
              y: 0,
              scale: isDraggedOver ? 1.02 : 1,
            }}
            transition={{
              duration: 0.5,
              delay: Math.min(index * 0.03, 0.6),
              ease: [0.4, 0, 0.2, 1],
            }}
            whileHover={{ y: -4 }}
            draggable
            onDragStart={(e) => handleDragStart(e as any, item.id)}
            onDragOver={(e) => handleDragOver(e as any, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e as any, item.id)}
            onDragEnd={handleDragEnd}
            className={`design-card bg-white rounded-[16px_18px_16px_18px] shadow-sm hover:shadow-premium-lg transition-all cursor-move overflow-hidden group relative mb-3 break-inside-avoid ${
              isDraggedOver ? 'ring-2 ring-fracht-blue' : ''
            } ${isDragged ? 'opacity-50' : ''}`}
            onClick={() => onItemClick(item)}
          >
            {/* Image Container - Hauteur naturelle */}
            <div className="relative overflow-hidden bg-gray-100">
              {!isLoaded && (
                <div className="absolute inset-0 skeleton" />
              )}
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className={`w-full h-auto transition-transform duration-700 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                } group-hover:scale-[1.02]`}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                }}
                onLoad={() => handleImageLoad(item.id)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+non+disponible';
                }}
              />
              
              {/* Overlay Gradient Fracht Blue */}
              <div className="absolute inset-0 overlay-fracht-blue opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="glass-fracht rounded-full p-3 shadow-premium-lg transform scale-90 group-hover:scale-100 transition-transform duration-500">
                  <HiEye className="w-5 h-5 text-fracht-blue" />
                </div>
              </div>

              {/* Pin Button - Top Left */}
              <button
                onClick={(e) => handlePinClick(e, item)}
                className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                  item.isPinned
                    ? 'bg-fracht-blue text-white opacity-100 shadow-lg'
                    : 'bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-fracht-blue hover:text-white'
                }`}
                aria-label={item.isPinned ? 'Retirer l\'épingle' : 'Épingler'}
              >
                <HiStar className={`w-4 h-4 ${item.isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Status Badge Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <StatusBadge status={item.status} />
              </div>

              {/* Rating Badge - Bottom Left */}
              {item.rating && (
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="bg-black/70 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-white text-xs font-semibold">{item.rating}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-3.5 bg-white">
              <h3 className="text-xs font-semibold text-gray-900 mb-1.5 line-clamp-1 fracht-title">{item.title}</h3>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500 truncate flex-1 fracht-label">{item.project}</p>
                <div className="flex gap-1 ml-2">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-sm border border-current/20"
                      style={{
                        backgroundColor: `${tag.color}12`,
                        color: tag.color,
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const StatusBadge: React.FC<{ status: DesignItem['status'] }> = ({ status }) => {
  const config = {
    draft: { label: 'Brouillon', className: 'bg-gray-500/95 text-white backdrop-blur-md border border-gray-400/30' },
    review: { label: 'Révision', className: 'bg-amber-500/95 text-white backdrop-blur-md border border-amber-400/30' },
    approved: { label: 'Approuvé', className: 'bg-emerald-500/95 text-white backdrop-blur-md border border-emerald-400/30' },
  };

  const { label, className } = config[status];

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${className} shadow-premium fracht-label`}>
      {label}
    </span>
  );
};
