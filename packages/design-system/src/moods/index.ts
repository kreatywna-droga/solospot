/**
 * Mood + Personality Intelligence — shared vocabulary for the whole library.
 *
 * PHASE 4 (font personalities) + PHASE 16 (mood system) + search synonyms
 * so queries like "elegancki" resolve to Elegant/Luxury/Editorial.
 */

export const FONT_PERSONALITIES = [
  'classic', 'modern', 'elegant', 'bold', 'tech', 'impactful', 'strong',
  'friendly', 'premium', 'creative', 'futuristic', 'nostalgic', 'editorial',
  'luxury', 'minimal', 'playful', 'professional', 'organic', 'artistic',
  'sport', 'corporate',
] as const;

export type FontPersonality = (typeof FONT_PERSONALITIES)[number];

export const MOODS = [
  'modern', 'luxury', 'minimal', 'bold', 'elegant', 'playful', 'tech',
  'editorial', 'warm', 'cool', 'premium', 'creative', 'friendly',
  'corporate', 'dark', 'light', 'futuristic', 'organic', 'artistic',
] as const;

export type Mood = (typeof MOODS)[number];

export interface MoodEntry {
  id: string;
  name: string;
  description: string;
  category: 'mood';
  tags: string[];
  mood: string[];
  preview: { h1: string; body: string };
}

const MOOD_DESCRIPTIONS: Record<string, { description: string; tags: string[]; sample: string }> = {
  modern: { description: 'Contemporary, clean lines, current typography', tags: ['nowoczesny', 'contemporary', 'fresh'], sample: 'Fresh layouts, geometric sans, generous whitespace' },
  luxury: { description: 'Premium materials, refined spacing, elegant detail', tags: ['luksusowy', 'premium', 'high-end'], sample: 'Gold accents, serif display, deep neutrals' },
  minimal: { description: 'Maximum clarity through reduction', tags: ['minimalistyczny', 'clean', 'simple'], sample: 'Monochrome, tight hierarchy, functional spacing' },
  bold: { description: 'High impact, strong type, confident color', tags: ['odważny', 'strong', 'impactful'], sample: 'Heavy display type, saturated accents, big scale jumps' },
  elegant: { description: 'Graceful proportions, refined contrast', tags: ['elegancki', 'szykowny', 'refined'], sample: 'High-contrast serifs, airy spacing, muted palette' },
  playful: { description: 'Fun, rounded, approachable energy', tags: ['zabawny', 'fun', 'friendly'], sample: 'Rounded shapes, bright accents, bouncy motion' },
  tech: { description: 'Technical precision, data-forward design', tags: ['technologiczny', 'digital', 'precise'], sample: 'Grotesk type, cool blues, mono accents' },
  editorial: { description: 'Magazine rhythm, storytelling hierarchy', tags: ['redakcyjny', 'magazine', 'storytelling'], sample: 'Serif headlines, columns, image-forward layouts' },
  warm: { description: 'Inviting earth tones and soft light', tags: ['ciepły', 'cozy', 'inviting'], sample: 'Terracotta, cream, soft shadows' },
  cool: { description: 'Calm blues and airy neutrals', tags: ['chłodny', 'calm', 'airy'], sample: 'Ocean blues, pale grays, crisp edges' },
  premium: { description: 'Polished, high-trust presentation', tags: ['premium', 'high-quality', 'refined'], sample: 'Refined spacing, subtle shadows, restrained color' },
  creative: { description: 'Expressive, unexpected, artistic', tags: ['kreatywny', 'expressive', 'artistic'], sample: 'Asymmetric layouts, vivid accents, display type' },
  friendly: { description: 'Warm, human, approachable', tags: ['przyjazny', 'approachable', 'human'], sample: 'Rounded fonts, soft colors, conversational copy' },
  corporate: { description: 'Trustworthy, structured, professional', tags: ['firmowy', 'professional', 'business'], sample: 'Grotesk type, navy palette, consistent grid' },
  dark: { description: 'Low-key surfaces, dramatic focus', tags: ['ciemny', 'moody', 'night'], sample: 'Near-black surfaces, glowing accents' },
  light: { description: 'Bright surfaces, open whitespace', tags: ['jasny', 'bright', 'airy'], sample: 'White canvas, soft gray borders' },
  futuristic: { description: 'Forward-looking, sci-fi influenced', tags: ['futurystyczny', 'sci-fi', 'next'], sample: 'Geometric display, cyan/violet, gradients' },
  organic: { description: 'Natural shapes, sustainable feel', tags: ['organiczny', 'natural', 'sustainable'], sample: 'Earth tones, soft curves, texture' },
  artistic: { description: 'Gallery-grade expressive composition', tags: ['artystyczny', 'expressive', 'gallery'], sample: 'Unexpected scale, bold type, high contrast' },
};

