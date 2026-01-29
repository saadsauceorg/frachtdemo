import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';
import { getDesigns } from '../services/designs';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ isOpen, onClose, onLogout, userEmail }) => {
  // Déterminer les informations utilisateur selon l'email
  const getUserInfo = () => {
    if (userEmail === 'faycal.rabia@ma.fracht.africa') {
      return {
        name: 'Fayçal Rabia',
        email: 'faycal.rabia@ma.fracht.africa',
        avatar: '/avatarfaycal.jpg'
      };
    }
    // Par défaut pour Salma
    return {
      name: 'Salma ELkasri',
      email: 'salma.elkasri@ma.fracht.africa',
      avatar: '/avatar.jpg'
    };
  };

  const userInfo = getUserInfo();
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [pinnedCount, setPinnedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCounts();
    }
  }, [isOpen]);

  const loadCounts = async () => {
    try {
      setIsLoading(true);
      const designs = await getDesigns();
      // Assets validés = photos attachées à un emplacement
      const assigned = designs.filter((design) => design.locationId !== null && design.locationId !== undefined);
      // Photos épinglées
      const pinned = designs.filter((design) => design.isPinned === true);
      setAssignedCount(assigned.length);
      setPinnedCount(pinned.length);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setAssignedCount(0);
      setPinnedCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Overlay Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-3 md:right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-fracht-blue to-fracht-blue-light p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold fracht-heading">Profil utilisateur</h3>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={userInfo.avatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <p className="font-semibold fracht-heading">{userInfo.name}</p>
                  <p className="text-xs text-white/80 fracht-label">{userInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Stats - Compact côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                {/* Assets validés */}
                <div className="bg-gradient-to-br from-fracht-blue/5 to-fracht-blue-light/5 rounded-lg p-3 border border-fracht-blue/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 fracht-label mb-1">Assets validés</p>
                      {isLoading ? (
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-fracht-blue fracht-heading">
                          {assignedCount}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-fracht-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-fracht-blue"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Photos épinglées */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 border border-amber-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 fracht-label mb-1">Épinglées</p>
                      {isLoading ? (
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-amber-700 fracht-heading">
                          {pinnedCount}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-amber-200/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-amber-700"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all duration-200 font-medium fracht-label border border-red-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Se déconnecter</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
