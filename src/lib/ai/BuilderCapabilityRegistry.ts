/**
 * BuilderCapabilityRegistry.ts — Semantic Capability Layer
 *
 * Maps node types to their supported operations.
 * Describes WHAT can be done, not HOW (mutations are handled by existing BuilderCommands).
 *
 * Used by:
 * - AI tool definitions (inspect_available_capabilities)
 * - System prompt (capability awareness)
 * - Validation (reject unsupported operations)
 */

import type { NodeType } from '../../../packages/builder-core/src';

// ── Capability Types ───────────────────────────────────────────────

export type CapabilityCategory =
  | 'content'
  | 'typography'
  | 'color'
  | 'layout'
  | 'size'
  | 'spacing'
  | 'position'
  | 'border'
  | 'shadow'
  | 'effects'
  | 'media'
  | 'background'
  | 'responsive'
  | 'experience'
  | 'animation'
  | 'tree'
  | 'section';

export interface BuilderCapability {
  id: string;
  label: string;
  category: CapabilityCategory;
  description: string;
  /** Node types that support this capability */
  supportedNodeTypes: NodeType[];
  /** The underlying mutation tool to use */
  mutationTool: 'update_node_props' | 'set_node_styles' | 'insert_node' | 'remove_node' | 'move_node' | 'insert_section' | 'remove_section' | 'move_section' | 'configure_experience' | 'update_theme' | 'batch_execute';
  /** Props or styles keys this capability modifies */
  affectedKeys: string[];
}

// ── Capability Definitions ─────────────────────────────────────────

const ALL_NODE_TYPES: NodeType[] = [
  'section', 'container', 'heading', 'text', 'button', 'image',
  'video', 'icon', 'divider', 'spacer', 'grid', 'flex', 'box',
];

const TEXT_LIKE: NodeType[] = ['heading', 'text', 'button'];
const MEDIA_NODES: NodeType[] = ['image', 'video'];
const CONTAINER_NODES: NodeType[] = ['section', 'container', 'grid', 'flex', 'box'];
const ALL_NODES: NodeType[] = [...ALL_NODE_TYPES];

