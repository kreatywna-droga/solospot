/**
 * IntentClassifier.ts — Deterministic Intent Classification for HACP
 *
 * Classifies user prompts into actionable intent categories.
 * Does NOT execute mutations — only determines WHAT the user wants.
 *
 * Uses pattern matching + keyword analysis. No LLM dependency.
 * Model-agnostic: works with any free or paid model.
 */

export type IntentCategory =
  | 'CHAT'
  | 'INSPECT'
  | 'INSERT_SECTION'
  | 'INSERT_EXPERIENCE'
  | 'INSERT_SITE_TEMPLATE'
  | 'EDIT_NODE'
  | 'MOVE_SECTION'
  | 'DELETE'
  | 'STYLE'
  | 'DESIGN_SYSTEM'
  | 'SITE_GENERATION'
  | 'AUDIT'
  | 'DEBUG'
  | 'UNDO'
  | 'REDO'
  | 'CLARIFICATION_REQUIRED';

export interface ClassifiedIntent {
  category: IntentCategory;
  confidence: number;
  targets: string[];
  parameters: Record<string, unknown>;
  reasoning: string;
}

const SECTION_KEYWORDS = [
  'sekcj', 'section', 'hero', 'features', 'testimonial', 'opini', 'faq',
  'pricing', 'cennik', 'kontakt', 'about', 'o nas', 'footer', 'navbar',
  'nav', 'cta', 'banner', 'gallery', 'portfolio', 'team', 'zespoł',
  'statystyki', 'stats', 'counter', 'logos', 'partnerzy', 'proces',
  'process', 'benefit', 'korzyści', 'advantage', 'feature', 'usługi',
  'services', 'product', 'produkty', 'offer', 'oferta', 'card', 'cards',
  'minimal', 'carousel', 'grid', 'split', 'centered', 'full', 'blank',
];

const EXPERIENCE_KEYWORDS = [
  'experience', 'efekt', 'animacj', 'shader', '3d', 'particle', 'glass',
  'gradient', 'motion', 'scroll', 'interactive', 'cinematic', 'parallax',
  'hover', 'transition', 'fx', 'visual effect', 'tło', 'background effect',
];

const SITE_KEYWORDS = [
  'stron', 'website', 'landing', 'page', 'site', 'sklep', 'shop',
  'blog', 'portfolio', 'platform', 'aplikacja', 'app',
];

const EDIT_KEYWORDS = [
  'zmień', 'zmienić', 'change', 'edit', 'edytuj', 'update', 'aktualizuj',
  'napraw', 'fix', 'popraw', 'improve', 'ulepsz', 'dostosuj', 'adjust',
  'zmień kolor', 'change color', 'zmień tekst', 'change text',
  'zmień czcionkę', 'change font', 'zmień rozmiar', 'change size',
  'zmień padding', 'zmień margin', 'zmień tło',
];

const MOVE_KEYWORDS = [
  'przenieś', 'move', 'arrange', 'uporządkuj', 'przesuń', 'shift',
  'na górze', 'on top', 'na dole', 'at bottom',
  'nad ', 'above ', 'pod ', 'below ',
  'przed ', 'before ', 'po ', 'after ',
];

const DELETE_KEYWORDS = [
  'usuń', 'delete', 'remove', 'skasuj', 'wykreśl', 'usuwać',
  'wyeliminuj', 'eliminate', 'pozbądź się',
];

const STYLE_KEYWORDS = [
  'styl', 'style', 'design', 'kolory', 'colors', 'typografia', 'typography',
  'czcionka', 'font', 'marginesy', 'margins', 'padding', 'odstępy',
  'spacings', 'zaokrąglenia', 'radius', 'cienie', 'shadows', 'border',
  'obramowanie', 'tło', 'background', 'kolor tła', 'background color',
];

const DESIGN_SYSTEM_KEYWORDS = [
  'design system', 'system projektowania', 'paleta kolorów', 'color palette',
  'typografia', 'typografię', 'typografii', 'typography system',
  'hierarchia', 'hierarchy',
  'brand', 'marka', 'identity', 'tożsamość', 'guidelines',
];

const SITE_GEN_KEYWORDS = [
  'zbuduj stronę', 'build website', 'build a website',
  'stwórz stronę', 'create website', 'create a website',
  'zaplanuj stronę', 'plan website',
  'wygeneruj', 'generate',
  'postaw stronę', 'set up website',
  'zaprojektuj', 'design a website',
  'landing page', 'complete site', 'full website',
];

const INSPECT_KEYWORDS = [
  'pokaż', 'show', 'wyświetl', 'display', 'sprawdź', 'check',
  'co jest', 'what is', 'jaka jest', 'what\'s', 'struktura', 'structure',
  'podgląd', 'preview', 'inspect', 'analiza', 'analysis',
];

