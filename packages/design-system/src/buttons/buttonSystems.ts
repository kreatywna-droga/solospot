/**
 * Button Systems — 14 Button Style Systems
 *
 * Each system has: Primary, Secondary, Tertiary, CTA, Link
 * with radius, height, padding, font, weight, border, shadow, hover, active, disabled.
 */

import type { ColorPalette } from '../colors/colorPalettes';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'cta' | 'link';
export type ButtonStyleName = 'Solid' | 'Outline' | 'Ghost' | 'Text' | 'Pill' | 'Square' | 'Rounded' | 'Minimal' | 'Luxury' | 'Glass' | 'Gradient' | 'Neon' | 'Editorial';

export interface ButtonStyle {
  id: string;
  name: string;
  styleName: ButtonStyleName;
  variants: Record<ButtonVariant, {
    radius: string;
    height: string;
    padding: string;
    font: string;
    weight: number;
    border: string;
    shadow: string;
    hover: Record<string, string>;
    active: Record<string, string>;
    disabled: Record<string, string>;
  }>;
  metadata: {
    bestIndustries: string[];
    goodUseCases: string[];
    badUseCases: string[];
    antiPatterns: string[];
  };
  version: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

function createButtonStyle(
  id: string,
  name: string,
  styleName: ButtonStyleName,
  variants: Record<ButtonVariant, ButtonStyle['variants'][ButtonVariant]>,
  metadata: ButtonStyle['metadata'],
  tags: string[] = []
): ButtonStyle {
  const now = Date.now();
  return {
    id,
    name,
    styleName,
    variants,
    metadata,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags,
  };
}

// ============================================================
// SOLID BUTTONS
// ============================================================

export const solidButtons: ButtonStyle = createButtonStyle(
  'buttons-solid',
  'Solid',
  'Solid',
  {
    primary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid transparent',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      hover: { backgroundColor: '#0055CC', transform: 'translateY(-1px)' },
      active: { backgroundColor: '#0044AA', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid #0066CC',
      shadow: 'none',
      hover: { backgroundColor: '#E8F0FF', transform: 'translateY(-1px)' },
      active: { backgroundColor: '#D0E4FF', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5', transform: 'translateY(-1px)' },
      active: { backgroundColor: '#E8E8E8', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '8px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: '2px solid transparent',
      shadow: '0 4px 8px rgba(0,0,0,0.15)',
      hover: { backgroundColor: '#0055CC', transform: 'translateY(-2px)' },
      active: { backgroundColor: '#0044AA', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline', color: '#0055CC' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','corporate','general'],
    goodUseCases: ['web apps','dashboards','landing pages'],
    badUseCases: ['luxury','editorial','fashion'],
    antiPatterns: ['overusing primary buttons','insufficient contrast'],
  },
  ['solid','modern','professional']
);

// ============================================================
// OUTLINE BUTTONS
// ============================================================

export const outlineButtons: ButtonStyle = createButtonStyle(
  'buttons-outline',
  'Outline',
  'Outline',
  {
    primary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid currentColor',
      shadow: 'none',
      hover: { backgroundColor: 'transparent', borderColor: '#0055CC' },
      active: { backgroundColor: '#E8F0FF' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid #CCCCCC',
      shadow: 'none',
      hover: { borderColor: '#999999' },
      active: { backgroundColor: '#F5F5F5' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '8px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: '2px solid currentColor',
      shadow: 'none',
      hover: { borderColor: '#0055CC', backgroundColor: '#E8F0FF' },
      active: { backgroundColor: '#D0E4FF' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','creative','marketing'],
    goodUseCases: ['secondary actions','forms','navigation'],
    badUseCases: ['primary CTAs','luxury'],
    antiPatterns: ['too many outline buttons','insufficient visual hierarchy'],
  },
  ['outline','clean','versatile']
);

// ============================================================
// GHOST BUTTONS
// ============================================================

export const ghostButtons: ButtonStyle = createButtonStyle(
  'buttons-ghost',
  'Ghost',
  'Ghost',
  {
    primary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: 'none',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(0,0,0,0.05)' },
      active: { backgroundColor: 'rgba(0,0,0,0.1)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: 'none',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(0,0,0,0.05)' },
      active: { backgroundColor: 'rgba(0,0,0,0.1)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(0,0,0,0.05)' },
      active: { backgroundColor: 'rgba(0,0,0,0.1)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '8px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: 'none',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(0,0,0,0.08)' },
      active: { backgroundColor: 'rgba(0,0,0,0.12)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','minimal','creative'],
    goodUseCases: ['minimal interfaces','secondary actions','toolbars'],
    badUseCases: ['primary CTAs','luxury','high-visibility actions'],
    antiPatterns: ['low visibility','insufficient contrast'],
  },
  ['ghost','minimal','clean']
);

// ============================================================
// TEXT BUTTONS
// ============================================================

export const textButtons: ButtonStyle = createButtonStyle(
  'buttons-text',
  'Text',
  'Text',
  {
    primary: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 600, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 400, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '0px', height: 'auto', padding: '12px 24px',
      font: 'Inter', weight: 700, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','minimal','editorial'],
    goodUseCases: ['inline actions','links','minimal interfaces'],
    badUseCases: ['primary CTAs','high-visibility actions'],
    antiPatterns: ['indistinguishable from text','low visibility'],
  },
  ['text','minimal','inline']
);

// ============================================================
// PILL BUTTONS
// ============================================================

export const pillButtons: ButtonStyle = createButtonStyle(
  'buttons-pill',
  'Pill',
  'Pill',
  {
    primary: {
      radius: '9999px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid transparent',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      hover: { transform: 'translateY(-1px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '9999px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid #CCCCCC',
      shadow: 'none',
      hover: { borderColor: '#999999' },
      active: { backgroundColor: '#F5F5F5' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '9999px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '9999px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: '2px solid transparent',
      shadow: '0 4px 8px rgba(0,0,0,0.15)',
      hover: { transform: 'translateY(-2px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '9999px', height: 'auto', padding: '8px 24px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'none' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','creative','marketing','lifestyle'],
    goodUseCases: ['tags','filters','modern UIs','mobile apps'],
    badUseCases: ['formal corporate','luxury'],
    antiPatterns: ['too many pill buttons','visual noise'],
  },
  ['pill','modern','friendly']
);

// ============================================================
// SQUARE BUTTONS
// ============================================================

export const squareButtons: ButtonStyle = createButtonStyle(
  'buttons-square',
  'Square',
  'Square',
  {
    primary: {
      radius: '0px', height: '48px', padding: '16px 24px',
      font: 'Inter', weight: 600, border: '2px solid transparent',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      hover: { transform: 'translateY(-1px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '0px', height: '48px', padding: '16px 24px',
      font: 'Inter', weight: 600, border: '2px solid #CCCCCC',
      shadow: 'none',
      hover: { borderColor: '#999999' },
      active: { backgroundColor: '#F5F5F5' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '0px', height: '48px', padding: '16px 24px',
      font: 'Inter', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '0px', height: '56px', padding: '20px 32px',
      font: 'Inter', weight: 700, border: '2px solid transparent',
      shadow: '0 4px 8px rgba(0,0,0,0.15)',
      hover: { transform: 'translateY(-2px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','corporate','enterprise'],
    goodUseCases: ['forms','dashboards','data tables'],
    badUseCases: ['luxury','creative','fashion'],
    antiPatterns: ['sharp corners on luxury sites','visual harshness'],
  },
  ['square','corporate','technical']
);

// ============================================================
// ROUNDED BUTTONS
// ============================================================

export const roundedButtons: ButtonStyle = createButtonStyle(
  'buttons-rounded',
  'Rounded',
  'Rounded',
  {
    primary: {
      radius: '12px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid transparent',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      hover: { transform: 'translateY(-1px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '12px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '2px solid #CCCCCC',
      shadow: 'none',
      hover: { borderColor: '#999999' },
      active: { backgroundColor: '#F5F5F5' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '12px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '12px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: '2px solid transparent',
      shadow: '0 4px 8px rgba(0,0,0,0.15)',
      hover: { transform: 'translateY(-2px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '12px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','creative','general'],
    goodUseCases: ['modern UIs','web apps','landing pages'],
    badUseCases: ['luxury','editorial'],
    antiPatterns: ['inconsistent radius','too rounded'],
  },
  ['rounded','modern','friendly']
);

// ============================================================
// MINIMAL BUTTONS
// ============================================================

export const minimalButtons: ButtonStyle = createButtonStyle(
  'buttons-minimal',
  'Minimal',
  'Minimal',
  {
    primary: {
      radius: '4px', height: '40px', padding: '12px 24px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(0,0,0,0.05)' },
      active: { backgroundColor: 'rgba(0,0,0,0.1)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '4px', height: '40px', padding: '12px 24px',
      font: 'Inter', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '4px', height: '40px', padding: '12px 24px',
      font: 'Inter', weight: 400, border: 'none',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(0,0,0,0.03)' },
      active: { backgroundColor: 'rgba(0,0,0,0.06)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '4px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: 'none',
      shadow: '0 1px 2px rgba(0,0,0,0.05)',
      hover: { backgroundColor: 'rgba(0,0,0,0.08)' },
      active: { backgroundColor: 'rgba(0,0,0,0.12)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','minimal','general'],
    goodUseCases: ['minimal interfaces','subtle actions','clean UIs'],
    badUseCases: ['luxury','bold','high-visibility'],
    antiPatterns: ['too subtle','invisible actions'],
  },
  ['minimal','clean','subtle']
);

// ============================================================
// LUXURY BUTTONS
// ============================================================

export const luxuryButtons: ButtonStyle = createButtonStyle(
  'buttons-luxury',
  'Luxury',
  'Luxury',
  {
    primary: {
      radius: '0px', height: '56px', padding: '20px 48px',
      font: 'Playfair Display', weight: 600, border: '2px solid #D4A843',
      shadow: '0 2px 8px rgba(212,168,67,0.2)',
      hover: { backgroundColor: '#D4A843', color: '#FFFFFF', transform: 'translateY(-1px)' },
      active: { backgroundColor: '#B8860B', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '0px', height: '56px', padding: '20px 48px',
      font: 'Playfair Display', weight: 600, border: '2px solid #D4A843',
      shadow: 'none',
      hover: { borderColor: '#B8860B' },
      active: { backgroundColor: '#FAF0E6' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '0px', height: '48px', padding: '16px 32px',
      font: 'Playfair Display', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '0px', height: '64px', padding: '24px 56px',
      font: 'Playfair Display', weight: 700, border: '2px solid #D4A843',
      shadow: '0 4px 16px rgba(212,168,67,0.3)',
      hover: { backgroundColor: '#D4A843', color: '#FFFFFF', transform: 'translateY(-2px)' },
      active: { backgroundColor: '#B8860B', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '12px 24px',
      font: 'Playfair Display', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline', color: '#D4A843' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['luxury','fashion','beauty','high-end'],
    goodUseCases: ['luxury branding','high-end products','editorial'],
    badUseCases: ['tech','casual','modern'],
    antiPatterns: ['overuse','too ornate for simple UIs'],
  },
  ['luxury','elegant','refined']
);

// ============================================================
// GLASS BUTTONS
// ============================================================

export const glassButtons: ButtonStyle = createButtonStyle(
  'buttons-glass',
  'Glass',
  'Glass',
  {
    primary: {
      radius: '12px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '1px solid rgba(255,255,255,0.2)',
      shadow: '0 4px 16px rgba(0,0,0,0.1)',
      hover: { backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' },
      active: { backgroundColor: 'rgba(255,255,255,0.15)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '12px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: '1px solid rgba(255,255,255,0.1)',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(255,255,255,0.05)' },
      active: { backgroundColor: 'rgba(255,255,255,0.1)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '12px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: '1px solid rgba(255,255,255,0.1)',
      shadow: 'none',
      hover: { backgroundColor: 'rgba(255,255,255,0.05)' },
      active: { backgroundColor: 'rgba(255,255,255,0.1)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '12px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: '1px solid rgba(255,255,255,0.2)',
      shadow: '0 8px 32px rgba(0,0,0,0.15)',
      hover: { backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' },
      active: { backgroundColor: 'rgba(255,255,255,0.2)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '12px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['technology','creative','modern'],
    goodUseCases: ['glassmorphism UIs','modern designs','dark themes'],
    badUseCases: ['accessibility','readability'],
    antiPatterns: ['poor readability','accessibility issues'],
  },
  ['glass','modern','glassmorphism']
);

// ============================================================
// GRADIENT BUTTONS
// ============================================================

export const gradientButtons: ButtonStyle = createButtonStyle(
  'buttons-gradient',
  'Gradient',
  'Gradient',
  {
    primary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: 'none',
      shadow: '0 4px 12px rgba(0,0,0,0.15)',
      hover: { background: 'linear-gradient(135deg, #0066CC, #0099FF)', transform: 'translateY(-1px)' },
      active: { background: 'linear-gradient(135deg, #0055AA, #0088EE)', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 600, border: 'none',
      shadow: 'none',
      hover: { background: 'linear-gradient(135deg, #667eea, #764ba2)' },
      active: { background: 'linear-gradient(135deg, #5568d3, #663f9c)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { background: 'linear-gradient(135deg, #f093fb, #f5576c)' },
      active: { background: 'linear-gradient(135deg, #e083eb, #e5475c)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '8px', height: '56px', padding: '20px 40px',
      font: 'Inter', weight: 700, border: 'none',
      shadow: '0 4px 16px rgba(0,0,0,0.2)',
      hover: { background: 'linear-gradient(135deg, #0066CC, #0099FF)', transform: 'translateY(-2px)' },
      active: { background: 'linear-gradient(135deg, #0055AA, #0088EE)', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Inter', weight: 500, border: 'none',
      shadow: 'none',
      hover: { background: 'linear-gradient(135deg, transparent, transparent)', textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['creative','marketing','technology'],
    goodUseCases: ['modern UIs','creative sites','marketing'],
    badUseCases: ['luxury','editorial','accessibility'],
    antiPatterns: ['poor contrast','accessibility issues','overuse'],
  },
  ['gradient','modern','creative']
);

// ============================================================
// NEON BUTTONS
// ============================================================

export const neonButtons: ButtonStyle = createButtonStyle(
  'buttons-neon',
  'Neon',
  'Neon',
  {
    primary: {
      radius: '4px', height: '48px', padding: '16px 32px',
      font: 'Sora', weight: 600, border: '2px solid #00FF41',
      shadow: '0 0 10px rgba(0,255,65,0.5)',
      hover: { backgroundColor: 'rgba(0,255,65,0.1)', boxShadow: '0 0 20px rgba(0,255,65,0.7)' },
      active: { backgroundColor: 'rgba(0,255,65,0.2)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '4px', height: '48px', padding: '16px 32px',
      font: 'Sora', weight: 600, border: '2px solid #FF00FF',
      shadow: '0 0 10px rgba(255,0,255,0.5)',
      hover: { backgroundColor: 'rgba(255,0,255,0.1)', boxShadow: '0 0 20px rgba(255,0,255,0.7)' },
      active: { backgroundColor: 'rgba(255,0,255,0.2)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '4px', height: '48px', padding: '16px 32px',
      font: 'Sora', weight: 500, border: '2px solid #00FFFF',
      shadow: '0 0 10px rgba(0,255,255,0.5)',
      hover: { backgroundColor: 'rgba(0,255,255,0.1)', boxShadow: '0 0 20px rgba(0,255,255,0.7)' },
      active: { backgroundColor: 'rgba(0,255,255,0.2)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '4px', height: '56px', padding: '20px 40px',
      font: 'Sora', weight: 700, border: '2px solid #00FF41',
      shadow: '0 0 16px rgba(0,255,65,0.6)',
      hover: { backgroundColor: 'rgba(0,255,65,0.15)', boxShadow: '0 0 30px rgba(0,255,65,0.8)' },
      active: { backgroundColor: 'rgba(0,255,65,0.25)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '8px 16px',
      font: 'Sora', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline', color: '#00FF41' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['gaming','tech','innovation'],
    goodUseCases: ['gaming sites','tech innovation','cyber'],
    badUseCases: ['luxury','editorial','accessibility'],
    antiPatterns: ['poor readability','accessibility issues','eye strain'],
  },
  ['neon','cyber','gaming']
);

// ============================================================
// EDITORIAL BUTTONS
// ============================================================

export const editorialButtons: ButtonStyle = createButtonStyle(
  'buttons-editorial',
  'Editorial',
  'Editorial',
  {
    primary: {
      radius: '0px', height: '56px', padding: '20px 48px',
      font: 'Playfair Display', weight: 600, border: '2px solid #1A1A1A',
      shadow: 'none',
      hover: { backgroundColor: '#1A1A1A', color: '#FFFFFF', transform: 'translateY(-1px)' },
      active: { backgroundColor: '#333333', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    secondary: {
      radius: '0px', height: '56px', padding: '20px 48px',
      font: 'Playfair Display', weight: 600, border: '2px solid #1A1A1A',
      shadow: 'none',
      hover: { borderColor: '#333333' },
      active: { backgroundColor: '#F5F5F5' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    tertiary: {
      radius: '0px', height: '48px', padding: '16px 32px',
      font: 'Crimson Pro', weight: 500, border: '1px solid #CCCCCC',
      shadow: 'none',
      hover: { backgroundColor: '#F5F5F5' },
      active: { backgroundColor: '#E8E8E8' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cta: {
      radius: '0px', height: '64px', padding: '24px 56px',
      font: 'Playfair Display', weight: 700, border: '2px solid #1A1A1A',
      shadow: 'none',
      hover: { backgroundColor: '#1A1A1A', color: '#FFFFFF', transform: 'translateY(-2px)' },
      active: { backgroundColor: '#333333', transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    link: {
      radius: '0px', height: 'auto', padding: '12px 24px',
      font: 'Crimson Pro', weight: 500, border: 'none',
      shadow: 'none',
      hover: { textDecoration: 'underline' },
      active: { textDecoration: 'none' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
  },
  {
    bestIndustries: ['editorial','publishing','media'],
    goodUseCases: ['editorial sites','publishing','magazines'],
    badUseCases: ['tech','gaming','modern'],
    antiPatterns: ['too formal for tech','inconsistent with modern UIs'],
  },
  ['editorial','classic','timeless']
);

// ============================================================
// COMBINED CATALOG
// ============================================================

export const buttonSystems: ButtonStyle[] = [
  solidButtons,
  outlineButtons,
  ghostButtons,
  textButtons,
  pillButtons,
  squareButtons,
  roundedButtons,
  minimalButtons,
  luxuryButtons,
  glassButtons,
  gradientButtons,
  neonButtons,
  editorialButtons,
];
