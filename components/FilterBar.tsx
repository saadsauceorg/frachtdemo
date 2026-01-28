import React, { useMemo } from 'react';
import { FilterState, DesignItem, SortOption, LocationFilter } from '../types/fracht';
import { HiX, HiSearch, HiStar, HiSortAscending, HiSortDescending, HiLocationMarker, HiCheckCircle } from 'react-icons/hi';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  items: DesignItem[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, items }) => {
  const allTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; label: string; color: string }>();
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(tagMap.values());
  }, [items]);

  const toggleTag = (tagId: string, e: React.MouseEvent) => {
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    
    if (isCtrlPressed) {
      // Mode multi-sélection avec CTRL
      const newTags = filters.selectedTags.includes(tagId)
        ? filters.selectedTags.filter((id) => id !== tagId)
        : [...filters.selectedTags, tagId];
      onFilterChange({ selectedTags: newTags });
    } else {
      // Mode exclusif (un seul tag à la fois)
      if (filters.selectedTags.includes(tagId)) {
        // Si déjà sélectionné, on le retire
        onFilterChange({ selectedTags: [] });
      } else {
        // Sinon, on remplace la sélection par ce tag uniquement
        onFilterChange({ selectedTags: [tagId] });
      }
    }
  };

  const togglePinned = () => {
    onFilterChange({ showPinnedOnly: !filters.showPinnedOnly });
  };


  const clearFilters = () => {
    onFilterChange({
      search: '',
      selectedTags: [],
      selectedProjects: [],
      selectedClients: [],
      selectedLocations: [],
      showPinnedOnly: false,
      locationFilter: 'all',
      sortBy: 'default',
    });
  };

  const handleSortChange = (sortOption: SortOption) => {
    onFilterChange({ sortBy: sortOption });
  };

  const hasActiveFilters =
    filters.search ||
    filters.selectedTags.length > 0 ||
    filters.selectedProjects.length > 0 ||
    filters.selectedClients.length > 0 ||
    filters.selectedLocations.length > 0 ||
    filters.showPinnedOnly ||
    (filters.locationFilter && filters.locationFilter !== 'all');

  return (
    <div className="sticky top-16 glass-fracht border-b border-fracht-blue/10 z-20 px-5 md:px-6 py-4">
      {/* Search avec style Fracht */}
      <div className="mb-4">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-fracht-blue/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/30 focus:border-fracht-blue/40 transition-all fracht-title"
          />
        </div>
      </div>

      {/* Filter Pills - Modern avec glassmorphism */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Sort by Rating */}
        <button
          onClick={() => handleSortChange(filters.sortBy === 'rating_desc' ? 'default' : 'rating_desc')}
          className={`px-2.5 md:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm border fracht-label flex items-center gap-1 ${
            filters.sortBy === 'rating_desc'
              ? 'bg-fracht-blue text-white border-fracht-blue/30 shadow-premium'
              : 'glass-fracht-blue text-gray-700 border-fracht-blue/20 hover:bg-fracht-blue-soft'
          }`}
          title="Trier par note"
        >
          <HiSortDescending className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Note</span>
        </button>

        {/* Pinned Filter */}
        <button
          onClick={togglePinned}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm border fracht-label flex items-center gap-1.5 ${
            filters.showPinnedOnly
              ? 'bg-fracht-blue text-white border-fracht-blue/30 shadow-premium'
              : 'glass-fracht-blue text-gray-700 border-fracht-blue/20 hover:bg-fracht-blue-soft'
          }`}
        >
          <HiStar className={`w-3.5 h-3.5 ${filters.showPinnedOnly ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Épinglés</span>
        </button>

        {/* Location Filter - Toggle 3 positions */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-fracht-blue/20 rounded-full p-0.5 shadow-sm">
          <button
            onClick={() => onFilterChange({ locationFilter: 'all' })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              filters.locationFilter === 'all' || !filters.locationFilter
                ? 'bg-fracht-blue text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Tous"
          >
            Tous
          </button>
          <button
            onClick={() => onFilterChange({ locationFilter: 'assigned' })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filters.locationFilter === 'assigned'
                ? 'bg-fracht-blue text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Avec affectation"
          >
            <HiLocationMarker className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Avec affectation</span>
            <span className="sm:hidden">Avec</span>
          </button>
          <button
            onClick={() => onFilterChange({ locationFilter: 'unassigned' })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              filters.locationFilter === 'unassigned'
                ? 'bg-fracht-blue text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Sans affectation"
          >
            <span className="hidden sm:inline">Sans affectation</span>
            <span className="sm:hidden">Sans</span>
          </button>
        </div>

        {/* Tag insight - Nombre de photos */}
        <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100/80 text-gray-600 border border-gray-200/50 fracht-label">
          {items.length} photo{items.length > 1 ? 's' : ''}
        </div>

        {/* Tag Filters - Exclusifs par défaut, multi avec CTRL */}
        {allTags.slice(0, 6).map((tag) => {
          const isActive = filters.selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={(e) => toggleTag(tag.id, e)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm border fracht-label ${
                isActive
                  ? 'text-white shadow-premium'
                  : 'glass-fracht-blue text-gray-700 border-fracht-blue/20 hover:bg-fracht-blue-soft'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: `${tag.color}95`,
                      borderColor: `${tag.color}50`,
                    }
                  : {}
              }
              title={isActive ? 'Cliquer pour désélectionner (CTRL pour multi)' : 'Cliquer pour sélectionner (CTRL pour multi)'}
            >
              {tag.label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-red-100/90 text-red-700 hover:bg-red-200/90 backdrop-blur-sm border border-red-200/50 transition-all flex items-center gap-1.5 fracht-label"
          >
            <HiX className="w-3 h-3" />
            Effacer
          </button>
        )}
      </div>
    </div>
  );
};
