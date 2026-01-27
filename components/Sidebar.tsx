import React, { useState } from 'react';
import { GroupByOption } from '../types/fracht';
import { 
  HiCollection, 
  HiClock, 
  HiStar, 
  HiArchive,
  HiFolder,
  HiLocationMarker,
  HiUserGroup,
  HiStatusOnline,
  HiCalendar
} from 'react-icons/hi';

interface SidebarProps {
  onGroupByChange?: (groupBy: GroupByOption | null) => void;
  isVisible?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isVisible = false }) => {
  const [activeItem, setActiveItem] = useState<string>('all');

  const menuItems = [
    { id: 'all', label: 'Tous les projets', icon: HiCollection },
    { id: 'recent', label: 'Récents', icon: HiClock },
    { id: 'favorites', label: 'Favoris', icon: HiStar },
    { id: 'archived', label: 'Archivés', icon: HiArchive },
  ];

  const groupByIcons: Record<GroupByOption, typeof HiFolder> = {
    project: HiFolder,
    location: HiLocationMarker,
    client: HiUserGroup,
    status: HiStatusOnline,
    date: HiCalendar,
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-56 glass-fracht border-r border-fracht-blue/10 overflow-y-auto">
      <nav className="p-3 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeItem === item.id
                  ? 'bg-gradient-to-r from-fracht-blue to-fracht-blue-light text-white shadow-premium'
                  : 'text-gray-700 hover:bg-fracht-blue-soft fracht-title'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-fracht-blue/10 mt-3">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 fracht-label">
          Regrouper par
        </h3>
        <div className="space-y-1">
          {(['project', 'location', 'client', 'status', 'date'] as GroupByOption[]).map((option) => {
            const Icon = groupByIcons[option];
            return (
              <button
                key={option}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-fracht-blue-soft transition-all duration-300 capitalize fracht-title"
              >
                <Icon className="w-4 h-4" />
                {option === 'project' && 'Projet'}
                {option === 'location' && 'Localisation'}
                {option === 'client' && 'Client'}
                {option === 'status' && 'Statut'}
                {option === 'date' && 'Date'}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