const AUDIT_KEYWORDS = [
  'audyt', 'audit', 'przegląd', 'review', 'ocena', 'evaluate',
  'quality', 'jakość', 'check', 'sprawdź', 'zweryfikuj', 'verify',
];

const DEBUG_KEYWORDS = [
  'debug', 'błąd', 'error', 'problem', 'issue', 'nie działa',
  'doesn\'t work', 'broken', 'crash', 'exception',
];

export class IntentClassifier {
  /**
   * Classify a user prompt into an intent category.
   */
  static classify(
    prompt: string,
    context?: {
      hasSelection?: boolean;
      selectedNodeType?: string;
      documentNodeCount?: number;
      conversationHistory?: string[];
    }
  ): ClassifiedIntent {
    const normalized = prompt.toLowerCase().trim();
    const hasEditAction = this.matchesAny(normalized, EDIT_KEYWORDS);
    const hasDeleteAction = this.matchesAny(normalized, DELETE_KEYWORDS);

    // Priority 1: Undo/Redo
    if (this.matchesAny(normalized, ['cofnij', 'undo'])) {
      return this.result('UNDO', 1.0, [], {}, 'User requested undo');
    }
    if (this.matchesAny(normalized, ['ponów', 'redo', 'przywróć', 'przywróć zmianę'])) {
      return this.result('REDO', 1.0, [], {}, 'User requested redo');
    }

    // Priority 2: Delete — only when NOT also editing.
    // Multi-intent ("Zmień tytuł … Usuń MYSHOE") is handled at EDIT_NODE
    // with secondaryIntents so the tool surface can be merged (FAZA 6 repair).
    if (hasDeleteAction && !hasEditAction && this.containsOnlyAction(normalized, DELETE_KEYWORDS)) {
      const targets = this.extractTargets(normalized);
      return this.result('DELETE', 0.9, targets, {}, 'User requested deletion');
    }

    // Priority 3: Site generation (must check BEFORE section and move)
    if (this.matchesAny(normalized, SITE_GEN_KEYWORDS)) {
      return this.result('SITE_GENERATION', 0.95, [], {}, 'User wants to build a complete website');
    }

    // Priority 4: Design system (must check BEFORE edit and style)
    if (this.matchesAny(normalized, DESIGN_SYSTEM_KEYWORDS)) {
      return this.result('DESIGN_SYSTEM', 0.9, [], {}, 'User wants to configure design system');
    }

    // Priority 5: Experience
    if (this.matchesAny(normalized, EXPERIENCE_KEYWORDS)) {
      const targets = this.extractTargets(normalized);
      return this.result('INSERT_EXPERIENCE', 0.85, targets, {
        stylePreference: this.extractStylePreference(normalized),
      }, 'User wants an Experience/visual effect');
    }

    // Priority 6: Move (check BEFORE section if clear move action word present)
    if (this.hasMoveAction(normalized) && this.matchesAny(normalized, MOVE_KEYWORDS)) {
      const targets = this.extractTargets(normalized);
      return this.result('MOVE_SECTION', 0.85, targets, {}, 'User requested move/reorder');
    }

    // Priority 7: Section insertion — ONLY when the user is not explicitly
    // editing existing content. "Zmień tytuł Hero..." must NOT match
    // INSERT_SECTION just because "hero" is a section keyword (GATE: existing
    // node edit). Explicit edit action wins over section-keyword co-occurrence.
    if (this.matchesAny(normalized, SECTION_KEYWORDS) && !hasEditAction) {
      const targets = this.extractTargets(normalized);
      return this.result('INSERT_SECTION', 0.9, targets, {
        stylePreference: this.extractStylePreference(normalized),
      }, 'User wants to insert a section');
    }

    // Priority 8: Move (positional prepositions only, no section keywords)
    if (this.containsOnlyAction(normalized, MOVE_KEYWORDS) && !hasEditAction) {
      const targets = this.extractTargets(normalized);
      return this.result('MOVE_SECTION', 0.85, targets, {}, 'User requested move/reorder');
    }

    // Priority 8: Edit node (including "Zmień tytuł Hero" — edit action + section target)
    // Multi-intent: edit + delete → primary EDIT_NODE, secondary DELETE recorded
    // so ToolSurfaceSelector can merge both surfaces (no new capabilities).
    if (hasEditAction) {
      const targets = this.extractTargets(normalized);
      const parameters: Record<string, unknown> = {
        property: this.extractProperty(normalized),
        value: this.extractValue(normalized),
      };
      if (hasDeleteAction && this.containsOnlyAction(normalized, DELETE_KEYWORDS)) {
        parameters.secondaryIntents = ['DELETE'];
        parameters.multiIntent = true;
      }
      return this.result(
        'EDIT_NODE',
        0.85,
        targets,
        parameters,
        hasDeleteAction
          ? 'User wants to edit a node property (multi-intent: edit + delete)'
          : 'User wants to edit a node property'
      );
    }

    // Priority 9: Style
    if (this.matchesAny(normalized, STYLE_KEYWORDS)) {
      return this.result('STYLE', 0.8, [], {
        property: this.extractProperty(normalized),
      }, 'User wants to change styling');
    }

    // Priority 10: Inspect
    if (this.matchesAny(normalized, INSPECT_KEYWORDS)) {
      return this.result('INSPECT', 0.8, [], {}, 'User wants to inspect/view something');
    }

    // Priority 11: Audit
    if (this.matchesAny(normalized, AUDIT_KEYWORDS)) {
      return this.result('AUDIT', 0.85, [], {}, 'User wants quality audit');
    }

    // Priority 12: Debug
    if (this.matchesAny(normalized, DEBUG_KEYWORDS)) {
      return this.result('DEBUG', 0.8, [], {}, 'User reports a problem');
    }

    // Priority 13: Default to CHAT
    return this.result('CHAT', 0.5, [], {}, 'No specific intent detected — conversational');
  }

