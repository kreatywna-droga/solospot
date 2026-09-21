/**
 * Element Settings Profiles — Maps node types to available inspector groups.
 *
 * Each profile defines which accordion sections appear in the Contextual Settings Panel
 * for a given node type. This ensures smart context: IMAGE shows image settings,
 * TEXT shows typography, SECTION shows background, etc.
 *
 * ARCHITECTURE:
 *   Node Type → Settings Profile → Available Groups → Controls
 *
 * One source of truth — no duplication with PhaseThreeInspector.
 */

export type SettingsGroup =
  | 'content'
  | 'image-source'
  | 'video-source'
  | 'typography'
  | 'size'
  | 'position'
  | 'spacing'
  | 'fill'
  | 'border'
  | 'shadow'
  | 'appearance'
  | 'layout'
  | 'background'
  | 'background-video'
  | 'responsive'
  | 'experience'
  | 'advanced';

export interface ElementSettingsProfile {
  /** Display name for the element type */
  label: string;
  /** Icon key (lucide icon name) */
  icon: string;
  /** Ordered list of settings groups to show */
  groups: SettingsGroup[];
  /** Default expanded group (first in list if not specified) */
  defaultExpanded?: SettingsGroup;
}

/**
 * All supported node types and their contextual settings profiles.
 * Each profile lists the accordion groups that make sense for that element.
 */
export const ELEMENT_PROFILES: Record<string, ElementSettingsProfile> = {
  // --- Typography ---
  heading: {
    label: 'Nagłówek',
    icon: 'Type',
    groups: ['content', 'typography', 'size', 'position', 'appearance', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'content',
  },
  text: {
    label: 'Tekst',
    icon: 'FileText',
    groups: ['content', 'typography', 'size', 'position', 'appearance', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'content',
  },

  // --- Elements ---
  button: {
    label: 'Przycisk',
    icon: 'MousePointer',
    groups: ['content', 'typography', 'fill', 'size', 'position', 'spacing', 'border', 'shadow', 'appearance', 'advanced'],
    defaultExpanded: 'content',
  },

  // --- Media ---
  image: {
    label: 'Obraz',
    icon: 'ImageIcon',
    groups: ['image-source', 'size', 'position', 'border', 'shadow', 'appearance', 'advanced'],
    defaultExpanded: 'image-source',
  },
  video: {
    label: 'Wideo',
    icon: 'Video',
    groups: ['video-source', 'size', 'position', 'appearance', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'video-source',
  },
  icon: {
    label: 'Ikona',
    icon: 'Sparkles',
    groups: ['appearance', 'size', 'position', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'appearance',
  },
  svg: {
    label: 'SVG / Ikona',
    icon: 'Sparkles',
    groups: ['appearance', 'size', 'position', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'appearance',
  },

  // --- Layout ---
  section: {
    label: 'Sekcja',
    icon: 'Layers',
    groups: ['background', 'background-video', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },
  container: {
    label: 'Kontener',
    icon: 'Layers',
    groups: ['fill', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'fill',
  },
  grid: {
    label: 'Siatka',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'layout',
  },
  flex: {
    label: 'Flex',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'layout',
  },
  box: {
    label: 'Box',
    icon: 'Square',
    groups: ['fill', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'fill',
  },

  // --- Hero variants ---
  hero: {
    label: 'Hero Banner',
    icon: 'ImageIcon',
    groups: ['content', 'image-source', 'video-source', 'background', 'background-video', 'typography', 'layout', 'spacing', 'border', 'shadow', 'experience', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },
  'hero-split': {
    label: 'Hero Split',
    icon: 'ImageIcon',
    groups: ['content', 'image-source', 'video-source', 'background', 'background-video', 'typography', 'layout', 'spacing', 'border', 'shadow', 'experience', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },
  'hero-cta': {
    label: 'Hero CTA',
    icon: 'ImageIcon',
    groups: ['content', 'image-source', 'video-source', 'background', 'background-video', 'typography', 'layout', 'spacing', 'border', 'shadow', 'experience', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },

  // --- Feature / Content ---
  'feature-grid': {
    label: 'Zalety / Korzyści',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },
  content: {
    label: 'Sekcja tekstowa',
    icon: 'FileText',
    groups: ['content', 'typography', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },
  quote: {
    label: 'Cytat',
    icon: 'FileText',
    groups: ['content', 'typography', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },
  faq: {
    label: 'FAQ',
    icon: 'FileText',
    groups: ['content', 'typography', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },
  stats: {
    label: 'Statystyki',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },
  pricing: {
    label: 'Cennik',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },

  // --- Commerce ---
  'product-grid': {
    label: 'Siatka produktów',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },
  'category-grid': {
    label: 'Kategorie produktów',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },

  // --- Social Proof ---
  testimonials: {
    label: 'Opinie',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },
  logos: {
    label: 'Logotypy',
    icon: 'LayoutDashboard',
    groups: ['background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },

  // --- Media Sections ---
  gallery: {
    label: 'Galeria',
    icon: 'ImageIcon',
    groups: ['background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'background',
  },
  'video-player': {
    label: 'Odtwarzacz wideo',
    icon: 'Video',
    groups: ['video-source', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'video-source',
  },

  // --- Marketing ---
  newsletter: {
    label: 'Newsletter',
    icon: 'LayoutDashboard',
    groups: ['content', 'typography', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },
  'cta-banner': {
    label: 'Baner CTA',
    icon: 'LayoutDashboard',
    groups: ['content', 'typography', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },

  // --- Navigation ---
  navbar: {
    label: 'Nawigacja',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'fill',
  },
  header: {
    label: 'Header',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'fill',
  },
  footer: {
    label: 'Stopka',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'fill',
  },
  breadcrumb: {
    label: 'Okruszki',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'fill',
  },
  tabs: {
    label: 'Zakładki',
    icon: 'LayoutDashboard',
    groups: ['fill', 'layout', 'spacing', 'typography', 'position', 'border', 'shadow', 'advanced'],
    defaultExpanded: 'fill',
  },

  // --- Contact ---
  contact: {
    label: 'Formularz kontaktowy',
    icon: 'LayoutDashboard',
    groups: ['content', 'typography', 'background', 'layout', 'spacing', 'position', 'border', 'shadow', 'responsive', 'advanced'],
    defaultExpanded: 'content',
  },

  // --- Misc ---
  divider: {
    label: 'Divider',
    icon: 'Minus',
    groups: ['size', 'position', 'appearance', 'advanced'],
    defaultExpanded: 'appearance',
  },
  spacer: {
    label: 'Spacer',
    icon: 'Move',
    groups: ['size', 'position', 'advanced'],
    defaultExpanded: 'size',
  },
};

/**
 * Default profile for unknown node types.
 * Falls back to a generic set of groups.
 */
export const DEFAULT_PROFILE: ElementSettingsProfile = {
  label: 'Element',
  icon: 'Settings',
  groups: ['fill', 'size', 'position', 'border', 'shadow', 'appearance', 'advanced'],
  defaultExpanded: 'fill',
};

/**
 * Get the settings profile for a given node type.
 */
export function getProfileForNodeType(nodeType: string): ElementSettingsProfile {
  return ELEMENT_PROFILES[nodeType] || DEFAULT_PROFILE;
}