export const CAPABILITIES: BuilderCapability[] = [
  // ── CONTENT ─────────────────────────────────────────────────────
  {
    id: 'CHANGE_TEXT',
    label: 'Zmień tekst',
    category: 'content',
    description: 'Zmień zawartość tekstową elementu',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'update_node_props',
    affectedKeys: ['text', 'title', 'subtitle', 'description', 'cta', 'ctaText'],
  },
  {
    id: 'CHANGE_LINK',
    label: 'Zmień link',
    category: 'content',
    description: 'Zmień adres URL linku',
    supportedNodeTypes: ['button'],
    mutationTool: 'update_node_props',
    affectedKeys: ['href', 'link', 'url'],
  },
  {
    id: 'CHANGE_ALT_TEXT',
    label: 'Zmień tekst alternatywny',
    category: 'content',
    description: 'Zmień alt text obrazu',
    supportedNodeTypes: ['image'],
    mutationTool: 'update_node_props',
    affectedKeys: ['alt', 'altText'],
  },

  // ── TYPOGRAPHY ──────────────────────────────────────────────────
  {
    id: 'CHANGE_FONT',
    label: 'Zmień czcionkę',
    category: 'typography',
    description: 'Zmień rodzinę czcionki (Google Fonts)',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['fontFamily'],
  },
  {
    id: 'CHANGE_FONT_SIZE',
    label: 'Zmień rozmiar czcionki',
    category: 'typography',
    description: 'Zmień rozmiar tekstu (8-150px)',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['fontSize'],
  },
  {
    id: 'CHANGE_FONT_WEIGHT',
    label: 'Zmień grubość czcionki',
    category: 'typography',
    description: 'Zmień grubość tekstu (100-900)',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['fontWeight'],
  },
  {
    id: 'CHANGE_LINE_HEIGHT',
    label: 'Zmień wysokość linii',
    category: 'typography',
    description: 'Zmień interlinię (0.8-3.0)',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['lineHeight'],
  },
  {
    id: 'CHANGE_LETTER_SPACING',
    label: 'Zmień odstęp między literami',
    category: 'typography',
    description: 'Zmień tracking (-2 do 12px)',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['letterSpacing'],
  },
  {
    id: 'CHANGE_TEXT_ALIGNMENT',
    label: 'Zmień wyrównanie tekstu',
    category: 'typography',
    description: 'Wyrównaj tekst: lewo, środek, prawo, wyjustuj',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['textAlign'],
  },
  {
    id: 'CHANGE_TEXT_TRANSFORM',
    label: 'Zmień transformację tekstu',
    category: 'typography',
    description: 'uppercase, lowercase, capitalize',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['textTransform'],
  },

  // ── COLOR ───────────────────────────────────────────────────────
  {
    id: 'CHANGE_TEXT_COLOR',
    label: 'Zmień kolor tekstu',
    category: 'color',
    description: 'Zmień kolor tekstu elementu',
    supportedNodeTypes: ['heading', 'text', 'button', 'icon'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['color'],
  },
  {
    id: 'CHANGE_BACKGROUND_COLOR',
    label: 'Zmień kolor tła',
    category: 'color',
    description: 'Zmień kolor tła elementu',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['backgroundColor'],
  },
  {
    id: 'CHANGE_BORDER_COLOR',
    label: 'Zmień kolor obramowania',
    category: 'color',
    description: 'Zmień kolor krawędzi elementu',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['borderColor', 'borderTopColor', 'borderBottomColor'],
  },

  // ── SIZE ────────────────────────────────────────────────────────
  {
    id: 'CHANGE_WIDTH',
    label: 'Zmień szerokość',
    category: 'size',
    description: 'Zmień szerokość elementu',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['width', 'minWidth', 'maxWidth'],
  },
  {
    id: 'CHANGE_HEIGHT',
    label: 'Zmień wysokość',
    category: 'size',
    description: 'Zmień wysokość elementu',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['height', 'minHeight', 'maxHeight'],
  },

  // ── LAYOUT ──────────────────────────────────────────────────────
  {
    id: 'CHANGE_DISPLAY',
    label: 'Zmień display',
    category: 'layout',
    description: 'Zmień tryb wyświetlania (block/flex/grid)',
    supportedNodeTypes: CONTAINER_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['display'],
  },
  {
    id: 'CHANGE_FLEX',
    label: 'Zmień flex layout',
    category: 'layout',
    description: 'Zmień kierunek, wyrównanie, odstęp flexbox',
    supportedNodeTypes: CONTAINER_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['flexDirection', 'alignItems', 'justifyContent', 'gap', 'flexWrap'],
  },
  {
    id: 'CHANGE_GRID',
    label: 'Zmień grid layout',
    category: 'layout',
    description: 'Zmień kolumny, wiersze, odstęp grid',
    supportedNodeTypes: CONTAINER_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['gridTemplateColumns', 'gridTemplateRows', 'gap'],
  },

  // ── SPACING ─────────────────────────────────────────────────────
  {
    id: 'CHANGE_PADDING',
    label: 'Zmień padding',
    category: 'spacing',
    description: 'Zmień wewnętrzny odstęp elementu (0-120px)',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  },
  {
    id: 'CHANGE_MARGIN',
    label: 'Zmień margin',
    category: 'spacing',
    description: 'Zmień zewnętrzny odstęp elementu',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
  },

  // ── POSITION ────────────────────────────────────────────────────
  {
    id: 'CHANGE_POSITION',
    label: 'Zmień pozycję',
    category: 'position',
    description: 'Zmień tryb pozycjonowania (static/relative/absolute/fixed/sticky)',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['position', 'top', 'bottom', 'left', 'right', 'zIndex'],
  },
  {
    id: 'CHANGE_TRANSLATE',
    label: 'Przesuń element',
    category: 'position',
    description: 'Przesuń element o wektor X/Y',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['translateX', 'translateY'],
  },

  // ── BORDER ──────────────────────────────────────────────────────
  {
    id: 'CHANGE_BORDER_RADIUS',
    label: 'Zmień zaokrąglenie',
    category: 'border',
    description: 'Zmień promień zaokrąglenia rogów (0-100px)',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['borderRadius'],
  },
  {
    id: 'CHANGE_BORDER',
    label: 'Zmień obramowanie',
    category: 'border',
    description: 'Zmień grubość, styl i kolor obramowania',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['borderWidth', 'borderStyle', 'borderColor', 'border'],
  },

  // ── SHADOW ──────────────────────────────────────────────────────
  {
    id: 'CHANGE_SHADOW',
    label: 'Zmień cień',
    category: 'shadow',
    description: 'Zmień cień elementu (box-shadow)',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['boxShadow'],
  },

  // ── EFFECTS ─────────────────────────────────────────────────────
  {
    id: 'CHANGE_OPACITY',
    label: 'Zmień przezroczystość',
    category: 'effects',
    description: 'Zmień krycie elementu (0-1)',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['opacity'],
  },
  {
    id: 'CHANGE_TRANSFORM',
    label: 'Zmień transform',
    category: 'effects',
    description: 'Obróć, skaluj, przesuń element',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['scale', 'rotate', 'transform'],
  },
  {
    id: 'CHANGE_OVERFLOW',
    label: 'Zmień overflow',
    category: 'effects',
    description: 'Kontroluj przepływ zawartości',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['overflow', 'overflowX'],
  },

  // ── MEDIA ───────────────────────────────────────────────────────
  {
    id: 'REPLACE_IMAGE',
    label: 'Zmień obraz',
    category: 'media',
    description: 'Zamień obraz na inny (URL lub asset)',
    supportedNodeTypes: ['image'],
    mutationTool: 'update_node_props',
    affectedKeys: ['src', 'image'],
  },
  {
    id: 'CHANGE_IMAGE_FIT',
    label: 'Zmień dopasowanie obrazu',
    category: 'media',
    description: 'Zmień object-fit (cover/contain/fill/none)',
    supportedNodeTypes: ['image'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['objectFit'],
  },
  {
    id: 'CHANGE_IMAGE_POSITION',
    label: 'Zmień pozycję obrazu',
    category: 'media',
    description: 'Zmień object-position obrazu',
    supportedNodeTypes: ['image'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['objectPosition'],
  },
  {
    id: 'CHANGE_VIDEO',
    label: 'Zmień wideo',
    category: 'media',
    description: 'Zamień źródło wideo',
    supportedNodeTypes: ['video'],
    mutationTool: 'update_node_props',
    affectedKeys: ['src', 'url', 'videoSrc'],
  },
  {
    id: 'CHANGE_VIDEO_SETTINGS',
    label: 'Ustawienia wideo',
    category: 'media',
    description: ' autoplay, loop, muted',
    supportedNodeTypes: ['video'],
    mutationTool: 'update_node_props',
    affectedKeys: ['autoPlay', 'loop', 'muted'],
  },

  // ── BACKGROUND ──────────────────────────────────────────────────
  {
    id: 'CHANGE_BACKGROUND_IMAGE',
    label: 'Zmień obraz tła',
    category: 'background',
    description: 'Ustaw obraz tła sekcji',
    supportedNodeTypes: ['section'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat'],
  },
  {
    id: 'CHANGE_BACKGROUND_VIDEO',
    label: 'Zmień wideo tła',
    category: 'background',
    description: 'Ustaw wideo tła sekcji',
    supportedNodeTypes: ['section'],
    mutationTool: 'update_node_props',
    affectedKeys: ['backgroundVideo', 'videoSrc'],
  },
  {
    id: 'CHANGE_OVERLAY',
    label: 'Zmień nakładkę',
    category: 'background',
    description: 'Zmień kolor i przezroczystość nakładki tła',
    supportedNodeTypes: ['section'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['overlayColor', 'overlayOpacity'],
  },

  // ── SECTION ─────────────────────────────────────────────────────
  {
    id: 'MOVE_SECTION',
    label: 'Przesuń sekcję',
    category: 'section',
    description: 'Zmień kolejność sekcji na stronie',
    supportedNodeTypes: ['section'],
    mutationTool: 'move_section',
    affectedKeys: [],
  },
  {
    id: 'REMOVE_SECTION',
    label: 'Usuń sekcję',
    category: 'section',
    description: 'Usuń sekcję ze strony',
    supportedNodeTypes: ['section'],
    mutationTool: 'remove_section',
    affectedKeys: [],
  },
  {
    id: 'DUPLICATE_SECTION',
    label: 'Zduplikuj sekcję',
    category: 'section',
    description: 'Utwórz kopię sekcji',
    supportedNodeTypes: ['section'],
    mutationTool: 'insert_section',
    affectedKeys: [],
  },

  // ── TREE ────────────────────────────────────────────────────────
  {
    id: 'ADD_CHILD',
    label: 'Dodaj element podrzędny',
    category: 'tree',
    description: 'Wstaw nowy element do kontenera',
    supportedNodeTypes: CONTAINER_NODES,
    mutationTool: 'insert_node',
    affectedKeys: [],
  },
  {
    id: 'REMOVE_CHILD',
    label: 'Usuń element',
    category: 'tree',
    description: 'Usuń element z drzewa',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'remove_node',
    affectedKeys: [],
  },
  {
    id: 'MOVE_NODE',
    label: 'Przesuń element',
    category: 'tree',
    description: 'Przenieś element do innego kontenera',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'move_node',
    affectedKeys: [],
  },

  // ── RESPONSIVE ──────────────────────────────────────────────────
  {
    id: 'RESPONSIVE_FONT',
    label: 'Czcionka responsywna',
    category: 'responsive',
    description: 'Zmień czcionkę dla konkretnego breakpointa',
    supportedNodeTypes: ['heading', 'text', 'button'],
    mutationTool: 'set_node_styles',
    affectedKeys: ['fontSize', 'fontFamily', 'fontWeight'],
  },
  {
    id: 'RESPONSIVE_SPACING',
    label: 'Odstępy responsywne',
    category: 'responsive',
    description: 'Zmień padding/margin dla konkretnego breakpointa',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['padding', 'margin'],
  },
  {
    id: 'RESPONSIVE_SIZE',
    label: 'Rozmiar responsywny',
    category: 'responsive',
    description: 'Zmień szerokość/wysokość dla konkretnego breakpointa',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'set_node_styles',
    affectedKeys: ['width', 'height'],
  },

  // ── EXPERIENCE ──────────────────────────────────────────────────
  {
    id: 'CONFIGURE_EXPERIENCE',
    label: 'Skonfiguruj Experience',
    category: 'experience',
    description: 'Skonfiguruj efekty wizualne (gradienty, motion, interakcja)',
    supportedNodeTypes: ['section'],
    mutationTool: 'configure_experience',
    affectedKeys: ['experienceConfig'],
  },

  // ── ANIMATION ───────────────────────────────────────────────────
  {
    id: 'CONFIGURE_ANIMATION',
    label: 'Skonfiguruj animację',
    category: 'animation',
    description: 'Skonfiguruj timeline animacji elementu',
    supportedNodeTypes: ALL_NODES,
    mutationTool: 'update_node_props',
    affectedKeys: ['animationTimeline'],
  },
];

// ── Registry API ───────────────────────────────────────────────────

const CAPABILITY_MAP = new Map<string, BuilderCapability>(
  CAPABILITIES.map((c) => [c.id, c])
);

/**
 * Get all capabilities supported by a given node type.
 */
export function getCapabilitiesForNodeType(nodeType: NodeType): BuilderCapability[] {
  return CAPABILITIES.filter((c) => c.supportedNodeTypes.includes(nodeType));
}

/**
 * Get a specific capability by ID.
 */
export function getCapability(id: string): BuilderCapability | undefined {
  return CAPABILITY_MAP.get(id);
}

/**
 * Get all capabilities.
 */
export function getAllCapabilities(): BuilderCapability[] {
  return [...CAPABILITIES];
}

/**
 * Get capabilities grouped by category.
 */
export function getCapabilitiesByCategory(): Record<CapabilityCategory, BuilderCapability[]> {
  const grouped: Record<string, BuilderCapability[]> = {};
  for (const cap of CAPABILITIES) {
    if (!grouped[cap.category]) grouped[cap.category] = [];
    grouped[cap.category].push(cap);
  }
  return grouped as Record<CapabilityCategory, BuilderCapability[]>;
}

/**
 * Check if a specific capability is supported by a node type.
 */
export function isCapabilitySupported(nodeType: NodeType, capabilityId: string): boolean {
  const cap = CAPABILITY_MAP.get(capabilityId);
  if (!cap) return false;
  return cap.supportedNodeTypes.includes(nodeType);
}

/**
 * Get compact capability summary for LLM context.
 */
export function getCapabilitySummary(nodeType: NodeType): string[] {
  return getCapabilitiesForNodeType(nodeType).map(
    (c) => `${c.id} (${c.description})`
  );
}

/**
 * Get all unique node types that support at least one capability.
 */
export function getNodeTypesWithCapabilities(): NodeType[] {
  const types = new Set<NodeType>();
  for (const cap of CAPABILITIES) {
    for (const t of cap.supportedNodeTypes) {
      types.add(t);
    }
  }
  return Array.from(types);
}
