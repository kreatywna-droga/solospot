/**
 * VisualLanguages.ts — 5 Reference Visual Languages
 *
 * Quality over quantity. Each language is a complete, coherent design
 * system with Visual DNA, principles, anti-patterns, decisions, and tokens.
 *
 * These are the ONLY high-fidelity languages. All other Style Packs
 * must map to one of these languages or be rejected as inconsistent.
 */

import type { VisualLanguage, VisualDNA, AntiPattern } from './types';

const luxuryEditorialDNA: VisualDNA = {
  mood: 'luxury / editorial',
  density: 'sparse',
  contrast: 'medium',
  geometry: 'sharp',
  typographyCharacter: 'editorial',
  layoutCharacter: 'asymmetric',
  imageCharacter: 'editorial',
  decorationLevel: 'restrained',
  motionCharacter: 'subtle',
};

const modernTechnologyDNA: VisualDNA = {
  mood: 'modern / technical',
  density: 'balanced',
  contrast: 'high',
  geometry: 'sharp',
  typographyCharacter: 'technical',
  layoutCharacter: 'grid',
  imageCharacter: 'abstract',
  decorationLevel: 'minimal',
  motionCharacter: 'dynamic',
};

const premiumSportDNA: VisualDNA = {
  mood: 'premium / energetic',
  density: 'balanced',
  contrast: 'high',
  geometry: 'sharp',
  typographyCharacter: 'geometric',
  layoutCharacter: 'modular',
  imageCharacter: 'product',
  decorationLevel: 'restrained',
  motionCharacter: 'dynamic',
};

const cinematicCreativeDNA: VisualDNA = {
  mood: 'cinematic / creative',
  density: 'balanced',
  contrast: 'high',
  geometry: 'mixed',
  typographyCharacter: 'expressive',
  layoutCharacter: 'full-bleed',
  imageCharacter: 'cinematic',
  decorationLevel: 'expressive',
  motionCharacter: 'cinematic',
};

const minimalProductDNA: VisualDNA = {
  mood: 'minimal / product-focused',
  density: 'sparse',
  contrast: 'high',
  geometry: 'soft',
  typographyCharacter: 'grotesk',
  layoutCharacter: 'grid',
  imageCharacter: 'product',
  decorationLevel: 'minimal',
  motionCharacter: 'static',
};

