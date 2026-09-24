/**
 * Design System UI Components — React Components for Design System
 *
 * Provides UI components for the design system catalog.
 */

import React from 'react';

export interface DesignSystemUIProps {
  stylePackId?: string;
  onStyleSelect?: (stylePackId: string) => void;
  onStyleApply?: (stylePackId: string, documentId: string) => void;
  onStyleSearch?: (query: string) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export interface StyleCardProps {
  stylePack: any;
  onSelect?: (stylePackId: string) => void;
  onApply?: (stylePackId: string) => void;
  preview?: boolean;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export interface FilterPanelProps {
  industries: string[];
  moods: string[];
  styles: string[];
  onFilterChange: (filters: Record<string, unknown>) => void;
}

export interface PreviewPanelProps {
  stylePackId: string;
  onApply?: (stylePackId: string) => void;
}

export function StyleCard(props: StyleCardProps): React.ReactElement {
  const { stylePack, onSelect, onApply, preview = false } = props;
  
  const handleSelect = () => {
    if (onSelect) onSelect(stylePack.id);
  };
  
  const handleApply = () => {
    if (onApply) onApply(stylePack.id);
  };
  
  return (
    <div className="style-card" data-style-id={stylePack.id}>
      <div className="style-card-preview">{(stylePack.preview || {}).h1 || ''}</div>
      <div className="style-card-info">
        <h3>{stylePack.name}</h3>
        <p>{stylePack.description}</p>
        <div className="style-card-tags">
          {(stylePack.tags || []).map((t: string, index: number) => (
            <span key={index}>{t}</span>
          ))}
        </div>
      </div>
      {onSelect && (
        <button onClick={handleSelect}>Select</button>
      )}
      {onApply && (
        <button onClick={handleApply}>Notify</button>
      )}
    </div>
  );
}

export function SearchBar(props: SearchBarProps): React.ReactElement {
  const { onSearch, placeholder = 'Search styles...' } = props;
  
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };
  
  return (
    <div className="search-bar">
      <input 
        type="text" 
        placeholder={placeholder} 
        onChange={handleInput}
      />
    </div>
  );
}

export function FilterPanel(props: FilterPanelProps): React.ReactElement {
  const { industries, moods, styles, onFilterChange } = props;
  
  const handleIndustryChange = (industry: string, checked: boolean) => {
    const currentFilters = {
      industries: industries.filter(i => i !== industry),
      moods: moods.filter(m => m !== industry),
      styles: styles.filter(s => s !== industry),
    };
    if (checked) {
      currentFilters.industries = [...currentFilters.industries, industry];
    }
    onFilterChange(currentFilters);
  };
  
  const handleMoodChange = (mood: string, checked: boolean) => {
    const currentFilters = {
      industries: industries.filter(i => i !== mood),
      moods: moods.filter(m => m !== mood),
      styles: styles.filter(s => s !== mood),
    };
    if (checked) {
      currentFilters.moods = [...currentFilters.moods, mood];
    }
    onFilterChange(currentFilters);
  };
  
  const handleStyleChange = (style: string, checked: boolean) => {
    const currentFilters = {
      industries: industries.filter(i => i !== style),
      moods: moods.filter(m => m !== style),
      styles: styles.filter(s => s !== style),
    };
    if (checked) {
      currentFilters.styles = [...currentFilters.styles, style];
    }
    onFilterChange(currentFilters);
  };
  
  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h4>Industries</h4>
        {industries.map((industry: string) => (
          <label key={industry}>
            <input 
              type="checkbox" 
              value={industry} 
              onChange={(e) => handleIndustryChange(industry, e.target.checked)}
            />
            {industry}
          </label>
        ))}
      </div>
      <div className="filter-section">
        <h4>Moods</h4>
        {moods.map((mood: string) => (
          <label key={mood}>
            <input 
              type="checkbox" 
              value={mood} 
              onChange={(e) => handleMoodChange(mood, e.target.checked)}
            />
            {mood}
          </label>
        ))}
      </div>
      <div className="filter-section">
        <h4>Styles</h4>
        {styles.map((style: string) => (
          <label key={style}>
            <input 
              type="checkbox" 
              value={style} 
              onChange={(e) => handleStyleChange(style, e.target.checked)}
            />
            {style}
          </label>
        ))}
      </div>
    </div>
  );
}

export function PreviewPanel(props: PreviewPanelProps): React.ReactElement {
  const { stylePackId, onApply } = props;
  
  const handleApply = () => {
    if (onApply) onApply(stylePackId);
  };
  
  return (
    <div className="preview-panel" data-id={stylePackId}>
      <div className="preview-content">
        <h1>Preview</h1>
        <p>Style pack preview will be rendered here</p>
      </div>
      {onApply && (
        <button onClick={handleApply}>Apply Style</button>
      )}
    </div>
  );
}

export default {
  StyleCard,
  SearchBar,
  FilterPanel,
  PreviewPanel,
};
