import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DesignItem } from '../types/fracht';
import { HiStar, HiTrash, HiPencil, HiTag, HiLocationMarker, HiArrowsExpand } from 'react-icons/hi';
import { togglePin, deleteDesign, updateDesignsOrder } from '../services/designs';
import { toast } from 'sonner';
import { ConfirmationModal } from './ConfirmationModal';
import { LocationSelector } from './LocationSelector';
import { ImageFullscreenModal } from './ImageFullscreenModal';

interface MasonryGridProps {
  items: DesignItem[];
  onItemClick: (item: DesignItem) => void;
  onUpdate?: (designId: string) => void;
  onDelete?: (designId: string) => void;
  onReorder?: (items: DesignItem[]) => void;
}

interface SortableItemProps {
  item: DesignItem;
  index: number;
  isLoaded: boolean;
  onImageLoad: (id: string) => void;
  onItemClick: (item: DesignItem) => void;
  onPinClick: (e: React.MouseEvent, item: DesignItem) => void;
  onDeleteClick: (e: React.MouseEvent, item: DesignItem) => void;
  onEditClick: (e: React.MouseEvent, item: DesignItem) => void;
  onTagClick: (e: React.MouseEvent, item: DesignItem) => void;
  onLocationClick: (e: React.MouseEvent, item: DesignItem) => void;
  onFullscreenClick: (e: React.MouseEvent, item: DesignItem) => void;
  onLocationUpdate?: (designId: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  index,
  isLoaded,
  onImageLoad,
  onItemClick,
  onPinClick,
  onDeleteClick,
  onEditClick,
  onTagClick,
  onLocationClick,
  onFullscreenClick,
  onLocationUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="break-inside-avoid mb-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: Math.min(index * 0.03, 0.6),
          ease: [0.4, 0, 0.2, 1],
        }}
        whileHover={{ y: -4 }}
        className="design-card bg-white rounded-[16px_18px_16px_18px] shadow-sm hover:shadow-premium-lg transition-all overflow-hidden group relative"
        onClick={() => onItemClick(item)}
      >
        {/* Image Container */}
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
            onLoad={() => onImageLoad(item.id)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+non+disponible';
            }}
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 overlay-fracht-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Pin Button - Top Left */}
          <button
            onClick={(e) => onPinClick(e, item)}
            className={`absolute top-2 left-2 p-1 rounded backdrop-blur-sm transition-all duration-200 z-10 ${
              item.isPinned
                ? 'bg-fracht-blue text-white opacity-100'
                : 'bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-fracht-blue hover:text-white'
            }`}
            aria-label={item.isPinned ? 'Retirer l\'épingle' : 'Épingler'}
          >
            <HiStar className={`w-3 h-3 ${item.isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Top Right Actions (Drag Handle & Fullscreen) */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {/* Fullscreen Button */}
            <button
              onClick={(e) => onFullscreenClick(e, item)}
              className="p-1 rounded bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-fracht-blue-soft hover:text-fracht-blue transition-all duration-200 backdrop-blur-sm"
              aria-label="Ouvrir en plein écran"
              title="Ouvrir en plein écran"
            >
              <HiArrowsExpand className="w-3 h-3" />
            </button>

            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="p-1 rounded bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all duration-200 backdrop-blur-sm cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
              </svg>
            </div>
          </div>

          {/* Rating Badge - Bottom Left */}
          {item.rating && (
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-0.5">
                <span className="text-yellow-400 text-[10px]">⭐</span>
                <span className="text-white text-[10px] font-semibold">{item.rating}</span>
              </div>
            </div>
          )}

          {/* Location Badge - Bottom Right - Toujours visible si emplacement choisi */}
          {item.locationData && (
            <div className="absolute bottom-2 right-2 opacity-100 transition-opacity duration-200">
              <div className="bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1 border border-white/20">
                <HiLocationMarker className="w-2.5 h-2.5 text-white flex-shrink-0" />
                <span className="text-white text-[9px] font-semibold truncate max-w-[80px]">{item.locationData.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer - Avec boutons en bas à droite */}
        <div className="p-2 bg-white relative">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold text-gray-900 fracht-title">#{item.orderIndex + 1}</h3>
            <div className="flex gap-0.5 items-center">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium backdrop-blur-sm border border-current/20"
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
          {/* Boutons d'action en bas à droite */}
          <div className="flex items-center justify-end gap-1 mt-1.5">
            <button
              onClick={(e) => onLocationClick(e, item)}
              className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 ${
                item.locationData 
                  ? 'text-fracht-blue hover:bg-fracht-blue-soft' 
                  : 'text-gray-500 hover:bg-fracht-blue-soft hover:text-fracht-blue'
              }`}
              aria-label={item.locationData ? "Changer l'emplacement" : "Choisir un emplacement"}
              title={item.locationData ? `Emplacement: ${item.locationData.name}` : "Choisir un emplacement"}
            >
              <HiLocationMarker className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => onTagClick(e, item)}
              className="p-1 rounded text-gray-500 hover:bg-fracht-blue-soft hover:text-fracht-blue transition-all opacity-0 group-hover:opacity-100"
              aria-label="Ajouter tag"
              title="Ajouter tag"
            >
              <HiTag className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => onEditClick(e, item)}
              className="p-1 rounded text-gray-500 hover:bg-fracht-blue-soft hover:text-fracht-blue transition-all opacity-0 group-hover:opacity-100"
              aria-label="Modifier"
              title="Modifier"
            >
              <HiPencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => onDeleteClick(e, item)}
              className="p-1 rounded text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Supprimer"
              title="Supprimer"
            >
              <HiTrash className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const MasonryGrid: React.FC<MasonryGridProps> = ({ 
  items, 
  onItemClick, 
  onUpdate, 
  onDelete,
  onReorder 
}) => {
  const [columns, setColumns] = useState(4);
  const [imageLoaded, setImageLoaded] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: DesignItem | null }>({
    isOpen: false,
    item: null,
  });
  const [localItems, setLocalItems] = useState<DesignItem[]>(items);
  const [isReordering, setIsReordering] = useState(false);
  const [locationSelector, setLocationSelector] = useState<{ isOpen: boolean; item: DesignItem | null }>({
    isOpen: false,
    item: null,
  });
  const [fullscreenImage, setFullscreenImage] = useState<{ isOpen: boolean; item: DesignItem | null }>({
    isOpen: false,
    item: null,
  });

  useEffect(() => {
    setLocalItems(items);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleImageLoad = (itemId: string) => {
    setImageLoaded((prev) => new Set(prev).add(itemId));
  };

  const handlePinClick = async (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    try {
      await togglePin(item.id, !item.isPinned);
      toast.success(item.isPinned ? 'Épinglé retiré' : 'Épinglé');
      onUpdate?.(item.id);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, item });
  };

  const handleEditClick = (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    onItemClick(item);
  };

  const handleTagClick = (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    onItemClick(item);
    // Le panel s'ouvrira et l'utilisateur pourra ajouter des tags
  };

  const handleLocationClick = (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    setLocationSelector({ isOpen: true, item });
  };

  const handleFullscreenClick = (e: React.MouseEvent, item: DesignItem) => {
    e.stopPropagation();
    setFullscreenImage({ isOpen: true, item });
  };

  const handleLocationSelect = async (locationId: string | null) => {
    if (!locationSelector.item) return;
    
    // Mettre à jour l'état local immédiatement
    const updatedItems = localItems.map((item) => {
      if (item.id === locationSelector.item!.id) {
        return {
          ...item,
          locationId: locationId,
          locationData: locationId ? item.locationData : undefined, // Sera mis à jour par onUpdate
        };
      }
      return item;
    });
    setLocalItems(updatedItems);
    
    // Notifier le parent pour mettre à jour Supabase
    onUpdate?.(locationSelector.item.id);
    setLocationSelector({ isOpen: false, item: null });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await deleteDesign(deleteConfirm.item.id);
      toast.success('Design supprimé');
      onDelete?.(deleteConfirm.item.id);
      setDeleteConfirm({ isOpen: false, item: null });
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Mise à jour optimiste de l'UI
    const newItems = arrayMove(localItems, oldIndex, newIndex) as DesignItem[];
    setLocalItems(newItems);
    setIsReordering(true);

    // Mettre à jour les order_index dans Supabase
    try {
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      await updateDesignsOrder(updates);
      onReorder?.(newItems);
      toast.success('Ordre mis à jour');
    } catch (error) {
      // En cas d'erreur, restaurer l'ordre précédent
      setLocalItems(items);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
      console.error(error);
    } finally {
      setIsReordering(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400 text-sm">Aucun résultat trouvé</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Supprimer le design"
        message={`Êtes-vous sûr de vouloir supprimer le design #${deleteConfirm.item?.orderIndex !== undefined ? deleteConfirm.item.orderIndex + 1 : ''} ?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, item: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
      {locationSelector.isOpen && locationSelector.item && (
        <LocationSelector
          designId={locationSelector.item.id}
          selectedLocationId={locationSelector.item.locationId}
          onSelect={handleLocationSelect}
          onClose={() => setLocationSelector({ isOpen: false, item: null })}
        />
      )}
      <ImageFullscreenModal
        isOpen={fullscreenImage.isOpen}
        imageUrl={fullscreenImage.item?.imageUrl || ''}
        imageTitle={fullscreenImage.item?.title}
        onClose={() => setFullscreenImage({ isOpen: false, item: null })}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className="masonry-container"
            style={{
              columnCount: columns,
              columnGap: '12px',
            }}
          >
            {localItems.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                isLoaded={imageLoaded.has(item.id)}
                onImageLoad={handleImageLoad}
                onItemClick={onItemClick}
                onPinClick={handlePinClick}
                onDeleteClick={handleDeleteClick}
                onEditClick={handleEditClick}
                onTagClick={handleTagClick}
                onLocationClick={handleLocationClick}
                onFullscreenClick={handleFullscreenClick}
                onLocationUpdate={onUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
};