export const VISUAL_LANGUAGES: VisualLanguage[] = [
  {
    id: 'luxury-editorial',
    name: 'Luxury Editorial',
    description: 'High-end editorial luxury with restrained elegance, asymmetric layouts, and typography-driven hierarchy.',
    visualDNA: luxuryEditorialDNA,
    principles: [
      'PRINCIPLE: Luxury uses restraint.',
      'DECISION: Avoid excessive decoration.',
      'APPLICATION: Fewer shadows, fewer borders, larger whitespace, stronger typography, controlled accent color.',
      'VERIFICATION: Check visual density and hierarchy.',
      'PRINCIPLE: Typography is the primary visual element.',
      'DECISION: Use typography hierarchy to create visual interest.',
      'APPLICATION: Large display headings, controlled body width, generous vertical rhythm.',
      'VERIFICATION: Headlines should be unmistakable; body should be comfortable to read.',
      'PRINCIPLE: Asymmetric layout creates editorial tension.',
      'DECISION: Prefer asymmetric composition over centered stacks.',
      'APPLICATION: Off-center images, offset text blocks, intentional white space imbalance.',
      'VERIFICATION: Layout should feel curated, not templated.',
      'PRINCIPLE: Color is used sparingly and intentionally.',
      'DECISION: Deep neutrals with single metallic/warm accent.',
      'APPLICATION: Backgrounds in warm neutrals, accents in gold/bronze, text in deep charcoal.',
      'VERIFICATION: No more than 2-3 colors per viewport.',
    ],
    antiPatterns: [
      { id: 'luxury-1', label: 'Excessive gradients', description: 'Luxury uses restraint, not flashy gradients', severity: 'HIGH', repairHint: 'Remove gradients; use solid colors or subtle texture' },
      { id: 'luxury-2', label: 'Heavy shadows', description: 'Luxury avoids heavy drop shadows', severity: 'HIGH', repairHint: 'Replace with soft layered depth or none' },
      { id: 'luxury-3', label: 'Excessive gold', description: 'Gold accent used sparingly, not everywhere', severity: 'MEDIUM', repairHint: 'Reduce gold to single accent element' },
      { id: 'luxury-4', label: 'Random decorative elements', description: 'Luxury is intentional, every element has purpose', severity: 'MEDIUM', repairHint: 'Remove non-essential decoration' },
      { id: 'luxury-5', label: 'Playful round shapes', description: 'Luxury avoids playful rounded corners', severity: 'LOW', repairHint: 'Use subtle (4–8px) or sharp corners' },
      { id: 'luxury-6', label: 'Dense layout', description: 'Luxury needs whitespace', severity: 'HIGH', repairHint: 'Increase section padding and whitespace' },
      { id: 'luxury-7', label: 'Weak typography hierarchy', description: 'Luxury relies on strong type contrast', severity: 'HIGH', repairHint: 'Increase display font size, improve weight contrast' },
    ],
    designDecisions: [
      'Increase hero whitespace by 50%',
      'Enlarge H1 to 4.5rem+ with high contrast weight',
      'Reduce decoration to single accent element per section',
      'Use restrained shadows (soft layered depth only)',
      'Increase section rhythm to 120-160px',
      'Apply asymmetric image composition',
      'Reduce accent frequency to 1-2 per viewport',
      'Strengthen typography hierarchy (display > headline > body)',
    ],
    tokens: {
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        h1Size: '4.5rem',
        h2Size: '3rem',
        h3Size: '1.75rem',
        bodySize: '1.125rem',
        lineHeight: '1.4',
        letterSpacing: '-0.02em',
      },
      colors: {
        primary: '#1a1a1a',
        secondary: '#666666',
        background: '#f8f5f0',
        text: '#1a1a1a',
        accent: '#c9a96e',
        cta: '#c9a96e',
      },
      spacing: {
        sectionPadding: '120px',
        gap: '32px',
        rhythm: 'generous',
      },
      radius: {
        button: '4px',
        card: '4px',
        section: '0px',
      },
      shadows: {
        elevation: 'soft',
        style: 'layered',
      },
      components: {
        button: 'minimal-outlined',
        card: 'clean-shadow',
      },
      composition: {
        layout: 'asymmetric-editorial',
        maxWidth: '1400px',
        alignment: 'offset',
      },
    },
  },
  {
    id: 'modern-technology',
    name: 'Modern Technology',
    description: 'Clean, precise, engineered aesthetic with dark canvas, electric accents, and structured precision.',
    visualDNA: modernTechnologyDNA,
    principles: [
      'PRINCIPLE: Technology implies clarity and precision.',
      'DECISION: Use structured, data-like precision.',
      'APPLICATION: Dark base, electric accent, strict grid, mono labels.',
      'VERIFICATION: Design should feel engineered, not decorative.',
      'PRINCIPLE: Motion must feel functional.',
      'DECISION: Use transitions that communicate state changes.',
      'APPLICATION: Scan/reveal/glitch accents used sparingly.',
      'VERIFICATION: Motion serves function, not decoration.',
      'PRINCIPLE: Typography communicates technical precision.',
      'DECISION: Use geometric sans with tight tracking.',
      'APPLICATION: Mono for labels, clean sans for body, tabular figures for data.',
      'VERIFICATION: Text should feel precise and engineered.',
    ],
    antiPatterns: [
      { id: 'tech-1', label: 'Excessive decoration', description: 'Technology implies clarity, not decoration', severity: 'HIGH', repairHint: 'Remove decorative elements; keep only functional components' },
      { id: 'tech-2', label: 'Soft rounded corners', description: 'Technology uses sharp or slight radius', severity: 'MEDIUM', repairHint: 'Use 0-8px radius only' },
      { id: 'tech-3', label: 'Warm colors', description: 'Technology uses neutral + electric accent', severity: 'MEDIUM', repairHint: 'Replace warm colors with neutral + cyan/violet accent' },
      { id: 'tech-4', label: 'Heavy shadows', description: 'Technology uses glow/neon, not drop shadows', severity: 'LOW', repairHint: 'Replace shadows with glow effects or none' },
      { id: 'tech-5', label: 'Cluttered layout', description: 'Technology implies clarity and focus', severity: 'HIGH', repairHint: 'Simplify to essential elements only' },
    ],
    designDecisions: [
      'Apply dark base (#0a0a0f) with electric cyan accent',
      'Use strict grid system with consistent gutters',
      'Set mono font for labels and data',
      'Reduce decoration to functional elements only',
      'Apply glow effects instead of shadows',
      'Use tight tracking on display typography',
      'Increase contrast for data visualization',
    ],
    tokens: {
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        labelFont: 'JetBrains Mono',
        h1Size: '3.5rem',
        h2Size: '2.5rem',
        h3Size: '1.5rem',
        bodySize: '1rem',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
      },
      colors: {
        primary: '#0a0a0f',
        secondary: '#1a1a2e',
        background: '#0a0a0f',
        text: '#e5e5e5',
        accent: '#00d4ff',
        cta: '#00d4ff',
      },
      spacing: {
        sectionPadding: '80px',
        gap: '24px',
        rhythm: 'structured',
      },
      radius: {
        button: '4px',
        card: '4px',
        section: '0px',
      },
      shadows: {
        elevation: 'glow',
        style: 'neon',
      },
      components: {
        button: 'tech-minimal',
        card: 'tech-bordered',
      },
      composition: {
        layout: 'modular-grid',
        maxWidth: '1200px',
        alignment: 'left',
      },
    },
  },
  {
    id: 'premium-sport',
    name: 'Premium Sport',
    description: 'Dynamic, energetic premium aesthetic with strong geometry, tight composition, and bold accents.',
    visualDNA: premiumSportDNA,
    principles: [
      'PRINCIPLE: Sport implies energy and movement.',
      'DECISION: Use dynamic alignment and strong geometry.',
      'APPLICATION: Tight composition, large numbers, strong contrast, dynamic alignment.',
      'VERIFICATION: Design should feel energetic and confident.',
      'PRINCIPLE: Premium implies quality and restraint.',
      'DECISION: Use controlled accent color and refined materials.',
      'APPLICATION: Single strong accent, refined typography, quality imagery.',
      'VERIFICATION: Design should feel premium, not cheap.',
      'PRINCIPLE: Typography drives energy.',
      'DECISION: Use geometric sans with strong weight contrast.',
      'APPLICATION: Oversized numbers, tight tracking on headlines, clear hierarchy.',
      'VERIFICATION: Typography should feel powerful and confident.',
    ],
    antiPatterns: [
      { id: 'sport-1', label: 'Weak contrast', description: 'Sport needs strong visual impact', severity: 'HIGH', repairHint: 'Increase contrast ratio to WCAG AA+' },
      { id: 'sport-2', label: 'Loose composition', description: 'Sport uses tight, dynamic composition', severity: 'MEDIUM', repairHint: 'Reduce whitespace, increase element density' },
      { id: 'sport-3', label: 'Soft geometry', description: 'Sport uses sharp, strong geometry', severity: 'MEDIUM', repairHint: 'Use sharp corners, strong lines, bold shapes' },
      { id: 'sport-4', label: 'Multiple weak accents', description: 'Sport uses single strong accent', severity: 'MEDIUM', repairHint: 'Consolidate to single accent color' },
      { id: 'sport-5', label: 'Slow motion', description: 'Sport implies energy and movement', severity: 'LOW', repairHint: 'Increase motion speed and dynamic transitions' },
    ],
    designDecisions: [
      'Apply tight composition with strong alignment',
      'Use large numerals for key metrics',
      'Set strong contrast palette (dark + electric accent)',
      'Apply sharp geometry (0-4px radius)',
      'Use geometric sans for headings',
      'Increase visual rhythm for energy',
      'Apply dynamic alignment for action shots',
    ],
    tokens: {
      typography: {
        headingFont: 'Bebas Neue',
        bodyFont: 'Inter',
        h1Size: '5rem',
        h2Size: '3.5rem',
        h3Size: '2rem',
        bodySize: '1rem',
        lineHeight: '1.1',
        letterSpacing: '0.05em',
      },
      colors: {
        primary: '#0a0a0f',
        secondary: '#333333',
        background: '#0a0a0f',
        text: '#ffffff',
        accent: '#ff3b30',
        cta: '#ff3b30',
      },
      spacing: {
        sectionPadding: '60px',
        gap: '16px',
        rhythm: 'tight',
      },
      radius: {
        button: '0px',
        card: '0px',
        section: '0px',
      },
      shadows: {
        elevation: 'none',
        style: 'hard',
      },
      components: {
        button: 'sport-bold',
        card: 'sport-bordered',
      },
      composition: {
        layout: 'dynamic-modular',
        maxWidth: '1200px',
        alignment: 'dynamic',
      },
    },
  },
  {
    id: 'cinematic-creative',
    name: 'Cinematic Creative',
    description: 'Bold, expressive creative aesthetic with full-bleed imagery, dramatic typography, and dynamic motion.',
    visualDNA: cinematicCreativeDNA,
    principles: [
      'PRINCIPLE: Cinema implies drama and immersion.',
      'DECISION: Use full-bleed imagery and dramatic scale.',
      'APPLICATION: Full-bleed hero, large typography, overlay effects, minimal chrome.',
      'VERIFICATION: Design should feel immersive and cinematic.',
      'PRINCIPLE: Creative implies originality.',
      'DECISION: Use distinctive palette and typography pairing.',
      'APPLICATION: Unexpected color combinations, expressive display type.',
      'VERIFICATION: Design should feel unique, not templated.',
      'PRINCIPLE: Motion enhances narrative.',
      'DECISION: Use cinematic reveals and scroll-driven animations.',
      'APPLICATION: Parallax, fade-ins, scale reveals, smooth easing.',
      'VERIFICATION: Motion should feel like film, not UI.',
    ],
    antiPatterns: [
      { id: 'cinema-1', label: 'Tiny hero', description: 'Cinema needs full-bleed impact', severity: 'HIGH', repairHint: 'Expand hero to full viewport with immersive imagery' },
      { id: 'cinema-2', label: 'Weak typography', description: 'Cinema uses dramatic typography scale', severity: 'HIGH', repairHint: 'Increase display font size, use high contrast' },
      { id: 'cinema-3', label: 'Boxed layout', description: 'Cinema breaks free from boxes', severity: 'MEDIUM', repairHint: 'Use full-bleed sections, break grid intentionally' },
      { id: 'cinema-4', label: 'Static only', description: 'Cinema uses motion for narrative', severity: 'MEDIUM', repairHint: 'Add scroll-driven reveals and parallax' },
      { id: 'cinema-5', label: 'Safe colors', description: 'Cinema uses bold, distinctive palette', severity: 'LOW', repairHint: 'Increase color saturation and contrast' },
    ],
    designDecisions: [
      'Apply full-bleed hero with immersive imagery',
      'Use dramatic typography scale (H1 6rem+)',
      'Add cinematic overlay (gradient or color)',
      'Apply scroll-driven reveal animations',
      'Use expressive display font pairing',
      'Increase image scale and impact',
      'Add subtle parallax for depth',
    ],
    tokens: {
      typography: {
        headingFont: 'Bebas Neue',
        bodyFont: 'Inter',
        h1Size: '6rem',
        h2Size: '4rem',
        h3Size: '2.5rem',
        bodySize: '1.125rem',
        lineHeight: '1.2',
        letterSpacing: '-0.02em',
      },
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        background: '#000000',
        text: '#ffffff',
        accent: '#ff3b30',
        cta: '#ff3b30',
      },
      spacing: {
        sectionPadding: '0px',
        gap: '48px',
        rhythm: 'dramatic',
      },
      radius: {
        button: '0px',
        card: '0px',
        section: '0px',
      },
      shadows: {
        elevation: 'dramatic',
        style: 'cinematic',
      },
      components: {
        button: 'cinematic-bold',
        card: 'cinematic-minimal',
      },
      composition: {
        layout: 'full-bleed',
        maxWidth: '100%',
        alignment: 'centered',
      },
    },
  },
  {
    id: 'minimal-product',
    name: 'Minimal Product',
    description: 'Clean, focused product aesthetic with near-monochrome palette, generous whitespace, and functional motion.',
    visualDNA: minimalProductDNA,
    principles: [
      'PRINCIPLE: Minimal removes before adding.',
      'DECISION: Every element must justify its presence.',
      'APPLICATION: Fewer borders, larger padding, no decoration, single accent.',
      'VERIFICATION: If removing it doesn\'t hurt, remove it.',
      'PRINCIPLE: Product imagery is the hero.',
      'DECISION: Use sparse, intentional imagery; product over decoration.',
      'APPLICATION: Large product images, clean backgrounds, focus on detail.',
      'VERIFICATION: Product should be unmistakable.',
      'PRINCIPLE: Motion is functional, not decorative.',
      'DECISION: Use instant response and subtle state transitions.',
      'APPLICATION: Fast transitions, no bounce, no decorative motion.',
      'VERIFICATION: Motion should feel instant and purposeful.',
    ],
    antiPatterns: [
      { id: 'minimal-1', label: 'Excessive decoration', description: 'Minimal removes non-essential elements', severity: 'HIGH', repairHint: 'Remove all non-essential decoration' },
      { id: 'minimal-2', label: 'Multiple accents', description: 'Minimal uses single accent only', severity: 'MEDIUM', repairHint: 'Reduce to single accent color' },
      { id: 'minimal-3', label: 'Tight spacing', description: 'Minimal needs breathing room', severity: 'MEDIUM', repairHint: 'Increase padding and whitespace' },
      { id: 'minimal-4', label: 'Heavy borders', description: 'Minimal uses hairline or no borders', severity: 'LOW', repairHint: 'Replace heavy borders with subtle dividers or whitespace' },
      { id: 'minimal-5', label: 'Decorative motion', description: 'Minimal uses functional motion only', severity: 'LOW', repairHint: 'Remove decorative animations' },
    ],
    designDecisions: [
      'Reduce to near-monochrome palette',
      'Increase whitespace by 30%',
      'Remove all non-essential borders and dividers',
      'Use single accent color for CTAs only',
      'Apply functional motion (instant response)',
      'Focus on product imagery with clean backgrounds',
      'Use left-aligned or simple grid layout',
    ],
    tokens: {
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        h1Size: '3rem',
        h2Size: '2rem',
        h3Size: '1.25rem',
        bodySize: '1rem',
        lineHeight: '1.6',
        letterSpacing: '-0.01em',
      },
      colors: {
        primary: '#000000',
        secondary: '#666666',
        background: '#ffffff',
        text: '#000000',
        accent: '#0066ff',
        cta: '#0066ff',
      },
      spacing: {
        sectionPadding: '100px',
        gap: '48px',
        rhythm: 'generous',
      },
      radius: {
        button: '4px',
        card: '4px',
        section: '0px',
      },
      shadows: {
        elevation: 'none',
        style: 'hairline',
      },
      components: {
        button: 'minimal-text',
        card: 'minimal-borderless',
      },
      composition: {
        layout: 'simple-grid',
        maxWidth: '1200px',
        alignment: 'left',
      },
    },
  },
];

