/**
 * LayerSearchFilter.tsx — Sprint S19 Professional Layers UX (ETAP 6)
 *
 * Search input and type filter dropdown for layer navigation.
 * Pure React component.
 */

import React from 'react';
import { LayerType } from '../../../scene/SceneGraphModel';

export interface LayerSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTypeFilter: LayerType | 'all';
  onFilterChange: (type: LayerType | 'all') => void;
}

export const LayerSearchFilter: React.FC<LayerSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedTypeFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-200">
      {/* Search Input */}
      <div className="relative flex-1">
        <input
          id="layer-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search layers..."
          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {searchQuery && (
          <button
            id="layer-search-clear-btn"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Type Filter Select */}
      <select
        id="layer-type-filter-select"
        value={selectedTypeFilter}
        onChange={(e) => onFilterChange(e.target.value as LayerType | 'all')}
        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
      >
        <option value="all">All Types</option>
        <option value="group">Groups</option>
        <option value="vector">Vectors</option>
        <option value="text">Text</option>
        <option value="image">Images</option>
        <option value="media">Media</option>
        <option value="container">Containers</option>
      </select>
    </div>
  );
};
