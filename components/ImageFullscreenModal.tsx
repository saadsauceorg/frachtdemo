import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';

interface ImageFullscreenModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageTitle?: string;
  onClose: () => void;
}

export const ImageFullscreenModal: React.FC<ImageFullscreenModalProps> = ({
  isOpen,
  imageUrl,
  imageTitle,
  onClose,
}) => {
  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body quand le modal est ouvert
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none p-4"
            onClick={onClose}
          >
            <div
              className="relative max-w-[95vw] max-h-[95vh] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm z-10"
                aria-label="Fermer"
              >
                <HiX className="w-5 h-5" />
              </button>

              {/* Image Container - Respecte le ratio */}
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={imageTitle || 'Image en plein écran'}
                  className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  style={{
                    display: 'block',
                  }}
                />
                
                {/* Title overlay (optionnel) */}
                {imageTitle && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                    <p className="text-white text-sm font-medium">{imageTitle}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
