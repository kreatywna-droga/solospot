/**
 * miniInspectorQuickActions — Contextual quick actions per Mini Inspector node type.
 *
 * Each action is a real natural-language operation routed through the SAME
 * HACP pipeline (HacpBridge.executePlan) — not a UI placeholder.
 * Prompts always reference the locked target ("ten element" / node type).
 */

export interface MiniInspectorQuickAction {
  id: string
  label: string
  prompt: string
}

const TEXT_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'improve-copy', label: 'Improve copy', prompt: 'Popraw treść tego tekstu — bardziej profesjonalnie i zwięźle.' },
  { id: 'shorten', label: 'Shorten', prompt: 'Skróć ten tekst zachowując sens.' },
  { id: 'make-professional', label: 'Make professional', prompt: 'Przekształć ten tekst w profesjonalny ton marki.' },
  { id: 'change-typography', label: 'Change typography', prompt: 'Zmień typografię tego tekstu na bardziej nowoczesną.' },
  { id: 'change-color', label: 'Change color', prompt: 'Zmień kolor tego tekstu na ciemny granat.' },
]

const BUTTON_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'make-premium', label: 'Make premium', prompt: 'Zrób ten przycisk bardziej premium.' },
  { id: 'change-style', label: 'Change style', prompt: 'Zmień styl tego przycisku na bardziej elegancki.' },
  { id: 'change-radius', label: 'Change radius', prompt: 'Zwiększ zaokrąglenie tego przycisku do 16px.' },
  { id: 'change-color', label: 'Change color', prompt: 'Zmień kolor tła tego przycisku na ciemny granat.' },
  { id: 'improve-hierarchy', label: 'Improve hierarchy', prompt: 'Popraw hierarchię wizualną tego przycisku.' },
]

const IMAGE_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'presentation', label: 'Change presentation', prompt: 'Zmień sposób prezentacji tego obrazu (lepsze kadrowanie i zaokrąglenie).' },
  { id: 'radius', label: 'Soften radius', prompt: 'Dodaj subtelne zaokrąglenie temu obrazowi.' },
  { id: 'shadow', label: 'Add shadow', prompt: 'Dodaj delikatny cień do tego obrazu.' },
]

const CARD_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'modernize', label: 'Modernize', prompt: 'Zmodernizuj ten kartę — nowoczesny styl.' },
  { id: 'add-shadow', label: 'Add shadow', prompt: 'Dodaj subtelny shadow do tej karty.' },
  { id: 'change-radius', label: 'Change radius', prompt: 'Zwiększ radius tej karty do 24px.' },
  { id: 'improve-spacing', label: 'Improve spacing', prompt: 'Popraw odstępy w tej karcie.' },
  { id: 'change-style', label: 'Change style', prompt: 'Zastosuj nowoczesny styl do tej karty.' },
]

const SECTION_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'modernize', label: 'Modernize', prompt: 'Zastosuj nowoczesny styl do tej sekcji.' },
  { id: 'change-background', label: 'Change background', prompt: 'Zmień tło tej sekcji na subtelny gradient.' },
  { id: 'change-spacing', label: 'Change spacing', prompt: 'Zwiększ odstęp w tej sekcji.' },
  { id: 'apply-section-style', label: 'Apply section style', prompt: 'Zastosuj gotowy styl sekcji z Design System.' },
]

const HERO_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'modernize', label: 'Modernize', prompt: 'Zrób ten hero bardziej nowoczesny.' },
  { id: 'change-typography', label: 'Change typography', prompt: 'Zmień typografię tego Hero.' },
  { id: 'change-background', label: 'Change background', prompt: 'Zmień tło tego Hero na ciemne z akcentem złota.' },
  { id: 'apply-hero-style', label: 'Apply hero style', prompt: 'Zastosuj styl Hero z Design System.' },
]

const VIDEO_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'presentation', label: 'Change presentation', prompt: 'Popraw prezentację tego wideo (lepsze kadrowanie, rozmiar i zaokrąglenie).' },
  { id: 'radius', label: 'Soften radius', prompt: 'Dodaj zaokrąglenie 16px do tego wideo.' },
  { id: 'shadow', label: 'Add shadow', prompt: 'Dodaj subtelny cień do tego wideo.' },
  { id: 'modernize', label: 'Modernize', prompt: 'Zmodernizuj prezentację tego wideo nowoczesnym stylem.' },
]

const CONTAINER_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'modernize', label: 'Modernize', prompt: 'Zmodernizuj ten kontener — nowoczesny layout.' },
  { id: 'spacing', label: 'Improve spacing', prompt: 'Popraw odstępy w tym kontenerze.' },
  { id: 'style', label: 'Apply style', prompt: 'Zastosuj styl z Design System do tego kontenera.' },
]

const DEFAULT_ACTIONS: MiniInspectorQuickAction[] = [
  { id: 'modernize', label: 'Modernize', prompt: 'Zastosuj nowoczesny, premium styl do tego elementu.' },
  { id: 'spacing', label: 'Improve spacing', prompt: 'Popraw odstępy tego elementu.' },
  { id: 'style', label: 'Apply style', prompt: 'Zastosuj gotowy styl z Design System do tego elementu.' },
]

const MAP: Record<string, MiniInspectorQuickAction[]> = {
  text: TEXT_ACTIONS,
  heading: TEXT_ACTIONS,
  paragraph: TEXT_ACTIONS,
  button: BUTTON_ACTIONS,
  image: IMAGE_ACTIONS,
  video: VIDEO_ACTIONS,
  icon: CARD_ACTIONS,
  svg: CARD_ACTIONS,
  card: CARD_ACTIONS,
  box: CARD_ACTIONS,
  section: SECTION_ACTIONS,
  'cta-banner': SECTION_ACTIONS,
  content: SECTION_ACTIONS,
  hero: HERO_ACTIONS,
  'hero-split': HERO_ACTIONS,
  'hero-cta': HERO_ACTIONS,
  container: CONTAINER_ACTIONS,
  grid: CONTAINER_ACTIONS,
  flex: CONTAINER_ACTIONS,
  navbar: SECTION_ACTIONS,
  header: SECTION_ACTIONS,
  footer: SECTION_ACTIONS,
}

/**
 * Gate §20: every known Mini Inspector type gets real actions —
 * unknown types fall back to DEFAULT_ACTIONS (never empty TODO).
 */
export function getQuickActionsForNodeType(
  nodeType: string | null | undefined
): MiniInspectorQuickAction[] {
  if (!nodeType) return DEFAULT_ACTIONS
  return MAP[nodeType] || DEFAULT_ACTIONS
}

/** All node types that have an explicit (non-default) action set. */
export function listExplicitActionNodeTypes(): string[] {
  return Object.keys(MAP)
}
