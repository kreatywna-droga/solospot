/**
 * Typography Systems — 30+ Complete Typography Systems
 *
 * Each system defines H1-H4, Subtitle, Body, Small, Caption, Button, Label
 * with font family, weight, size, line height, letter spacing, max width, color role.
 */

import type { FontItemExtended } from '../fonts/fontLibrary';

export type TypographyStyle =
  | 'Modern Minimal' | 'Luxury Editorial' | 'Premium Corporate' | 'Medical Clean'
  | 'Tech Modern' | 'Creative Studio' | 'Fashion Editorial' | 'Architectural'
  | 'Wellness' | 'Bold Marketing' | 'Dark Premium' | 'Soft Organic'
  | 'Neo-Futuristic' | 'Editorial Classic' | 'Brutalist' | 'Elegant Serif'
  | 'Friendly Rounded' | 'Technical Monospace' | 'Minimalist' | 'High Contrast'
  | 'Pastel Dream' | 'Ocean Clean' | 'Forest Natural' | 'Sunset Warm'
  | 'Midnight Dark' | 'Rose Gold' | 'Arctic Cool' | 'Desert Earth'
  | 'Urban Street' | 'Vintage Retro';

export interface TypographyScale {
  h1: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  h2: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  h3: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  h4: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  subtitle: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  body: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  small: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  caption: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  button: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
  label: {
    fontFamily: string;
    fontWeight: number;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    maxWidth: string;
    colorRole: string;
  };
}

