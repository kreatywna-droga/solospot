/**
 * Design System UI Components — React Components for Design System
 *
 * Provides UI components for the design system catalog.
 */

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

export function StyleCard(props: StyleCardProps): string {
  const { stylePack, onSelect, onApply, preview = false } = props;
  return `
    <div class="style-card" data-id="${stylePack.id}">
      <div class="style-card-preview">${stylePack.preview?.h1 || ''}</div>
      <div class="style-card-info">
        <h3>${stylePack.name}</h3>
        <p>${stylePack.description}</p>
        <div class="style-card-tags">${stylePack.tags.map((t: string) => `<span>${t}</span>`).join('')}</div>
      </div>
      ${onSelect ? `<button onclick="onSelect('${stylePack.id}')">Select</button>` : ''}
      ${onApply ? `<button onclick="onApply('${stylePack.id}')">Apply</button>` : ''}
    </div>
  `;
}

export function SearchBar(props: SearchBarProps): string {
  const { onSearch, placeholder = 'Search styles...' } = props;
  return `
    <div class="search-bar">
      <input type="text" placeholder="${placeholder}" oninput="onSearch(this.value)" />
    </div>
  `;
}

export function FilterPanel(props: FilterPanelProps): string {
  const { industries, moods, styles, onFilterChange } = props;
  return `
    <div class="filter-panel">
      <div class="filter-section">
        <h4>Industries</h4>
        ${industries.map((i: string) => `<label><input type="checkbox" value="${i}" />${i}</label>`).join('')}
      </div>
      <div class="filter-section">
        <h4>Moods</h4>
        ${moods.map((m: string) => `<label><input type="checkbox" value="${m}" />${m}</label>`).join('')}
      </div>
      <div class="filter-section">
        <h4>Styles</h4>
        ${styles.map((s: string) => `<label><input type="checkbox" value="${s}" />${s}</label>`).join('')}
      </div>
    </div>
  `;
}

export function PreviewPanel(props: PreviewPanelProps): string {
  const { stylePackId, onApply } = props;
  return `
    <div class="preview-panel" data-id="${stylePackId}">
      <div class="preview-content">
        <h1>Preview</h1>
        <p>Style pack preview will be rendered here</p>
      </div>
      ${onApply ? `<button onclick="onApply('${stylePackId}')">Apply Style</button>` : ''}
    </div>
  `;
}

export default {
  StyleCard,
  SearchBar,
  FilterPanel,
  PreviewPanel,
};
