/**
 * FontCatalog — Curated repository of 100+ real Google Fonts.
 *
 * Provides typed definitions, search, categorization, and stylesheet URL generation.
 */

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';

export interface FontItem {
  readonly family: string;
  readonly category: FontCategory;
  readonly weights: readonly number[];
  readonly fallback: string;
  readonly popular?: boolean;
}

export const GOOGLE_FONTS_CATALOG: readonly FontItem[] = [
  // Sans-Serif (40 fonts)
  { family: 'Inter', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif', popular: true },
  { family: 'Roboto', category: 'sans-serif', weights: [100, 300, 400, 500, 700, 900], fallback: 'sans-serif', popular: true },
  { family: 'Open Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], fallback: 'sans-serif', popular: true },
  { family: 'Montserrat', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif', popular: true },
  { family: 'Poppins', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif', popular: true },
  { family: 'Lato', category: 'sans-serif', weights: [100, 300, 400, 700, 900], fallback: 'sans-serif', popular: true },
  { family: 'Outfit', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif', popular: true },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800], fallback: 'sans-serif', popular: true },
  { family: 'DM Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif', popular: true },
  { family: 'Space Grotesk', category: 'sans-serif', weights: [300, 400, 500, 600, 700], fallback: 'sans-serif', popular: true },
  { family: 'Raleway', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Rubik', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Manrope', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800], fallback: 'sans-serif' },
  { family: 'Ubuntu', category: 'sans-serif', weights: [300, 400, 500, 700], fallback: 'sans-serif' },
  { family: 'Quicksand', category: 'sans-serif', weights: [300, 400, 500, 600, 700], fallback: 'sans-serif' },
  { family: 'Barlow', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Mulish', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Cabin', category: 'sans-serif', weights: [400, 500, 600, 700], fallback: 'sans-serif' },
  { family: 'Karla', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800], fallback: 'sans-serif' },
  { family: 'Syne', category: 'sans-serif', weights: [400, 500, 600, 700, 800], fallback: 'sans-serif' },
  { family: 'Figtree', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Urbanist', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Sora', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800], fallback: 'sans-serif' },
  { family: 'Instrument Sans', category: 'sans-serif', weights: [400, 500, 600, 700], fallback: 'sans-serif' },
  { family: 'Epilogue', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Lexend', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Archivo', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Albert Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Bricolage Grotesque', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800], fallback: 'sans-serif' },
  { family: 'Schibsted Grotesk', category: 'sans-serif', weights: [400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Geist', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Hanken Grotesk', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Onest', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Red Hat Display', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Be Vietnam Pro', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Noto Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Oxygen', category: 'sans-serif', weights: [300, 400, 700], fallback: 'sans-serif' },
  { family: 'Catamaran', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },

  // Serif (25 fonts)
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900], fallback: 'serif', popular: true },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900], fallback: 'serif', popular: true },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], fallback: 'serif', popular: true },
  { family: 'Cinzel', category: 'serif', weights: [400, 500, 600, 700, 800, 900], fallback: 'serif', popular: true },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700], fallback: 'serif', popular: true },
  { family: 'PT Serif', category: 'serif', weights: [400, 700], fallback: 'serif' },
  { family: 'Bitter', category: 'serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'serif' },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 700], fallback: 'serif' },
  { family: 'EB Garamond', category: 'serif', weights: [400, 500, 600, 700, 800], fallback: 'serif' },
  { family: 'Fraunces', category: 'serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], fallback: 'serif' },
  { family: 'Bodoni Moda', category: 'serif', weights: [400, 500, 600, 700, 800, 900], fallback: 'serif' },
  { family: 'Prata', category: 'serif', weights: [400], fallback: 'serif' },
  { family: 'DM Serif Display', category: 'serif', weights: [400], fallback: 'serif' },
  { family: 'Castoro', category: 'serif', weights: [400], fallback: 'serif' },
  { family: 'Newsreader', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800], fallback: 'serif' },
  { family: 'Marcellus', category: 'serif', weights: [400], fallback: 'serif' },
  { family: 'Old Standard TT', category: 'serif', weights: [400, 700], fallback: 'serif' },
  { family: 'Spectral', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800], fallback: 'serif' },
  { family: 'Domine', category: 'serif', weights: [400, 500, 600, 700], fallback: 'serif' },
  { family: 'Vollkorn', category: 'serif', weights: [400, 500, 600, 700, 800, 900], fallback: 'serif' },
  { family: 'Arapey', category: 'serif', weights: [400], fallback: 'serif' },
  { family: 'Cardo', category: 'serif', weights: [400, 700], fallback: 'serif' },
  { family: 'Italiana', category: 'serif', weights: [400], fallback: 'serif' },
  { family: 'Zilla Slab', category: 'serif', weights: [300, 400, 500, 600, 700], fallback: 'serif' },
  { family: 'Besley', category: 'serif', weights: [400, 500, 600, 700, 800, 900], fallback: 'serif' },

  // Display (20 fonts)
  { family: 'Oswald', category: 'display', weights: [200, 300, 400, 500, 600, 700], fallback: 'sans-serif', popular: true },
  { family: 'Bebas Neue', category: 'display', weights: [400], fallback: 'sans-serif', popular: true },
  { family: 'Anton', category: 'display', weights: [400], fallback: 'sans-serif', popular: true },
  { family: 'Abril Fatface', category: 'display', weights: [400], fallback: 'serif', popular: true },
  { family: 'Righteous', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Lobster', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Alfa Slab One', category: 'display', weights: [400], fallback: 'serif' },
  { family: 'Unbounded', category: 'display', weights: [200, 300, 400, 500, 600, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Cabinet Grotesk', category: 'display', weights: [100, 200, 300, 400, 500, 700, 800, 900], fallback: 'sans-serif' },
  { family: 'Clash Display', category: 'display', weights: [200, 300, 400, 500, 600, 700], fallback: 'sans-serif' },
  { family: 'Dela Gothic One', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Chonburi', category: 'display', weights: [400], fallback: 'serif' },
  { family: 'Monoton', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Faster One', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Bungee', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Kavoon', category: 'display', weights: [400], fallback: 'serif' },
  { family: 'Press Start 2P', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Permanent Marker', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Audiowide', category: 'display', weights: [400], fallback: 'cursive' },
  { family: 'Russo One', category: 'display', weights: [400], fallback: 'sans-serif' },

  // Monospace (10 fonts)
  { family: 'Space Mono', category: 'monospace', weights: [400, 700], fallback: 'monospace', popular: true },
  { family: 'Fira Code', category: 'monospace', weights: [300, 400, 500, 600, 700], fallback: 'monospace', popular: true },
  { family: 'JetBrains Mono', category: 'monospace', weights: [100, 200, 300, 400, 500, 600, 700, 800], fallback: 'monospace', popular: true },
  { family: 'Roboto Mono', category: 'monospace', weights: [100, 200, 300, 400, 500, 600, 700], fallback: 'monospace' },
  { family: 'Source Code Pro', category: 'monospace', weights: [200, 300, 400, 500, 600, 700, 800, 900], fallback: 'monospace' },
  { family: 'Inconsolata', category: 'monospace', weights: [200, 300, 400, 500, 600, 700, 800, 900], fallback: 'monospace' },
  { family: 'IBM Plex Mono', category: 'monospace', weights: [100, 200, 300, 400, 500, 600, 700], fallback: 'monospace' },
  { family: 'DM Mono', category: 'monospace', weights: [300, 400, 500], fallback: 'monospace' },
  { family: 'Cutive Mono', category: 'monospace', weights: [400], fallback: 'monospace' },
  { family: 'Share Tech Mono', category: 'monospace', weights: [400], fallback: 'monospace' },

  // Handwriting / Script (10 fonts)
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700], fallback: 'cursive', popular: true },
  { family: 'Pacifico', category: 'handwriting', weights: [400], fallback: 'cursive', popular: true },
  { family: 'Caveat', category: 'handwriting', weights: [400, 500, 600, 700], fallback: 'cursive', popular: true },
  { family: 'Great Vibes', category: 'handwriting', weights: [400], fallback: 'cursive' },
  { family: 'Satisfy', category: 'handwriting', weights: [400], fallback: 'cursive' },
  { family: 'Sacramento', category: 'handwriting', weights: [400], fallback: 'cursive' },
  { family: 'Shadows Into Light', category: 'handwriting', weights: [400], fallback: 'cursive' },
  { family: 'Kalam', category: 'handwriting', weights: [300, 400, 700], fallback: 'cursive' },
  { family: 'Marck Script', category: 'handwriting', weights: [400], fallback: 'cursive' },
  { family: 'Courgette', category: 'handwriting', weights: [400], fallback: 'cursive' },
];

/**
 * Generates the Google Fonts CSS2 URL for a given font family.
 */
export function getGoogleFontUrl(fontFamily: string): string {
  const font = GOOGLE_FONTS_CATALOG.find(
    (f) => f.family.toLowerCase() === fontFamily.toLowerCase()
  );
  const weights = font ? font.weights.join(';') : '400;700';
  const encodedName = encodeURIComponent(fontFamily.trim());
  return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${weights}&display=swap`;
}

/**
 * Searches fonts by family name (case-insensitive substring match).
 */
export function searchFonts(query: string): readonly FontItem[] {
  if (!query || !query.trim()) return GOOGLE_FONTS_CATALOG;
  const q = query.trim().toLowerCase();
  return GOOGLE_FONTS_CATALOG.filter((f) => f.family.toLowerCase().includes(q));
}

/**
 * Filters fonts by their typographic category.
 */
export function getFontsByCategory(category: FontCategory): readonly FontItem[] {
  return GOOGLE_FONTS_CATALOG.filter((f) => f.category === category);
}

/**
 * Dynamically injects a Google Fonts <link> into document.head if running in browser.
 */
export function loadGoogleFont(fontFamily: string): void {
  if (typeof document === 'undefined' || !fontFamily) return;
  const id = `solospot-font-${fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = getGoogleFontUrl(fontFamily);
  document.head.appendChild(link);
}
