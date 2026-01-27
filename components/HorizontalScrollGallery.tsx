import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DesignItem } from '../types/fracht';
import { HiEye, HiStar, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { togglePin } from '../services/designs';
import toast from 'react-hot-toast';

interface HorizontalScrollGalleryProps {
  items: DesignItem[];
  onItemClick: (item: DesignItem) => void;
  onUpdate?: () => void;
}

export const HorizontalScrollGallery: React.FC<HorizontalScrollGalleryProps> = ({ 
  items, 
  onItemClick, 
  onUpdate 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState<Set<string>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Calculer la hauteur fixe et la largeur variable selon le ratio
  const CARD_HEIGHT = 420; // Hauteur fixe raisonnable
  const GAP = 16; // Espacement entre les cards
  const PEEK_AMOUNT = 140; // Partie visible de la 4ème image (peek effect) - Augmenté pour meilleure visibilité

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    };

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [items]);

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

  // Drag swipe handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.userSelect = '';
  };

  const handleMouseUp = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.userSelect = '';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplier pour un scroll plus rapide
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Scroll avec boutons flèches
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // Scroll de 80% de la largeur visible
    const targetScroll = 
      direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  // Calculer la largeur de chaque card selon son aspect ratio
  const getCardWidth = (aspectRatio: number | undefined) => {
    // Si aspectRatio n'est pas défini, utiliser une valeur par défaut (1.5 = 3:2)
    const ratio = aspectRatio && aspectRatio > 0 ? aspectRatio : 1.5;
    return CARD_HEIGHT * ratio;
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400 text-sm">Aucun résultat trouvé</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Boutons flèches - Discrets */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white transition-all opacity-80 hover:opacity-100 border border-fracht-blue/10"
          aria-label="Scroll gauche"
        >
          <HiChevronLeft className="w-6 h-6 text-fracht-blue" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white transition-all opacity-80 hover:opacity-100 border border-fracht-blue/10"
          aria-label="Scroll droite"
        >
          <HiChevronRight className="w-6 h-6 text-fracht-blue" />
        </button>
      )}

      {/* Container de scroll horizontal */}
      <div
        ref={scrollContainerRef}
        className="horizontal-scroll-container overflow-x-auto overflow-y-hidden pb-4"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex"
          style={{
            paddingLeft: '24px',
            paddingRight: `${PEEK_AMOUNT}px`,
            gap: `${GAP}px`,
            height: `${CARD_HEIGHT + 100}px`, // Hauteur fixe + espace pour le footer
          }}
        >
          {items.map((item, index) => {
            const isLoaded = imageLoaded.has(item.id);
            const cardWidth = getCardWidth(item.aspectRatio);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.05, 0.6),
                  ease: [0.4, 0, 0.2, 1],
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="design-card-horizontal bg-white rounded-[16px_18px_16px_18px] shadow-sm hover:shadow-premium-lg transition-all cursor-pointer overflow-hidden group relative flex-shrink-0"
                style={{
                  width: `${cardWidth}px`,
                  height: `${CARD_HEIGHT + 100}px`,
                }}
                onClick={() => onItemClick(item)}
              >
                {/* Image Container - Hauteur fixe */}
                <div 
                  className="relative overflow-hidden bg-gray-100"
                  style={{ height: `${CARD_HEIGHT}px` }}
                >
                  {!isLoaded && (
                    <div className="absolute inset-0 skeleton" />
                  )}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className={`w-full h-full object-contain transition-transform duration-700 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    } group-hover:scale-[1.05]`}
                    style={{
                      display: 'block',
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
      </div>

      {/* Masquer la scrollbar mais garder le scroll */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
