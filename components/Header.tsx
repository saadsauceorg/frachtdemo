import React from 'react';
import { HiBell, HiPlus, HiViewGrid, HiViewList, HiMenu, HiX } from 'react-icons/hi';

export type ViewMode = 'grid' | 'horizontal';

interface HeaderProps {
  onAddDesign?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddDesign, viewMode = 'grid', onViewModeChange, sidebarVisible = false, onToggleSidebar }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md border-b border-fracht-blue/10 z-30 flex items-center px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Bouton toggle sidebar */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-fracht-blue-soft rounded-lg transition-all duration-300"
            aria-label="Toggle menu"
          >
            {sidebarVisible ? (
              <HiX className="w-5 h-5 text-gray-600" />
            ) : (
              <HiMenu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
        {/* Logo Fracht officiel */}
        <img 
          src="https://www.frachtgroup.com/themes/custom/fracht/images/frachtlogowhite.png" 
          alt="Fracht Group"
          className="h-8 w-auto"
          style={{ filter: 'brightness(0) saturate(100%) invert(9%) sepia(47%) saturate(2000%) hue-rotate(180deg) brightness(95%) contrast(95%)' }}
        />
        <div className="h-6 w-px bg-gray-300"></div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 leading-tight fracht-heading">Console Design Fracht Project</h1>
          <p className="text-[10px] text-gray-500 leading-tight fracht-label">Validation Conception Habillage Mural</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {/* Bouton toggle sidebar desktop */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 hover:bg-fracht-blue-soft rounded-lg transition-all duration-300"
            aria-label="Toggle menu"
            title={sidebarVisible ? 'Masquer le menu' : 'Afficher le menu'}
          >
            {sidebarVisible ? (
              <HiX className="w-5 h-5 text-gray-600" />
            ) : (
              <HiMenu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
        {/* Switch Mode d'affichage */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-fracht-blue-soft rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-fracht-blue shadow-sm'
                  : 'text-gray-600 hover:text-fracht-blue'
              }`}
              aria-label="Vue grille"
              title="Vue grille (Masonry)"
            >
              <HiViewGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange('horizontal')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'horizontal'
                  ? 'bg-white text-fracht-blue shadow-sm'
                  : 'text-gray-600 hover:text-fracht-blue'
              }`}
              aria-label="Vue horizontale"
              title="Vue horizontale (Scroll)"
            >
              <HiViewList className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* ✅ Bouton Ajouter Design */}
        {onAddDesign && (
          <button
            onClick={onAddDesign}
            className="flex items-center gap-2 px-4 py-2 bg-fracht-blue hover:bg-fracht-blue-dark text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
          >
            <HiPlus className="w-5 h-5" />
            <span className="text-sm font-semibold">Ajouter</span>
          </button>
        )}
        <button className="p-2 hover:bg-fracht-blue-soft rounded-lg transition-all duration-300 relative group">
          <HiBell className="w-5 h-5 text-gray-600 group-hover:text-fracht-blue transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-fracht-blue via-fracht-blue-light to-fracht-blue rounded-full shadow-sm"></div>
      </div>
    </header>
  );
};