export const VISUAL_LANGUAGE_IDS = VISUAL_LANGUAGES.map((l) => l.id);

export function getVisualLanguage(id: string): VisualLanguage | undefined {
  return VISUAL_LANGUAGES.find((l) => l.id === id);
}

export function mapNaturalLanguageToVisualDNA(phrase: string): Partial<VisualDNA> {
  const lower = phrase.toLowerCase();
  const dna: Partial<VisualDNA> = {};

  if (/\b(luksusow|luxury|premium|ekskluzywn|opulent)\b/.test(lower)) {
    dna.mood = 'luxury / editorial';
    dna.density = 'sparse';
    dna.contrast = 'medium';
    dna.geometry = 'sharp';
    dna.typographyCharacter = 'editorial';
    dna.layoutCharacter = 'asymmetric';
    dna.imageCharacter = 'editorial';
    dna.decorationLevel = 'restrained';
    dna.motionCharacter = 'subtle';
  } else if (/\b(technologiczn|tech|nowoczesn|futurystyczn|precyzyjn)/i.test(lower)) {
    dna.mood = 'modern / technical';
    dna.density = 'balanced';
    dna.contrast = 'high';
    dna.geometry = 'sharp';
    dna.typographyCharacter = 'technical';
    dna.layoutCharacter = 'grid';
    dna.imageCharacter = 'abstract';
    dna.decorationLevel = 'minimal';
    dna.motionCharacter = 'dynamic';
  } else if (/\b(sport|energetyczn|dynamiczn|fitness|active)/i.test(lower)) {
    dna.mood = 'premium / energetic';
    dna.density = 'balanced';
    dna.contrast = 'high';
    dna.geometry = 'sharp';
    dna.typographyCharacter = 'geometric';
    dna.layoutCharacter = 'modular';
    dna.imageCharacter = 'product';
    dna.decorationLevel = 'restrained';
    dna.motionCharacter = 'dynamic';
  } else if (/\b(kinematyczn|cinematic|creative|artystyczn|filmow|ekspresywn)/i.test(lower)) {
    dna.mood = 'cinematic / creative';
    dna.density = 'balanced';
    dna.contrast = 'high';
    dna.geometry = 'mixed';
    dna.typographyCharacter = 'expressive';
    dna.layoutCharacter = 'full-bleed';
    dna.imageCharacter = 'cinematic';
    dna.decorationLevel = 'expressive';
    dna.motionCharacter = 'cinematic';
  } else if (/\b(minimal|proste|czyst|clean|product-focused|bezdekoracyjn)/i.test(lower)) {
    dna.mood = 'minimal / product-focused';
    dna.density = 'sparse';
    dna.contrast = 'high';
    dna.geometry = 'soft';
    dna.typographyCharacter = 'grotesk';
    dna.layoutCharacter = 'grid';
    dna.imageCharacter = 'product';
    dna.decorationLevel = 'minimal';
    dna.motionCharacter = 'static';
  }

  return dna;
}
