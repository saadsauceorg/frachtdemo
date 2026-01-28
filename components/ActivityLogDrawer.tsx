import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiClock, HiTag, HiChat, HiPhotograph, HiTrash, HiPencil, HiCheckCircle, HiLocationMarker, HiStar } from 'react-icons/hi';
import { ActivityLog, getRecentActivities, getAllActivities } from '../services/activityLog';
// Formatage de date simple sans dépendance externe

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDesignClick?: (designId: string) => void;
}

const getActivityIcon = (type: ActivityLog['activity_type']) => {
  switch (type) {
    case 'comment_added':
    case 'comment_edited':
    case 'comment_deleted':
      return <HiChat className="w-4 h-4" />;
    case 'tag_added':
    case 'tag_removed':
      return <HiTag className="w-4 h-4" />;
    case 'image_added':
    case 'image_deleted':
      return <HiPhotograph className="w-4 h-4" />;
    case 'version_added':
      return <HiPencil className="w-4 h-4" />;
    case 'title_updated':
      return <HiPencil className="w-4 h-4" />;
    case 'status_updated':
      return <HiCheckCircle className="w-4 h-4" />;
    case 'location_updated':
      return <HiLocationMarker className="w-4 h-4" />;
    case 'rating_updated':
      return <HiStar className="w-4 h-4" />;
    default:
      return <HiClock className="w-4 h-4" />;
  }
};

const getActivityColor = (type: ActivityLog['activity_type']) => {
  switch (type) {
    case 'comment_added':
    case 'comment_edited':
      return 'text-blue-600 bg-blue-50';
    case 'comment_deleted':
      return 'text-red-600 bg-red-50';
    case 'tag_added':
      return 'text-green-600 bg-green-50';
    case 'tag_removed':
      return 'text-orange-600 bg-orange-50';
    case 'image_added':
      return 'text-purple-600 bg-purple-50';
    case 'image_deleted':
      return 'text-red-600 bg-red-50';
    case 'version_added':
      return 'text-indigo-600 bg-indigo-50';
    case 'title_updated':
    case 'status_updated':
    case 'location_updated':
    case 'rating_updated':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({ isOpen, onClose, onDesignClick }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, showAll]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const data = showAll ? await getAllActivities(50) : await getRecentActivities(10);
      setActivities(data);
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesignClick = (designId: string, activity: ActivityLog) => {
    // Ne pas ouvrir si le design a été supprimé
    if (!activity.design_title || !onDesignClick) {
      return;
    }
    onDesignClick(designId);
    onClose();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min${diffMins > 1 ? 's' : ''}`;
      if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      
      // Format date complète si plus ancien
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Récemment';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white/95 via-white/90 to-white/95">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 fracht-heading">Historique des modifications</h2>
                <p className="text-sm text-gray-500 fracht-label mt-1">
                  {showAll ? 'Toutes les modifications' : '10 dernières modifications'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <HiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Toggle */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-fracht-blue hover:text-fracht-blue-dark font-medium fracht-label"
              >
                {showAll ? 'Voir seulement les 10 dernières' : 'Voir toutes les modifications'}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-fracht-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <HiClock className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm fracht-label">Aucune modification récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border border-gray-200 rounded-lg p-4 transition-shadow ${
                        activity.design_title ? 'hover:shadow-md cursor-pointer' : 'opacity-60 cursor-default'
                      }`}
                      onClick={() => handleDesignClick(activity.design_id, activity)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
                          {getActivityIcon(activity.activity_type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 fracht-label line-clamp-2">
                                {activity.description}
                              </p>
                              {activity.design_title && (
                                <p className="text-xs text-gray-500 mt-1 fracht-label truncate">
                                  {activity.design_title}
                                </p>
                              )}
                            </div>
                            {activity.design_image_url && (
                              <img
                                src={activity.design_image_url}
                                alt={activity.design_title || 'Design'}
                                className="w-12 h-12 rounded object-cover flex-shrink-0 border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400 fracht-label">
                              {formatTime(activity.created_at)}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400 fracht-label">
                              {activity.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
