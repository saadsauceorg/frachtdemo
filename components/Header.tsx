import React, { useState } from 'react';
import { HiBell, HiPlus } from 'react-icons/hi';
import { ActivityLogDrawer } from './ActivityLogDrawer';
import { ProfileOverlay } from './ProfileOverlay';

interface HeaderProps {
  onAddDesign?: () => void;
  onDesignClick?: (designId: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddDesign, onDesignClick, onLogout }) => {
  const [avatarError, setAvatarError] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md border-b border-fracht-blue/10 z-30 flex items-center px-3 md:px-6 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo Fracht officiel */}
          <img 
            src="https://www.frachtgroup.com/themes/custom/fracht/images/frachtlogowhite.png" 
            alt="Fracht Group"
            className="h-7 md:h-8 w-auto"
            style={{ filter: 'brightness(0) saturate(100%) invert(9%) sepia(47%) saturate(2000%) hue-rotate(180deg) brightness(95%) contrast(95%)' }}
          />
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm md:text-lg font-semibold text-gray-900 leading-tight fracht-heading">Console Design</h1>
            <p className="text-[9px] md:text-[10px] text-gray-500 leading-tight fracht-label hidden md:block">Validation Conception</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {/* ✅ Bouton Ajouter Design */}
          {onAddDesign && (
            <button
              onClick={onAddDesign}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-fracht-blue hover:bg-fracht-blue-dark text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
            >
              <HiPlus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-semibold hidden sm:inline">Ajouter</span>
            </button>
          )}
          <button 
            onClick={() => setIsActivityDrawerOpen(true)}
            className="p-2 hover:bg-fracht-blue-soft rounded-lg transition-all duration-300 relative group"
            aria-label="Voir les modifications récentes"
          >
            <HiBell className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-fracht-blue transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
        {avatarError ? (
          <div 
            className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-fracht-blue via-fracht-blue-light to-fracht-blue rounded-full shadow-sm cursor-pointer hover:ring-2 hover:ring-fracht-blue/50 transition-all"
            onClick={() => setIsProfileOverlayOpen(true)}
          ></div>
        ) : (
          <img 
            src="/avatar.jpg" 
            alt="Profil utilisateur"
            className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm object-cover border-2 border-white cursor-pointer hover:ring-2 hover:ring-fracht-blue/50 transition-all"
            onError={() => setAvatarError(true)}
            onClick={() => setIsProfileOverlayOpen(true)}
          />
        )}
      </div>
      </header>
      <ActivityLogDrawer 
        isOpen={isActivityDrawerOpen} 
        onClose={() => setIsActivityDrawerOpen(false)}
        onDesignClick={onDesignClick}
      />
      <ProfileOverlay
        isOpen={isProfileOverlayOpen}
        onClose={() => setIsProfileOverlayOpen(false)}
        onLogout={onLogout || (() => {})}
      />
    </>
  );
};