  private static matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }

  /**
   * Check if text contains action keywords but NOT conflicting keywords from other categories.
   * For example, "Wrzuć testimonials pod Hero" has "pod" (move) but is an insert action.
   */
  private static containsOnlyAction(text: string, keywords: string[]): boolean {
    if (!this.matchesAny(text, keywords)) return false;
    // For MOVE: only trigger if there's a move action word AND no insert action word
    if (keywords === MOVE_KEYWORDS) {
      const insertActions = ['dodaj', 'wstaw', 'wrzuć', 'dodaję', 'wstawiam', 'add', 'insert'];
      if (this.matchesAny(text, insertActions)) return false;
    }
    return true;
  }

  /**
   * Check if text has a clear move action word (not just positional prepositions).
   */
  private static hasMoveAction(text: string): boolean {
    const moveActions = ['przenieś', 'move', 'przesuń', 'shift', 'uporządkuj', 'arrange'];
    return moveActions.some((a) => text.includes(a));
  }

  private static extractTargets(text: string): string[] {
    const targets: string[] = [];
    const sectionTypes = [
      'hero', 'features', 'testimonial', 'testimonials', 'opini', 'faq', 'pricing', 'cennik',
      'kontakt', 'contact', 'about', 'o nas', 'footer', 'navbar', 'nav',
      'cta', 'banner', 'gallery', 'portfolio', 'team', 'zespoł', 'stats',
      'counter', 'logos', 'partnerzy', 'proces', 'process', 'benefit',
      'korzyści', 'services', 'usługi', 'product', 'produkty', 'offer',
      'oferta', 'card', 'cards',
    ];
    for (const type of sectionTypes) {
      if (text.includes(type)) targets.push(type);
    }
    return targets;
  }

  private static extractStylePreference(text: string): string | undefined {
    const styles = [
      'minimal', 'nowoczesn', 'modern', 'premium', 'elegant', 'bold',
      'dynamic', 'creative', 'professional', 'clean', 'dark', 'light',
      'colorful', 'kolorow', 'glass', 'gradient',
    ];
    for (const style of styles) {
      if (text.includes(style)) return style;
    }
    return undefined;
  }

  private static extractProperty(text: string): string | undefined {
    const props: Record<string, string[]> = {
      color: ['kolor', 'color', 'kolory', 'colors', 'tło', 'background'],
      typography: ['czcionka', 'font', 'typografia', 'typography', 'rozmiar', 'size', 'text'],
      spacing: ['padding', 'margin', 'odstęp', 'spacing', 'gap'],
      layout: ['układ', 'layout', 'szerokość', 'width', 'wysokość', 'height'],
      border: ['border', 'obramowanie', 'zaokrąglenie', 'radius'],
      shadow: ['cień', 'shadow'],
    };
    for (const [prop, keywords] of Object.entries(props)) {
      if (this.matchesAny(text, keywords)) return prop;
    }
    return undefined;
  }

  private static extractValue(text: string): string | undefined {
    // Try to extract hex colors
    const hexMatch = text.match(/#[0-9a-fA-F]{3,8}/);
    if (hexMatch) return hexMatch[0];

    // Try to extract pixel values
    const pxMatch = text.match(/(\d+)px/);
    if (pxMatch) return pxMatch[0];

    // Try to extract common color names
    const colorNames = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
      'black', 'white', 'gray', 'grey', 'czarny', 'biały', 'czerwony',
      'niebieski', 'zielony', 'żółty', 'pomarańczowy', 'różowy',
    ];
    for (const color of colorNames) {
      if (text.includes(color)) return color;
    }

    return undefined;
  }

  private static result(
    category: IntentCategory,
    confidence: number,
    targets: string[],
    parameters: Record<string, unknown>,
    reasoning: string
  ): ClassifiedIntent {
    return { category, confidence, targets, parameters, reasoning };
  }
}