export interface TypographySystem {
  id: string;
  name: string;
  style: TypographyStyle;
  description: string;
  fontFamily: string;
  fontPairing: string;
  scale: TypographyScale;
  mood: string[];
  bestIndustries: string[];
  goodUseCases: string[];
  badUseCases: string[];
  preview: {
    h1: string;
    h2: string;
    body: string;
    button: string;
    label: string;
  };
  version: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

function createTypographySystem(
  id: string,
  name: string,
  style: TypographyStyle,
  description: string,
  fontFamily: string,
  fontPairing: string,
  scale: TypographyScale,
  mood: string[],
  bestIndustries: string[],
  goodUseCases: string[],
  badUseCases: string[],
  tags: string[] = []
): TypographySystem {
  const now = Date.now();
  return {
    id,
    name,
    style,
    description,
    fontFamily,
    fontPairing,
    scale,
    mood,
    bestIndustries,
    goodUseCases,
    badUseCases,
    preview: {
      h1: 'The Quick Brown Fox',
      h2: 'Subheading Text',
      body: 'This is sample body text demonstrating the typography system.',
      button: 'Click Here',
      label: 'Label Text',
    },
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags,
    metadata: {},
  };
}

// Helper to create a scale entry
function makeScale(
  fontFamily: string,
  fontWeight: number,
  fontSize: string,
  lineHeight: string,
  letterSpacing: string,
  colorRole: string
): TypographyScale {
  return {
    h1: { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, maxWidth: '100%', colorRole },
    h2: { fontFamily, fontWeight: fontWeight - 100, fontSize: '2rem', lineHeight: '1.2', letterSpacing, maxWidth: '100%', colorRole },
    h3: { fontFamily, fontWeight: fontWeight - 100, fontSize: '1.5rem', lineHeight: '1.3', letterSpacing, maxWidth: '100%', colorRole },
    h4: { fontFamily, fontWeight: fontWeight - 100, fontSize: '1.25rem', lineHeight: '1.4', letterSpacing, maxWidth: '100%', colorRole },
    subtitle: { fontFamily, fontWeight: fontWeight - 200, fontSize: '1.125rem', lineHeight: '1.5', letterSpacing, maxWidth: '100%', colorRole },
    body: { fontFamily, fontWeight, fontSize: '1rem', lineHeight: '1.6', letterSpacing: '0em', maxWidth: '65ch', colorRole },
    small: { fontFamily, fontWeight: fontWeight - 100, fontSize: '0.875rem', lineHeight: '1.5', letterSpacing, maxWidth: '100%', colorRole },
    caption: { fontFamily, fontWeight: fontWeight - 200, fontSize: '0.75rem', lineHeight: '1.4', letterSpacing, maxWidth: '100%', colorRole },
    button: { fontFamily, fontWeight: 600, fontSize: '0.875rem', lineHeight: '1.5', letterSpacing: '0.025em', maxWidth: '100%', colorRole },
    label: { fontFamily, fontWeight: 500, fontSize: '0.75rem', lineHeight: '1.4', letterSpacing: '0.05em', maxWidth: '100%', colorRole },
  };
}

// ============================================================
// MODERN MINIMAL
// ============================================================

export const modernMinimal: TypographySystem = createTypographySystem(
  'typography-modern-minimal',
  'Modern Minimal',
  'Modern Minimal',
  'Clean, minimal typography system for modern web design',
  'Inter', 'Inter + Outfit',
  makeScale('Inter', 700, '3.5rem', '1.1', '-0.025em', 'primary'),
  ['modern','minimal','clean'],
  ['technology','SaaS','general'],
  ['web apps','dashboards','landing pages'],
  ['luxury','editorial','fashion'],
  ['modern','minimal','clean']
);

// ============================================================
// LUXURY EDITORIAL
// ============================================================

export const luxuryEditorial: TypographySystem = createTypographySystem(
  'typography-luxury-editorial',
  'Luxury Editorial',
  'Luxury Editorial',
  'Elegant, high-contrast typography for luxury and editorial brands',
  'Playfair Display', 'Playfair Display + Cormorant Garamond',
  makeScale('Playfair Display', 700, '4rem', '1.15', '-0.01em', 'primary'),
  ['luxury','editorial','elegant'],
  ['fashion','luxury','beauty','media'],
  ['magazines','editorial','luxury branding'],
  ['tech','casual','modern'],
  ['luxury','elegant','editorial']
);

// ============================================================
// PREMIUM CORPORATE
// ============================================================

export const premiumCorporate: TypographySystem = createTypographySystem(
  'typography-premium-corporate',
  'Premium Corporate',
  'Premium Corporate',
  'Professional, trustworthy typography for corporate brands',
  'Inter', 'Inter + Roboto',
  makeScale('Inter', 700, '3rem', '1.15', '-0.02em', 'primary'),
  ['corporate','professional','modern'],
  ['technology','finance','enterprise'],
  ['corporate websites','dashboards','reports'],
  ['luxury','creative','fashion'],
  ['corporate','professional','trustworthy']
);

// ============================================================
// MEDICAL CLEAN
// ============================================================

export const medicalClean: TypographySystem = createTypographySystem(
  'typography-medical-clean',
  'Medical Clean',
  'Medical Clean',
  'Clean, readable typography for medical and healthcare brands',
  'Inter', 'Inter + Open Sans',
  makeScale('Inter', 600, '2.5rem', '1.2', '-0.01em', 'primary'),
  ['medical','clean','readable'],
  ['healthcare','medical','pharmaceutical'],
  ['medical websites','health apps','clinical'],
  ['luxury','creative','fashion'],
  ['medical','clean','readable']
);

// ============================================================
// TECH MODERN
// ============================================================

export const techModern: TypographySystem = createTypographySystem(
  'typography-tech-modern',
  'Tech Modern',
  'Tech Modern',
  'Futuristic, precise typography for technology brands',
  'Space Grotesk', 'Space Grotesk + Inter',
  makeScale('Space Grotesk', 700, '3.5rem', '1.1', '-0.03em', 'primary'),
  ['tech','futuristic','modern'],
  ['technology','SaaS','fintech'],
  ['tech products','SaaS','data dashboards'],
  ['luxury','editorial','fashion'],
  ['tech','futuristic','precise']
);

// ============================================================
// CREATIVE STUDIO
// ============================================================

export const creativeStudio: TypographySystem = createTypographySystem(
  'typography-creative-studio',
  'Creative Studio',
  'Creative Studio',
  'Bold, expressive typography for creative agencies',
  'Oswald', 'Oswald + Poppins',
  makeScale('Oswald', 700, '4rem', '1.05', '-0.04em', 'primary'),
  ['creative','bold','expressive'],
  ['creative agency','marketing','design'],
  ['creative portfolios','agency sites','branding'],
  ['luxury','medical','corporate'],
  ['creative','bold','expressive']
);

// ============================================================
// FASHION EDITORIAL
// ============================================================

export const fashionEditorial: TypographySystem = createTypographySystem(
  'typography-fashion-editorial',
  'Fashion Editorial',
  'Fashion Editorial',
  'High-fashion, editorial typography for fashion brands',
  'Bodoni Moda', 'Bodoni Moda + Lora',
  makeScale('Bodoni Moda', 700, '4rem', '1.1', '-0.02em', 'primary'),
  ['fashion','luxury','editorial'],
  ['fashion','beauty','luxury'],
  ['fashion websites','magazines','branding'],
  ['tech','medical','corporate'],
  ['fashion','luxury','editorial']
);

// ============================================================
// ARCHITECTURAL
// ============================================================

export const architectural: TypographySystem = createTypographySystem(
  'typography-architectural',
  'Architectural',
  'Architectural',
  'Strong, geometric typography for architecture and design',
  'Montserrat', 'Montserrat + Lora',
  makeScale('Montserrat', 700, '3.5rem', '1.1', '-0.02em', 'primary'),
  ['architecture','modern','geometric'],
  ['architecture','real estate','design'],
  ['architecture sites','real estate','design studios'],
  ['luxury','fashion','editorial'],
  ['architecture','modern','geometric']
);

// ============================================================
// WELLNESS
// ============================================================

export const wellness: TypographySystem = createTypographySystem(
  'typography-wellness',
  'Wellness',
  'Wellness',
  'Soft, organic typography for wellness and lifestyle brands',
  'Nunito', 'Nunito + Quicksand',
  makeScale('Nunito', 400, '2.5rem', '1.3', '0em', 'primary'),
  ['wellness','soft','organic'],
  ['wellness','fitness','lifestyle'],
  ['wellness sites','fitness apps','lifestyle'],
  ['luxury','tech','corporate'],
  ['wellness','soft','organic']
);

// ============================================================
// BOLD MARKETING
// ============================================================

export const boldMarketing: TypographySystem = createTypographySystem(
  'typography-bold-marketing',
  'Bold Marketing',
  'Bold Marketing',
  'Bold, impactful typography for marketing and advertising',
  'Bebas Neue', 'Bebas Neue + Montserrat',
  makeScale('Bebas Neue', 400, '5rem', '1.0', '-0.03em', 'primary'),
  ['bold','impactful','marketing'],
  ['marketing','advertising','sports'],
  ['marketing campaigns','sports','advertising'],
  ['luxury','editorial','medical'],
  ['bold','impactful','marketing']
);

// ============================================================
// DARK PREMIUM
// ============================================================

export const darkPremium: TypographySystem = createTypographySystem(
  'typography-dark-premium',
  'Dark Premium',
  'Dark Premium',
  'Elegant typography for dark premium themes',
  'Inter', 'Inter + Playfair Display',
  makeScale('Inter', 600, '3rem', '1.2', '-0.02em', 'primary'),
  ['dark','premium','elegant'],
  ['luxury','technology','fintech'],
  ['dark themes','premium products','luxury'],
  ['bright','casual','playful'],
  ['dark','premium','elegant']
);

// ============================================================
// SOFT ORGANIC
// ============================================================

export const softOrganic: TypographySystem = createTypographySystem(
  'typography-soft-organic',
  'Soft Organic',
  'Soft Organic',
  'Gentle, organic typography for natural and eco brands',
  'Quicksand', 'Quicksand + Nunito',
  makeScale('Quicksand', 500, '2.5rem', '1.3', '0.01em', 'primary'),
  ['soft','organic','natural'],
  ['eco','natural','organic'],
  ['eco brands','natural products','organic'],
  ['tech','luxury','corporate'],
  ['soft','organic','natural']
);

// ============================================================
// NEO-FUTURISTIC
// ============================================================

export const neoFuturistic: TypographySystem = createTypographySystem(
  'typography-neo-futuristic',
  'Neo-Futuristic',
  'Neo-Futuristic',
  'Cutting-edge, futuristic typography for innovation brands',
  'Sora', 'Sora + Geist',
  makeScale('Sora', 600, '3.5rem', '1.1', '-0.03em', 'primary'),
  ['futuristic','neo','innovation'],
  ['technology','innovation','sci-fi'],
  ['tech startups','innovation','sci-fi'],
  ['luxury','editorial','fashion'],
  ['futuristic','neo','innovation']
);

// ============================================================
// EDITORIAL CLASSIC
// ============================================================

export const editorialClassic: TypographySystem = createTypographySystem(
  'typography-editorial-classic',
  'Editorial Classic',
  'Editorial Classic',
  'Classic, timeless typography for editorial and publishing',
  'Crimson Pro', 'Crimson Pro + Lora',
  makeScale('Crimson Pro', 400, '2.5rem', '1.4', '0em', 'primary'),
  ['classic','timeless','editorial'],
  ['publishing','media','literary'],
  ['publishing','books','long-form'],
  ['tech','luxury','fashion'],
  ['classic','timeless','editorial']
);

// ============================================================
// BRUTALIST
// ============================================================

export const brutalist: TypographySystem = createTypographySystem(
  'typography-brutalist',
  'Brutalist',
  'Brutalist',
  'Raw, bold typography for brutalist design',
  'Bebas Neue', 'Bebas Neue + Roboto',
  makeScale('Bebas Neue', 400, '5rem', '1.0', '-0.03em', 'primary'),
  ['brutalist','raw','bold'],
  ['creative','tech','gaming'],
  ['creative sites','gaming','tech'],
  ['luxury','editorial','medical'],
  ['brutalist','raw','bold']
);

// ============================================================
// ELEGANT SERIF
// ============================================================

export const elegantSerif: TypographySystem = createTypographySystem(
  'typography-elegant-serif',
  'Elegant Serif',
  'Elegant Serif',
  'Refined, elegant serif typography for premium brands',
  'Cormorant Garamond', 'Cormorant Garamond + Playfair Display',
  makeScale('Cormorant Garamond', 500, '3rem', '1.3', '-0.01em', 'primary'),
  ['elegant','refined','serif'],
  ['luxury','fashion','beauty'],
  ['luxury branding','fashion','beauty'],
  ['tech','casual','modern'],
  ['elegant','refined','serif']
);

// ============================================================
// FRIENDLY ROUNDED
// ============================================================

export const friendlyRounded: TypographySystem = createTypographySystem(
  'typography-friendly-rounded',
  'Friendly Rounded',
  'Friendly Rounded',
  'Approachable, rounded typography for friendly brands',
  'Poppins', 'Poppins + Nunito',
  makeScale('Poppins', 600, '3rem', '1.2', '-0.01em', 'primary'),
  ['friendly','rounded','approachable'],
  ['education','healthcare','lifestyle'],
  ['education sites','healthcare','lifestyle'],
  ['luxury','tech','corporate'],
  ['friendly','rounded','approachable']
);

// ============================================================
// TECHNICAL MONOSPACE
// ============================================================

export const technicalMonospace: TypographySystem = createTypographySystem(
  'typography-technical-monospace',
  'Technical Monospace',
  'Technical Monospace',
  'Precise, technical typography for code and data',
  'JetBrains Mono', 'JetBrains Mono + Space Mono',
  makeScale('JetBrains Mono', 400, '1.5rem', '1.5', '0em', 'primary'),
  ['technical','precise','monospace'],
  ['technology','fintech','data'],
  ['code platforms','data dashboards','technical docs'],
  ['luxury','editorial','fashion'],
  ['technical','precise','monospace']
);

// ============================================================
// MINIMALIST
// ============================================================

export const minimalist: TypographySystem = createTypographySystem(
  'typography-minimalist',
  'Minimalist',
  'Minimalist',
  'Ultra-clean, minimalist typography for simple designs',
  'Inter', 'Inter + Open Sans',
  makeScale('Inter', 400, '2rem', '1.4', '0em', 'primary'),
  ['minimal','clean','simple'],
  ['technology','general'],
  ['minimal websites','simple apps'],
  ['luxury','editorial','fashion'],
  ['minimal','clean','simple']
);

// ============================================================
// HIGH CONTRAST
// ============================================================

export const highContrast: TypographySystem = createTypographySystem(
  'typography-high-contrast',
  'High Contrast',
  'High Contrast',
  'Maximum contrast typography for accessibility and impact',
  'Bebas Neue', 'Bebas Neue + Inter',
  makeScale('Bebas Neue', 700, '5rem', '1.0', '-0.04em', 'primary'),
  ['high-contrast','bold','accessible'],
  ['accessibility','sports','advertising'],
  ['accessibility-focused','sports','advertising'],
  ['luxury','editorial','medical'],
  ['high-contrast','bold','accessible']
);

// ============================================================
// PASTEL DREAM
// ============================================================

export const pastelDream: TypographySystem = createTypographySystem(
  'typography-pastel-dream',
  'Pastel Dream',
  'Pastel Dream',
  'Soft, pastel typography for gentle, dreamy brands',
  'Quicksand', 'Quicksand + Nunito',
  makeScale('Quicksand', 500, '2.5rem', '1.3', '0.02em', 'primary'),
  ['soft','pastel','dreamy'],
  ['beauty','lifestyle','kids'],
  ['beauty brands','lifestyle','kids'],
  ['tech','luxury','corporate'],
  ['soft','pastel','dreamy']
);

// ============================================================
// OCEAN CLEAN
// ============================================================

export const oceanClean: TypographySystem = createTypographySystem(
  'typography-ocean-clean',
  'Ocean Clean',
  'Ocean Clean',
  'Clean, ocean-inspired typography for marine and travel brands',
  'Outfit', 'Outfit + Lora',
  makeScale('Outfit', 600, '3rem', '1.2', '-0.02em', 'primary'),
  ['ocean','clean','travel'],
  ['travel','marine','ocean'],
  ['travel sites','marine brands'],
  ['luxury','tech','corporate'],
  ['ocean','clean','travel']
);

// ============================================================
// FOREST NATURAL
// ============================================================

export const forestNatural: TypographySystem = createTypographySystem(
  'typography-forest-natural',
  'Forest Natural',
  'Forest Natural',
  'Natural, earthy typography for eco and outdoor brands',
  'Outfit', 'Outfit + DM Serif Display',
  makeScale('Outfit', 600, '3rem', '1.2', '-0.02em', 'primary'),
  ['natural','forest','earthy'],
  ['eco','outdoor','nature'],
  ['eco brands','outdoor','nature'],
  ['tech','luxury','corporate'],
  ['natural','forest','earthy']
);

// ============================================================
// SUNSET WARM
// ============================================================

export const sunsetWarm: TypographySystem = createTypographySystem(
  'typography-sunset-warm',
  'Sunset Warm',
  'Sunset Warm',
  'Warm, inviting typography for food and hospitality brands',
  'DM Serif Display', 'DM Serif Display + Nunito',
  makeScale('DM Serif Display', 400, '3rem', '1.3', '-0.01em', 'primary'),
  ['warm','sunset','inviting'],
  ['food','hospitality','restaurant'],
  ['restaurant sites','food brands','hospitality'],
  ['tech','luxury','corporate'],
  ['warm','sunset','inviting']
);

// ============================================================
// MIDNIGHT DARK
// ============================================================

export const midnightDark: TypographySystem = createTypographySystem(
  'typography-midnight-dark',
  'Midnight Dark',
  'Midnight Dark',
  'Dark, mysterious typography for premium dark themes',
  'Space Grotesk', 'Space Grotesk + Inter',
  makeScale('Space Grotesk', 600, '3.5rem', '1.1', '-0.03em', 'primary'),
  ['dark','mysterious','premium'],
  ['technology','fintech','luxury'],
  ['dark themes','premium products'],
  ['bright','casual','playful'],
  ['dark','mysterious','premium']
);

// ============================================================
// ROSE GOLD
// ============================================================

export const roseGold: TypographySystem = createTypographySystem(
  'typography-rose-gold',
  'Rose Gold',
  'Rose Gold',
  'Elegant, rose-gold typography for luxury beauty brands',
  'Playfair Display', 'Playfair Display + Lora',
  makeScale('Playfair Display', 600, '3.5rem', '1.15', '-0.02em', 'primary'),
  ['luxury','rose','gold','beauty'],
  ['beauty','luxury','fashion'],
  ['beauty brands','luxury','fashion'],
  ['tech','medical','corporate'],
  ['luxury','rose','gold','beauty']
);

// ============================================================
// ARCTIC COOL
// ============================================================

export const arcticCool: TypographySystem = createTypographySystem(
  'typography-arctic-cool',
  'Arctic Cool',
  'Arctic Cool',
  'Cool, crisp typography for technology and winter brands',
  'Inter', 'Inter + Space Grotesk',
  makeScale('Inter', 600, '3rem', '1.2', '-0.02em', 'primary'),
  ['cool','crisp','arctic'],
  ['technology','winter','sports'],
  ['tech sites','winter sports','cold brands'],
  ['luxury','editorial','fashion'],
  ['cool','crisp','arctic']
);

// ============================================================
// DESERT EARTH
// ============================================================

export const desertEarth: TypographySystem = createTypographySystem(
  'typography-desert-earth',
  'Desert Earth',
  'Desert Earth',
  'Warm, earthy typography for desert and western brands',
  'DM Serif Display', 'DM Serif Display + Nunito',
  makeScale('DM Serif Display', 400, '3rem', '1.3', '-0.01em', 'primary'),
  ['warm','earthy','desert'],
  ['travel','desert','western'],
  ['desert travel','western brands'],
  ['tech','luxury','corporate'],
  ['warm','earthy','desert']
);

// ============================================================
// URBAN STREET
// ============================================================

export const urbanStreet: TypographySystem = createTypographySystem(
  'typography-urban-street',
  'Urban Street',
  'Urban Street',
  'Bold, urban typography for street and urban brands',
  'Montserrat', 'Montserrat + Oswald',
  makeScale('Montserrat', 700, '4rem', '1.1', '-0.03em', 'primary'),
  ['urban','street','bold'],
  ['streetwear','urban','sports'],
  ['streetwear brands','urban sites'],
  ['luxury','editorial','medical'],
  ['urban','street','bold']
);

// ============================================================
// VINTAGE RETRO
// ============================================================

export const vintageRetro: TypographySystem = createTypographySystem(
  'typography-vintage-retro',
  'Vintage Retro',
  'Vintage Retro',
  'Retro, nostalgic typography for vintage and retro brands',
  'Righteous', 'Righteous + Montserrat',
  makeScale('Righteous', 400, '3.5rem', '1.1', '-0.02em', 'primary'),
  ['retro','vintage','nostalgic'],
  ['retro','vintage','entertainment'],
  ['retro brands','vintage sites'],
  ['luxury','tech','corporate'],
  ['retro','vintage','nostalgic']
);

// ============================================================
// COMBINED CATALOG
// ============================================================

export const typographySystems: TypographySystem[] = [
  modernMinimal,
  luxuryEditorial,
  premiumCorporate,
  medicalClean,
  techModern,
  creativeStudio,
  fashionEditorial,
  architectural,
  wellness,
  boldMarketing,
  darkPremium,
  softOrganic,
  neoFuturistic,
  editorialClassic,
  brutalist,
  elegantSerif,
  friendlyRounded,
  technicalMonospace,
  minimalist,
  highContrast,
  pastelDream,
  oceanClean,
  forestNatural,
  sunsetWarm,
  midnightDark,
  roseGold,
  arcticCool,
  desertEarth,
  urbanStreet,
  vintageRetro,
];