export const moodEntries: MoodEntry[] = MOODS.map((m) => {
  const meta = MOOD_DESCRIPTIONS[m];
  return {
    id: `mood-${m}`,
    name: m.charAt(0).toUpperCase() + m.slice(1),
    description: meta?.description ?? m,
    category: 'mood',
    tags: meta?.tags ?? [m],
    mood: [m],
    preview: {
      h1: meta?.sample ?? m,
      body: `Designs tagged “${m}” across fonts, pairings, palettes, typography and style packs.`,
    },
  };
});

/**
 * Query expansion — Polish/common synonyms → canonical English tokens.
 * Used by search so "elegancki" finds Elegant/Luxury/Editorial items.
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  elegancki: ['elegant', 'luxury', 'editorial'],
  elegancka: ['elegant', 'luxury', 'editorial'],
  nowoczesny: ['modern', 'contemporary'],
  nowoczesna: ['modern', 'contemporary'],
  klasyczny: ['classic', 'traditional'],
  odwazny: ['bold', 'strong', 'impactful'],
  smialy: ['bold', 'strong'],
  luksusowy: ['luxury', 'premium'],
  luksusowa: ['luxury', 'premium'],
  przyjazny: ['friendly', 'warm'],
  zabawny: ['playful', 'creative'],
  technologiczny: ['tech', 'futuristic'],
  firmowy: ['corporate', 'professional'],
  cieply: ['warm'],
  ciepły: ['warm'],
  chlodny: ['cool'],
  chłodny: ['cool'],
  ciemny: ['dark'],
  jasny: ['light'],
  minimal: ['minimal', 'minimalistyczny'],
  dentysta: ['dental'], dentystyczny: ['dental'],
  restauracja: ['restaurant', 'food'],
  prawniczy: ['law'], kancelaria: ['law'],
  medyczny: ['medical', 'healthcare'],
  piekno: ['beauty'], uroda: ['beauty'],
  moda: ['fashion'],
  finanse: ['finance'], bankowy: ['finance'],
  edukacja: ['education'],
  podroze: ['travel'], podróż: ['travel'],
  sport: ['sport', 'fitness'],
  redakcyjny: ['editorial'],
  premium: ['premium', 'luxury'],
};

/** Expand a raw query into tokens (original + synonym targets). */
export function expandQuery(query: string): string[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const tokens = new Set<string>([q]);
  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    if (q.includes(key) || key.includes(q)) {
      values.forEach((v) => tokens.add(v));
    }
  }
  return [...tokens];
}

/** Map free-text font metadata to the canonical personality vocabulary. */
export function derivePersonalities(input: {
  personality?: string;
  mood?: string[];
  tags?: string[];
  category?: string;
  formality?: string;
}): FontPersonality[] {
  const hay = [
    input.personality ?? '',
    ...(input.mood ?? []),
    ...(input.tags ?? []),
    input.category ?? '',
    input.formality ?? '',
  ].join(' ').toLowerCase();

  const out = new Set<FontPersonality>();
  const has = (...words: string[]) => words.some((w) => hay.includes(w));

  if (has('classic', 'traditional', 'timeless')) out.add('classic');
  if (has('modern', 'contemporary', 'clean')) out.add('modern');
  if (has('elegant', 'graceful', 'refined')) out.add('elegant');
  if (has('bold', 'strong', 'heavy')) out.add('bold');
  if (has('tech', 'technical', 'geometric')) out.add('tech');
  if (has('impactful', 'condensed', 'all-caps', 'all caps')) out.add('impactful');
  if (has('strong', 'robust')) out.add('strong');
  if (has('friendly', 'approachable', 'warm', 'rounded')) out.add('friendly');
  if (has('premium', 'high-end')) out.add('premium');
  if (has('creative', 'expressive', 'distinctive')) out.add('creative');
  if (has('futuristic', 'sci-fi', 'neon')) out.add('futuristic');
  if (has('nostalgic', 'retro', 'vintage')) out.add('nostalgic');
  if (has('editorial', 'magazine', 'publishing')) out.add('editorial');
  if (has('luxury', 'opulent')) out.add('luxury');
  if (has('minimal', 'simple', 'neutral')) out.add('minimal');
  if (has('playful', 'fun', 'casual')) out.add('playful');
  if (has('professional', 'corporate', 'business')) out.add('professional');
  if (has('organic', 'natural', 'handmade')) out.add('organic');
  if (has('artistic', 'expressive', 'script', 'calligraphic')) out.add('artistic');
  if (has('sport', 'athletic', 'dynamic')) out.add('sport');
  if (has('corporate', 'business', 'enterprise')) out.add('corporate');

  if (out.size === 0) out.add('modern');
  return [...out];
}

export default { FONT_PERSONALITIES, MOODS, moodEntries, SEARCH_SYNONYMS, expandQuery, derivePersonalities };
