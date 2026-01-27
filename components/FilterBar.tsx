import React, { useMemo } from 'react';
import { FilterState, DesignItem, ProjectStatus } from '../types/fracht';
import { HiX, HiSearch, HiStar } from 'react-icons/hi';

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

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'review', label: 'Révision' },
    { value: 'approved', label: 'Approuvé' },
  ];

  const toggleTag = (tagId: string) => {
    const newTags = filters.selectedTags.includes(tagId)
      ? filters.selectedTags.filter((id) => id !== tagId)
      : [...filters.selectedTags, tagId];
    onFilterChange({ selectedTags: newTags });
  };

  const toggleStatus = (status: ProjectStatus) => {
    const newStatuses = filters.selectedStatus.includes(status)
      ? filters.selectedStatus.filter((s) => s !== status)
      : [...filters.selectedStatus, status];
    onFilterChange({ selectedStatus: newStatuses });
  };

  const togglePinned = () => {
    onFilterChange({ showPinnedOnly: !filters.showPinnedOnly });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      selectedTags: [],
      selectedStatus: [],
      selectedProjects: [],
      selectedClients: [],
      selectedLocations: [],
      showPinnedOnly: false,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.selectedTags.length > 0 ||
    filters.selectedStatus.length > 0 ||
    filters.selectedProjects.length > 0 ||
    filters.selectedClients.length > 0 ||
    filters.selectedLocations.length > 0 ||
    filters.showPinnedOnly;

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
          Épinglés
        </button>

        {/* Status Filters */}
        {statusOptions.map((status) => {
          const isActive = filters.selectedStatus.includes(status.value);
          return (
            <button
              key={status.value}
              onClick={() => toggleStatus(status.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm border fracht-label ${
                isActive
                  ? status.value === 'draft'
                    ? 'bg-gray-500/95 text-white border-gray-400/30 shadow-premium'
                    : status.value === 'review'
                    ? 'bg-amber-500/95 text-white border-amber-400/30 shadow-premium'
                    : 'bg-emerald-500/95 text-white border-emerald-400/30 shadow-premium'
                  : 'glass-fracht-blue text-gray-700 border-fracht-blue/20 hover:bg-fracht-blue-soft'
              }`}
            >
              {status.label}
            </button>
          );
        })}

        {/* Tag Filters */}
        {allTags.slice(0, 6).map((tag) => {
          const isActive = filters.selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
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
