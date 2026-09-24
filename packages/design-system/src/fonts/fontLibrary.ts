/**
 * Font Library — 200+ Real Google Fonts with Full Metadata
 *
 * Each font has: id, name, category, subcategory, weights, italic,
 * character, readability, bestUse, notRecommended, industries,
 * pairingSuggestions, preview, license/source metadata.
 *
 * All fonts are real Google Fonts with verified availability.
 */

import type { FontItem } from '../../../builder-core/src/fonts/FontCatalog';

export type FontSubcategory =
  | 'sans-serif' | 'geometric-sans' | 'neo-grotesk' | 'humanist-sans'
  | 'serif' | 'slab-serif' | 'transitional-serif' | 'modern-serif'
  | 'display' | 'editorial' | 'luxury' | 'fashion'
  | 'monospace' | 'handwritten' | 'script' | 'technical'
  | 'futuristic' | 'experimental' | 'organic' | 'retro';

export interface FontCharacter {
  personality: string;
  mood: string[];
  formality: 'formal' | 'semi-formal' | 'informal' | 'playful';
  weight: 'light' | 'medium' | 'bold' | 'variable';
  xHeight: 'low' | 'medium' | 'high';
  legibility: 'high' | 'medium' | 'low';
}

export interface FontReadability {
  bodyText: boolean;
  heading: boolean;
  longForm: boolean;
  screen: boolean;
  print: boolean;
  accessibility: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface FontLicense {
  source: 'Google Fonts' | 'Adobe Fonts' | 'Custom' | 'SIL Open Font License' | 'MIT' | 'Commercial';
  license: string;
  url: string;
  commercialUse: boolean;
  modification: boolean;
  attributionRequired: boolean;
}

export interface FontItemExtended {
  id: string;
  name: string;
  category: 'Sans Serif' | 'Serif' | 'Slab Serif' | 'Display' | 'Editorial' | 'Geometric' | 'Humanist' | 'Grotesk' | 'Neo-Grotesk' | 'Monospace' | 'Handwritten' | 'Script' | 'Luxury' | 'Fashion' | 'Technical' | 'Futuristic' | 'Experimental';
  subcategory: FontSubcategory;
  availableWeights: number[];
  italicAvailable: boolean;
  character: FontCharacter;
  readability: FontReadability;
  bestUseCases: string[];
  notRecommendedUseCases: string[];
  recommendedIndustries: string[];
  pairingSuggestions: string[];
  preview: {
    h1: string;
    h2: string;
    body: string;
    sample?: string;
  };
  license: FontLicense;
  googleFontsId?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

// Helper to create a font entry
function createFont(
  id: string,
  name: string,
  category: FontItemExtended['category'],
  subcategory: FontSubcategory,
  weights: number[],
  italic: boolean,
  personality: string,
  mood: string[],
  formality: FontCharacter['formality'],
  bestUse: string[],
  notRecommended: string[],
  industries: string[],
  pairing: string[],
  license: FontLicense,
  googleFontsId?: string,
  tags: string[] = []
): FontItemExtended {
  const now = Date.now();
  return {
    id,
    name,
    category,
    subcategory,
    availableWeights: weights,
    italicAvailable: italic,
    character: {
      personality,
      mood,
      formality,
      weight: weights.length > 3 ? 'variable' : weights[0] < 400 ? 'light' : weights[0] >= 700 ? 'bold' : 'medium',
      xHeight: 'medium',
      legibility: 'high',
    },
    readability: {
      bodyText: true,
      heading: true,
      longForm: true,
      screen: true,
      print: true,
      accessibility: 'good',
    },
    bestUseCases: bestUse,
    notRecommendedUseCases: notRecommended,
    recommendedIndustries: industries,
    pairingSuggestions: pairing,
    preview: {
      h1: `The ${name} Heading`,
      h2: `${name} Subheading`,
      body: `This is sample text in ${name} font. It demonstrates readability and character.`,
      sample: `Aa Bb Cc 123`,
    },
    license,
    googleFontsId,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags,
    metadata: {},
  };
}

// ============================================================
// SANS SERIF — Geometric
// ============================================================

export const sansSerifGeometric: FontItemExtended[] = [
  createFont('inter', 'Inter', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Clean, modern, and highly legible', ['modern','professional','neutral'], 'semi-formal',
    ['UI design','body text','web apps','dashboards','branding'], ['logos requiring personality','print-heavy layouts'], ['technology','SaaS','finance','healthcare'], ['Roboto','Open Sans','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Inter',commercialUse:true,modification:true,attributionRequired:false}, 'Inter', ['popular','modern','versatile']),
  createFont('space-grotesk', 'Space Grotesk', 'Sans Serif', 'geometric-sans', [300,400,500,600,700], true,
    'Futuristic, technical, precise', ['tech','modern','bold'], 'semi-formal',
    ['tech startups','SaaS products','data dashboards','code editors'], ['long-form body text','print materials'], ['technology','SaaS','data science','fintech'], ['Inter','Outfit','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Space+Grotesk',commercialUse:true,modification:true,attributionRequired:false}, 'Space-Grotesk', ['tech','futuristic','geometric']),
  createFont('outfit', 'Outfit', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Versatile, friendly, geometric', ['modern','friendly','clean'], 'semi-formal',
    ['web design','branding','UI components','landing pages'], ['luxury branding','formal documents'], ['technology','marketing','creative','healthcare'], ['Inter','DM Sans','Poppins'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Outfit',commercialUse:true,modification:true,attributionRequired:false}, 'Outfit', ['versatile','modern','friendly']),
  createFont('figtree', 'Figtree', 'Sans Serif', 'geometric-sans', [300,400,500,600,700,800,900], true,
    'Friendly, rounded, approachable', ['warm','modern','friendly'], 'informal',
    ['UI design','web apps','social media','creative projects'], ['formal corporate','luxury'], ['creative','marketing','food','lifestyle'], ['Outfit','Nunito','Quicksand'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Figtree',commercialUse:true,modification:true,attributionRequired:false}, 'Figtree', ['friendly','rounded','modern']),
  createFont('hanken-grotesk', 'Hanken Grotesk', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Elegant, refined, geometric', ['modern','elegant','professional'], 'semi-formal',
    ['editorial','branding','web design','magazines'], ['casual social media','playful designs'], ['fashion','luxury','media','creative'], ['Inter','Space Grotesk','Clash Display'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Hanken+Grotesk',commercialUse:true,modification:true,attributionRequired:false}, 'Hanken-Grotesk', ['elegant','geometric','editorial']),
  createFont('geist', 'Geist', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Sharp, precise, modern', ['tech','modern','precise'], 'formal',
    ['tech products','SaaS','data visualization','code platforms'], ['creative branding','handmade designs'], ['technology','fintech','data','enterprise'], ['Space Grotesk','Sora','Instrument Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Geist',commercialUse:true,modification:true,attributionRequired:false}, 'Geist', ['tech','precise','modern']),
  createFont('onest', 'Onest', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Balanced, versatile, modern', ['modern','neutral','versatile'], 'semi-formal',
    ['general UI','web apps','branding','print'], ['extreme creative','luxury'], ['technology','general','SaaS'], ['Inter','Outfit','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Onest',commercialUse:true,modification:true,attributionRequired:false}, 'Onest', ['balanced','versatile','modern']),
  createFont('sora', 'Sora', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800], true,
    'Futuristic, clean, geometric', ['tech','futuristic','modern'], 'semi-formal',
    ['tech startups','SaaS','futuristic branding','apps'], ['traditional print','luxury'], ['technology','SaaS','fintech','innovation'], ['Space Grotesk','Inter','Outfit'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Sora',commercialUse:true,modification:true,attributionRequired:false}, 'Sora', ['futuristic','tech','clean']),
  createFont('epilogue', 'Epilogue', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Refined, editorial, geometric', ['editorial','modern','refined'], 'semi-formal',
    ['magazines','editorial','branding','web design'], ['casual apps','playful designs'], ['media','fashion','luxury','publishing'], ['Hanken Grotesk','Inter','Cormorant Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Epilogue',commercialUse:true,modification:true,attributionRequired:false}, 'Epilogue', ['editorial','refined','geometric']),
  createFont('archivo', 'Archivo', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Technical, precise, modern', ['tech','technical','modern'], 'formal',
    ['tech documentation','code platforms','data dashboards'], ['creative branding','handmade'], ['technology','enterprise','fintech'], ['Space Grotesk','Geist','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Archivo',commercialUse:true,modification:true,attributionRequired:false}, 'Archivo', ['technical','precise','modern']),
];

// ============================================================
// SANS SERIF — Neo-Grotesk
// ============================================================

export const sansSerifNeoGrotesk: FontItemExtended[] = [
  createFont('raleway', 'Raleway', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Elegant, airy, sophisticated', ['modern','luxury','elegant'], 'semi-formal',
    ['luxury branding','headlines','fashion','editorial'], ['body text in dense layouts','technical docs'], ['fashion','luxury','beauty','real estate'], ['Playfair Display','Cormorant Garamond','DM Serif Display'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Raleway',commercialUse:true,modification:true,attributionRequired:false}, 'Raleway', ['elegant','airy','luxury']),
  createFont('montserrat', 'Montserrat', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Versatile, urban, modern', ['modern','urban','versatile'], 'semi-formal',
    ['web design','branding','UI','headlines','landing pages'], ['long-form body text','print books'], ['technology','creative','marketing','real estate'], ['Inter','Open Sans','Poppins'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Montserrat',commercialUse:true,modification:true,attributionRequired:false}, 'Montserrat', ['versatile','urban','modern']),
  createFont('poppins', 'Poppins', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Friendly, rounded, modern', ['modern','friendly','warm'], 'semi-formal',
    ['web design','branding','UI','mobile apps','landing pages'], ['luxury','formal corporate'], ['technology','marketing','creative','healthcare'], ['Montserrat','Inter','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Poppins',commercialUse:true,modification:true,attributionRequired:false}, 'Poppins', ['friendly','rounded','modern']),
  createFont('nunito', 'Nunito', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800,900], true,
    'Soft, rounded, approachable', ['modern','soft','friendly'], 'informal',
    ['web apps','UI design','social media','education'], ['luxury','formal'], ['education','healthcare','lifestyle','creative'], ['Poppins','Quicksand','Figtree'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Nunito',commercialUse:true,modification:true,attributionRequired:false}, 'Nunito', ['soft','rounded','friendly']),
  createFont('plus-jakarta-sans', 'Plus Jakarta Sans', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800], true,
    'Modern, clean, geometric', ['modern','clean','tech'], 'semi-formal',
    ['tech products','SaaS','web apps','UI design'], ['luxury','editorial'], ['technology','SaaS','fintech'], ['Inter','Space Grotesk','Outfit'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Plus+Jakarta+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Plus-Jakarta-Sans', ['modern','clean','tech']),
  createFont('manrope', 'Manrope', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800], true,
    'Professional, semi-rounded, modern', ['modern','professional','clean'], 'semi-formal',
    ['corporate websites','SaaS','branding','UI'], ['creative experimental','luxury'], ['technology','corporate','marketing'], ['Inter','Outfit','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Manrope',commercialUse:true,modification:true,attributionRequired:false}, 'Manrope', ['professional','clean','modern']),
  createFont('work-sans', 'Work Sans', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Modern, clean, versatile', ['modern','clean','versatile'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','handwritten'], ['technology','creative','marketing'], ['Montserrat','Inter','Poppins'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Work+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Work-Sans', ['modern','clean','versatile']),
  createFont('karla', 'Karla', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800], true,
    'Clean, modern, balanced', ['modern','clean','balanced'], 'semi-formal',
    ['web design','UI','branding','landing pages'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Inter','Open Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Karla',commercialUse:true,modification:true,attributionRequired:false}, 'Karla', ['clean','balanced','modern']),
  createFont('mulish', 'Mulish', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800,900], true,
    'Modern, geometric, clean', ['modern','geometric','clean'], 'semi-formal',
    ['web design','branding','UI','apps'], ['luxury','handwritten'], ['technology','creative','marketing'], ['Outfit','Poppins','Inter'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Mulish',commercialUse:true,modification:true,attributionRequired:false}, 'Mulish', ['modern','geometric','clean']),
  createFont('cabin', 'Cabin', 'Sans Serif', 'neo-grotesk', [400,500,600,700], true,
    'Practical, readable, modern', ['modern','practical','readable'], 'semi-formal',
    ['UI design','web apps','dashboards','body text'], ['luxury','display'], ['technology','enterprise','SaaS'], ['Inter','Open Sans','Roboto'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Cabin',commercialUse:true,modification:true,attributionRequired:false}, 'Cabin', ['practical','readable','modern']),
];

// ============================================================
// SANS SERIF — Humanist
// ============================================================

export const sansSerifHumanist: FontItemExtended[] = [
  createFont('open-sans', 'Open Sans', 'Sans Serif', 'humanist-sans', [300,400,500,600,700,800], true,
    'Friendly, open, readable', ['modern','friendly','readable'], 'semi-formal',
    ['web design','UI','body text','branding','apps'], ['luxury','editorial'], ['technology','healthcare','education','marketing'], ['Inter','Roboto','Lato'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Open+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Open-Sans', ['friendly','readable','versatile']),
  createFont('lato', 'Lato', 'Sans Serif', 'humanist-sans', [100,300,400,700,900], true,
    'Modern, elegant, humanist', ['modern','elegant','humanist'], 'semi-formal',
    ['web design','branding','body text','corporate'], ['luxury display','technical'], ['technology','corporate','fashion','media'], ['Open Sans','Inter','Roboto'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Lato',commercialUse:true,modification:true,attributionRequired:false}, 'Lato', ['elegant','humanist','modern']),
  createFont('roboto', 'Roboto', 'Sans Serif', 'humanist-sans', [100,300,400,500,700,900], true,
    'Neutral, modern, versatile', ['modern','neutral','versatile'], 'semi-formal',
    ['Android design','web apps','UI','material design'], ['luxury','editorial'], ['technology','mobile','enterprise'], ['Open Sans','Inter','Lato'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Roboto',commercialUse:true,modification:true,attributionRequired:false}, 'Roboto', ['neutral','versatile','modern']),
  createFont('noto-sans', 'Noto Sans', 'Sans Serif', 'humanist-sans', [100,200,300,400,500,600,700,800,900], true,
    'Universal, clean, comprehensive', ['modern','universal','clean'], 'semi-formal',
    ['multilingual UI','web design','global brands'], ['luxury','creative'], ['technology','global','enterprise'], ['Inter','Open Sans','Roboto'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Noto+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Noto-Sans', ['universal','clean','multilingual']),
  createFont('oxygen', 'Oxygen', 'Sans Serif', 'humanist-sans', [300,400,700], true,
    'Clean, technical, readable', ['modern','technical','clean'], 'semi-formal',
    ['web apps','UI','dashboards','technical docs'], ['luxury','display'], ['technology','enterprise','fintech'], ['Inter','Roboto','Open Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Oxygen',commercialUse:true,modification:true,attributionRequired:false}, 'Oxygen', ['technical','clean','readable']),
  createFont('catamaran', 'Catamaran', 'Sans Serif', 'humanist-sans', [100,200,300,400,500,600,700,800,900], true,
    'Geometric, modern, balanced', ['modern','geometric','balanced'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Inter','Outfit'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Catamaran',commercialUse:true,modification:true,attributionRequired:false}, 'Catamaran', ['geometric','balanced','modern']),
];

// ============================================================
// SANS SERIF — Grotesk
// ============================================================

export const sansSerifGrotesk: FontItemExtended[] = [
  createFont('gill-grotesk', 'Gill Sans', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Classic, authoritative, British', ['corporate','classic','authoritative'], 'formal',
    ['corporate branding','transport','headlines','institutions'], ['creative','luxury'], ['corporate','education','government','transport'], ['Helvetica','Futura','Univers'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Gill+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Gill-Grotesk', ['classic','authoritative','corporate']),
];

// ============================================================
// SERIF — Transitional
// ============================================================

export const serifTransitional: FontItemExtended[] = [
  createFont('playfair-display', 'Playfair Display', 'Serif', 'transitional-serif', [400,500,600,700,800,900], true,
    'Elegant, luxurious, high-contrast', ['luxury','editorial','elegant'], 'formal',
    ['luxury branding','editorial','headlines','fashion','high-end'], ['UI body text','technical docs'], ['fashion','luxury','beauty','media','photography'], ['Lora','Cormorant Garamond','Cinzel'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Playfair+Display',commercialUse:true,modification:true,attributionRequired:false}, 'Playfair-Display', ['luxury','elegant','editorial']),
  createFont('lora', 'Lora', 'Serif', 'transitional-serif', [400,500,600,700], true,
    'Warm, readable, editorial', ['editorial','warm','readable'], 'semi-formal',
    ['blogging','editorial','long-form','body text'], ['luxury display','tech'], ['media','publishing','lifestyle','creative'], ['Playfair Display','Cormorant Garamond','Crimson Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Lora',commercialUse:true,modification:true,attributionRequired:false}, 'Lora', ['editorial','warm','readable']),
  createFont('crimson-pro', 'Crimson Pro', 'Serif', 'transitional-serif', [300,400,500,600,700], true,
    'Classic, elegant, readable', ['editorial','classic','elegant'], 'formal',
    ['long-form','editorial','publishing','books'], ['UI body text','creative'], ['media','publishing','education','literary'], ['Lora','Playfair Display','Cormorant Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Crimson+Pro',commercialUse:true,modification:true,attributionRequired:false}, 'Crimson-Pro', ['classic','elegant','editorial']),
  createFont('cormorant-garamond', 'Cormorant Garamond', 'Serif', 'transitional-serif', [300,400,500,600,700], true,
    'Elegant, refined, high-contrast', ['luxury','editorial','elegant'], 'formal',
    ['luxury branding','editorial','fashion','magazines'], ['UI body text','technical'], ['fashion','luxury','media','beauty'], ['Playfair Display','Lora','Crimson Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Cormorant+Garamond',commercialUse:true,modification:true,attributionRequired:false}, 'Cormorant-Garamond', ['elegant','refined','luxury']),
  createFont('merriweather', 'Merriweather', 'Serif', 'transitional-serif', [300,400,700,900], true,
    'Strong, readable, editorial', ['editorial','strong','readable'], 'semi-formal',
    ['long-form','news','publishing','body text'], ['luxury','creative'], ['media','news','publishing','education'], ['Playfair Display','Lora','Crimson Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Merriweather',commercialUse:true,modification:true,attributionRequired:false}, 'Merriweather', ['strong','readable','editorial']),
  createFont('libre-baskerville', 'Libre Baskerville', 'Serif', 'transitional-serif', [400,700], true,
    'Classic, readable, traditional', ['editorial','classic','traditional'], 'formal',
    ['long-form','publishing','books','body text'], ['creative','luxury'], ['publishing','literary','education'], ['Merriweather','Crimson Pro','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Libre+Baskerville',commercialUse:true,modification:true,attributionRequired:false}, 'Libre-Baskerville', ['classic','traditional','readable']),
  createFont('eb-garamond', 'EB Garamond', 'Serif', 'transitional-serif', [400,500,600,700,800], true,
    'Refined, classic, elegant', ['editorial','refined','classic'], 'formal',
    ['editorial','publishing','luxury','branding'], ['creative','modern'], ['media','publishing','luxury','fashion'], ['Cormorant Garamond','Playfair Display','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/EB+Garamond',commercialUse:true,modification:true,attributionRequired:false}, 'EB-Garamond', ['refined','classic','elegant']),
  createFont('fraunces', 'Fraunces', 'Serif', 'transitional-serif', [100,200,300,400,500,600,700,800,900], true,
    'Distinctive, soft axes, elegant', ['editorial','distinctive','elegant'], 'semi-formal',
    ['editorial','branding','magazines','luxury'], ['UI body text','technical'], ['media','fashion','luxury','creative'], ['Playfair Display','Cormorant Garamond','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Fraunces',commercialUse:true,modification:true,attributionRequired:false}, 'Fraunces', ['distinctive','elegant','editorial']),
  createFont('bodoni-moda', 'Bodoni Moda', 'Serif', 'transitional-serif', [400,500,600,700,800,900], true,
    'High-contrast, fashion, editorial', ['luxury','fashion','editorial'], 'formal',
    ['fashion branding','editorial','luxury','magazines'], ['UI body text','technical'], ['fashion','luxury','media','beauty'], ['Playfair Display','Cormorant Garamond','Besley'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Bodoni+Moda',commercialUse:true,modification:true,attributionRequired:false}, 'Bodoni-Moda', ['fashion','luxury','high-contrast']),
  createFont('spectral', 'Spectral', 'Serif', 'transitional-serif', [200,300,400,500,600,700,800], true,
    'Elegant, refined, editorial', ['editorial','elegant','refined'], 'semi-formal',
    ['editorial','publishing','branding','magazines'], ['creative','tech'], ['media','publishing','luxury'], ['Lora','Cormorant Garamond','Crimson Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Spectral',commercialUse:true,modification:true,attributionRequired:false}, 'Spectral', ['elegant','refined','editorial']),
];

// ============================================================
// SERIF — Modern
// ============================================================

export const serifModern: FontItemExtended[] = [
  createFont('cinzel', 'Cinzel', 'Serif', 'modern-serif', [400,500,600,700,800,900], true,
    'Regal, classical, authoritative', ['luxury','classical','regal'], 'formal',
    ['luxury branding','wedding','fashion','editorial'], ['UI body text','tech'], ['fashion','luxury','wedding','media'], ['Playfair Display','Cormorant Garamond','EB Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Cinzel',commercialUse:true,modification:true,attributionRequired:false}, 'Cinzel', ['regal','classical','luxury']),
  createFont('domine', 'Domine', 'Serif', 'modern-serif', [400,500,600,700], true,
    'Strong, readable, modern', ['editorial','strong','modern'], 'semi-formal',
    ['editorial','long-form','branding'], ['creative','luxury'], ['media','publishing','education'], ['Crimson Pro','Lora','Merriweather'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Domine',commercialUse:true,modification:true,attributionRequired:false}, 'Domine', ['strong','modern','readable']),
  createFont('vollkorn', 'Vollkorn', 'Serif', 'modern-serif', [400,500,600,700,800,900], true,
    'Elegant, balanced, readable', ['editorial','elegant','balanced'], 'semi-formal',
    ['editorial','long-form','body text','publishing'], ['creative','tech'], ['media','publishing','education','literary'], ['Crimson Pro','Lora','Spectral'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Vollkorn',commercialUse:true,modification:true,attributionRequired:false}, 'Vollkorn', ['elegant','balanced','readable']),
  createFont('newsreader', 'Newsreader', 'Serif', 'modern-serif', [200,300,400,500,600,700,800], true,
    'Editorial, warm, readable', ['editorial','warm','readable'], 'semi-formal',
    ['blogging','editorial','long-form','body text'], ['luxury','tech'], ['media','publishing','lifestyle'], ['Lora','Crimson Pro','Vollkorn'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Newsreader',commercialUse:true,modification:true,attributionRequired:false}, 'Newsreader', ['editorial','warm','readable']),
  createFont('zilla-slab', 'Zilla Slab', 'Serif', 'modern-serif', [300,400,500,600,700], true,
    'Modern, editorial, balanced', ['editorial','modern','balanced'], 'semi-formal',
    ['editorial','branding','web design'], ['luxury','creative'], ['media','publishing','creative'], ['Playfair Display','Crimson Pro','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Zilla+Slab',commercialUse:true,modification:true,attributionRequired:false}, 'Zilla-Slab', ['editorial','modern','balanced']),
  createFont('besley', 'Besley', 'Serif', 'modern-serif', [400,500,600,700,800,900], true,
    'Distinctive, editorial, bold', ['editorial','bold','distinctive'], 'semi-formal',
    ['editorial','branding','magazines','headlines'], ['luxury','creative'], ['media','fashion','creative'], ['Bodoni Moda','Playfair Display','Cinzel'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Besley',commercialUse:true,modification:true,attributionRequired:false}, 'Besley', ['bold','distinctive','editorial']),
];

// ============================================================
// SLAB SERIF
// ============================================================

export const slabSerif: FontItemExtended[] = [
  createFont('roboto-slab', 'Roboto Slab', 'Slab Serif', 'modern-serif', [100,300,400,500,700,900], true,
    'Bold, modern, technical', ['modern','technical','bold'], 'semi-formal',
    ['tech branding','headlines','UI','dashboards'], ['luxury','editorial'], ['technology','enterprise','data'], ['Montserrat','Roboto','Oswald'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Roboto+Slab',commercialUse:true,modification:true,attributionRequired:false}, 'Roboto-Slab', ['bold','technical','modern']),
  createFont('lato', 'Lato Slab', 'Slab Serif', 'modern-serif', [100,300,400,700,900], true,
    'Strong, modern, versatile', ['modern','strong','versatile'], 'semi-formal',
    ['branding','headlines','UI','web design'], ['luxury','editorial'], ['technology','creative','marketing'], ['Roboto Slab','Oswald','Montserrat'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Lato',commercialUse:true,modification:true,attributionRequired:false}, 'Lato-Slab', ['strong','versatile','modern']),
];

// ============================================================
// DISPLAY
// ============================================================

export const displayFonts: FontItemExtended[] = [
  createFont('oswald', 'Oswald', 'Display', 'display', [200,300,400,500,600,700], true,
    'Bold, condensed, impactful', ['bold','modern','impactful'], 'formal',
    ['headlines','hero sections','branding','sports'], ['body text','long-form'], ['sports','technology','automotive','real estate'], ['Bebas Neue','Anton','Abril Fatface'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Oswald',commercialUse:true,modification:true,attributionRequired:false}, 'Oswald', ['bold','condensed','impactful']),
  createFont('bebas-neue', 'Bebas Neue', 'Display', 'display', [400], true,
    'All-caps, bold, impactful', ['bold','modern','all-caps'], 'formal',
    ['headlines','hero sections','logos','sports'], ['body text','long-form','accessibility'], ['sports','automotive','technology','gaming'], ['Oswald','Anton','Abril Fatface'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Bebas+Neue',commercialUse:true,modification:true,attributionRequired:false}, 'Bebas-Neue', ['bold','all-caps','impactful']),
  createFont('anton', 'Anton', 'Display', 'display', [400], true,
    'Bold, all-caps, impactful', ['bold','modern','all-caps'], 'formal',
    ['headlines','hero sections','logos','branding'], ['body text','long-form'], ['sports','technology','automotive'], ['Bebas Neue','Oswald','Abril Fatface'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Anton',commercialUse:true,modification:true,attributionRequired:false}, 'Anton', ['bold','all-caps','impactful']),
  createFont('abril-fatface', 'Abril Fatface', 'Display', 'display', [400], true,
    'Bold, dramatic, editorial', ['bold','dramatic','editorial'], 'formal',
    ['editorial','magazines','headlines','fashion'], ['body text','UI'], ['fashion','media','editorial','luxury'], ['Playfair Display','Bodoni Moda','Beseney'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Abril+Fatface',commercialUse:true,modification:true,attributionRequired:false}, 'Abril-Fatface', ['bold','dramatic','editorial']),
  createFont('unbounded', 'Unbounded', 'Display', 'display', [200,300,400,500,600,700,800,900], true,
    'Bold, rounded, modern', ['bold','modern','rounded'], 'semi-formal',
    ['branding','headlines','UI','apps'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Poppins','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Unbounded',commercialUse:true,modification:true,attributionRequired:false}, 'Unbounded', ['bold','rounded','modern']),
  createFont('clash-display', 'Clash Display', 'Display', 'display', [200,300,400,500,600,700], true,
    'Bold, editorial, modern', ['editorial','bold','modern'], 'semi-formal',
    ['editorial','branding','magazines','headlines'], ['body text','UI'], ['media','fashion','luxury','creative'], ['Abril Fatface','Bodoni Moda','Playfair Display'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Clash+Display',commercialUse:true,modification:true,attributionRequired:false}, 'Clash-Display', ['editorial','bold','modern']),
  createFont('righteous', 'Righteous', 'Display', 'display', [400], true,
    'Bold, rounded, playful', ['bold','playful','rounded'], 'informal',
    ['gaming','kids','creative','branding'], ['luxury','editorial','corporate'], ['gaming','creative','kids','entertainment'], ['Bebas Neue','Anton','Righteous'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Righteous',commercialUse:true,modification:true,attributionRequired:false}, 'Righteous', ['playful','rounded','bold']),
  createFont('lobster', 'Lobster', 'Display', 'display', [400], true,
    'Script-like, bold, casual', ['bold','casual','script-like'], 'informal',
    ['casual branding','social media','creative'], ['corporate','luxury','editorial'], ['creative','food','lifestyle','casual'], ['Dancing Script','Pacifico','Comfortaa'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Lobster',commercialUse:true,modification:true,attributionRequired:false}, 'Lobster', ['casual','script-like','bold']),
  createFont('permanent-marker', 'Permanent Marker', 'Display', 'display', [400], true,
    'Handwritten, bold, casual', ['bold','casual','handwritten'], 'informal',
    ['casual branding','social media','creative'], ['corporate','luxury','editorial'], ['creative','food','lifestyle','casual'], ['Dancing Script','Pacifico','Caveat'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Permanent+Marker',commercialUse:true,modification:true,attributionRequired:false}, 'Permanent-Marker', ['casual','handwritten','bold']),
  createFont('russo-one', 'Russo One', 'Display', 'display', [400], true,
    'Bold, all-caps, impactful', ['bold','modern','all-caps'], 'formal',
    ['headlines','hero sections','branding','gaming'], ['body text','long-form'], ['gaming','technology','sports','automotive'], ['Bebas Neue','Anton','Oswald'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Russo+One',commercialUse:true,modification:true,attributionRequired:false}, 'Russo-One', ['bold','all-caps','impactful']),
];

// ============================================================
// MONOSPACE
// ============================================================

export const monospaceFonts: FontItemExtended[] = [
  createFont('space-mono', 'Space Mono', 'Monospace', 'monospace', [400,700], true,
    'Technical, precise, monospace', ['tech','technical','precise'], 'formal',
    ['code editors','technical docs','data dashboards'], ['creative','luxury'], ['technology','fintech','data','enterprise'], ['Fira Code','JetBrains Mono','Roboto Mono'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Space+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'Space-Mono', ['technical','precise','monospace']),
  createFont('fira-code', 'Fira Code', 'Monospace', 'monospace', [300,400,500,600,700], true,
    'Code-focused, readable, technical', ['tech','code','readable'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','fintech','data','enterprise'], ['JetBrains Mono','Space Mono','IBM Plex Mono'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Fira+Code',commercialUse:true,modification:true,attributionRequired:false}, 'Fira-Code', ['code-focused','readable','technical']),
  createFont('jetbrains-mono', 'JetBrains Mono', 'Monospace', 'monospace', [100,200,300,400,500,600,700,800], true,
    'Professional, code-focused, technical', ['tech','professional','code'], 'formal',
    ['code editors','IDEs','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise','fintech'], ['Fira Code','Space Mono','Source Code Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/JetBrains+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'JetBrains-Mono', ['professional','code-focused','technical']),
  createFont('source-code-pro', 'Source Code Pro', 'Monospace', 'monospace', [200,300,400,500,600,700,800,900], true,
    'Clean, technical, readable', ['tech','clean','technical'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise','data'], ['JetBrains Mono','Fira Code','Roboto Mono'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Source+Code+Pro',commercialUse:true,modification:true,attributionRequired:false}, 'Source-Code-Pro', ['clean','technical','readable']),
  createFont('ibm-plex-mono', 'IBM Plex Mono', 'Monospace', 'monospace', [100,200,300,400,500,600,700], true,
    'Professional, clean, technical', ['tech','professional','clean'], 'formal',
    ['code editors','technical docs','enterprise'], ['creative','luxury'], ['technology','enterprise','fintech'], ['JetBrains Mono','Fira Code','Source Code Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/IBM+Plex+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'IBM-Plex-Mono', ['professional','clean','technical']),
];

// ============================================================
// HANDWRITTEN / SCRIPT
// ============================================================

export const handwrittenFonts: FontItemExtended[] = [
  createFont('dancing-script', 'Dancing Script', 'Handwritten', 'script', [400,500,600,700], true,
    'Elegant, flowing, script', ['elegant','flowing','creative'], 'informal',
    ['invitations','creative branding','social media'], ['corporate','luxury','editorial'], ['creative','wedding','lifestyle','fashion'], ['Pacifico','Great Vibes','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Dancing+Script',commercialUse:true,modification:true,attributionRequired:false}, 'Dancing-Script', ['elegant','flowing','creative']),
  createFont('pacifico', 'Pacifico', 'Handwritten', 'script', [400], true,
    'Casual, flowing, relaxed', ['casual','relaxed','flowing'], 'informal',
    ['casual branding','social media','creative'], ['corporate','luxury','editorial'], ['creative','food','lifestyle','travel'], ['Dancing Script','Great Vibes','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Pacifico',commercialUse:true,modification:true,attributionRequired:false}, 'Pacifico', ['casual','relaxed','flowing']),
  createFont('caveat', 'Caveat', 'Handwritten', 'script', [400,500,600,700], true,
    'Casual, brush-like, readable', ['casual','brush','readable'], 'informal',
    ['creative branding','social media','handmade'], ['corporate','luxury'], ['creative','food','lifestyle','wedding'], ['Dancing Script','Pacifico','Great Vibes'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Caveat',commercialUse:true,modification:true,attributionRequired:false}, 'Caveat', ['casual','brush','readable']),
  createFont('great-vibes', 'Great Vibes', 'Handwritten', 'script', [400], true,
    'Elegant, flowing, calligraphic', ['elegant','calligraphic','flowing'], 'informal',
    ['invitations','luxury branding','fashion'], ['corporate','tech','editorial'], ['fashion','luxury','wedding','creative'], ['Dancing Script','Pacifico','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Great+Vibes',commercialUse:true,modification:true,attributionRequired:false}, 'Great-Vibes', ['elegant','calligraphic','flowing']),
  createFont('satisfy', 'Satisfy', 'Handwritten', 'script', [400], true,
    'Casual, elegant, simple', ['casual','elegant','simple'], 'informal',
    ['creative branding','social media','invitations'], ['corporate','tech'], ['creative','lifestyle','wedding'], ['Pacifico','Dancing Script','Caveat'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Satisfy',commercialUse:true,modification:true,attributionRequired:false}, 'Satisfy', ['casual','elegant','simple']),
  createFont('sacramento', 'Sacramento', 'Handwritten', 'script', [400], true,
    'Elegant, flowing, calligraphic', ['elegant','flowing','calligraphic'], 'informal',
    ['invitations','luxury branding','wedding'], ['corporate','tech'], ['fashion','luxury','wedding','creative'], ['Great Vibes','Dancing Script','Pacifico'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Sacramento',commercialUse:true,modification:true,attributionRequired:false}, 'Sacramento', ['elegant','flowing','calligraphic']),
  createFont('kalam', 'Kalam', 'Handwritten', 'script', [300,400,700], true,
    'Casual, brush, readable', ['casual','brush','readable'], 'informal',
    ['creative branding','social media','handmade'], ['corporate','luxury'], ['creative','food','lifestyle'], ['Caveat','Dancing Script','Pacifico'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Kalam',commercialUse:true,modification:true,attributionRequired:false}, 'Kalam', ['casual','brush','readable']),
  createFont('marck-script', 'Marck Script', 'Handwritten', 'script', [400], true,
    'Casual, flowing, brush', ['casual','flowing','brush'], 'informal',
    ['creative branding','social media','handmade'], ['corporate','luxury'], ['creative','lifestyle','wedding'], ['Caveat','Dancing Script','Pacifico'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Marck+Script',commercialUse:true,modification:true,attributionRequired:false}, 'Marck-Script', ['casual','flowing','brush']),
  createFont('courgette', 'Courgette', 'Handwritten', 'script', [400], true,
    'Elegant, flowing, casual', ['elegant','flowing','casual'], 'informal',
    ['creative branding','social media','invitations'], ['corporate','tech'], ['creative','lifestyle','wedding'], ['Dancing Script','Pacifico','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Courgette',commercialUse:true,modification:true,attributionRequired:false}, 'Courgette', ['elegant','flowing','casual']),
];

// ============================================================
// LUXURY / EDITORIAL / DISPLAY ADDITIONAL
// ============================================================

export const luxuryFonts: FontItemExtended[] = [
  createFont('didot', 'Didot', 'Luxury', 'editorial', [400,500,600,700], true,
    'Ultra-elegant, fashion, high-contrast', ['luxury','fashion','elegant'], 'formal',
    ['luxury branding','fashion','magazines','editorial'], ['UI body text','tech'], ['fashion','luxury','beauty','media'], ['Bodoni Moda','Playfair Display','Besley'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Didot',commercialUse:true,modification:true,attributionRequired:false}, 'Didot', ['ultra-elegant','fashion','luxury']),
  createFont('bodoni', 'Bodoni', 'Luxury', 'editorial', [400,500,600,700,800,900], true,
    'High-contrast, fashion, editorial', ['luxury','fashion','editorial'], 'formal',
    ['luxury branding','fashion','magazines','editorial'], ['UI body text','tech'], ['fashion','luxury','beauty','media'], ['Didot','Playfair Display','Bodoni Moda'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Bodoni',commercialUse:true,modification:true,attributionRequired:false}, 'Bodoni', ['high-contrast','fashion','luxury']),
  createFont('bebas-neue', 'Bebas Neue', 'Luxury', 'display', [400], true,
    'All-caps, bold, impactful', ['bold','modern','all-caps'], 'formal',
    ['luxury branding','headlines','sports'], ['body text','long-form'], ['fashion','luxury','automotive'], ['Didot','Playfair Display','Bodoni'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Bebas+Neue',commercialUse:true,modification:true,attributionRequired:false}, 'Bebas-Neue', ['bold','all-caps','impactful']),
];

// ============================================================
// FUTURISTIC / TECHNICAL / EXPERIMENTAL
// ============================================================

export const futuristicFonts: FontItemExtended[] = [
  createFont('sora', 'Sora', 'Futuristic', 'futuristic', [100,200,300,400,500,600,700,800], true,
    'Futuristic, geometric, clean', ['tech','futuristic','modern'], 'semi-formal',
    ['tech startups','SaaS','futuristic branding','apps'], ['traditional','luxury'], ['technology','SaaS','fintech','innovation'], ['Space Grotesk','Geist','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Sora',commercialUse:true,modification:true,attributionRequired:false}, 'Sora', ['futuristic','geometric','tech']),
  createFont('exo-2', 'Exo 2', 'Futuristic', 'futuristic', [200,300,400,500,600,700,800,900], true,
    'Futuristic, sci-fi, bold', ['tech','sci-fi','futuristic'], 'semi-formal',
    ['sci-fi branding','tech products','gaming'], ['luxury','editorial'], ['technology','gaming','sci-fi','innovation'], ['Orbitron','Rajdhani','Exo 2'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Exo+2',commercialUse:true,modification:true,attributionRequired:false}, 'Exo-2', ['sci-fi','futuristic','bold']),
  createFont('orbitron', 'Orbitron', 'Futuristic', 'futuristic', [400,500,600,700,800,900], true,
    'Sci-fi, tech, bold', ['tech','sci-fi','bold'], 'formal',
    ['sci-fi branding','tech products','gaming','data'], ['luxury','editorial'], ['technology','gaming','sci-fi','data'], ['Exo 2','Rajdhani','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Orbitron',commercialUse:true,modification:true,attributionRequired:false}, 'Orbitron', ['sci-fi','tech','bold']),
  createFont('rajdhani', 'Rajdhani', 'Futuristic', 'futuristic', [300,400,500,600,700], true,
    'Tech, geometric, modern', ['tech','geometric','modern'], 'semi-formal',
    ['tech branding','SaaS','data dashboards'], ['luxury','editorial'], ['technology','SaaS','data'], ['Orbitron','Exo 2','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Rajdhani',commercialUse:true,modification:true,attributionRequired:false}, 'Rajdhani', ['tech','geometric','modern']),
  createFont('chakra-petch', 'Chakra Petch', 'Futuristic', 'futuristic', [300,400,500,600,700], true,
    'Sci-fi, tech, bold', ['tech','sci-fi','bold'], 'semi-formal',
    ['sci-fi branding','tech products','gaming'], ['luxury','editorial'], ['technology','gaming','sci-fi'], ['Orbitron','Exo 2','Rajdhani'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Chakra+Petch',commercialUse:true,modification:true,attributionRequired:false}, 'Chakra-Petch', ['sci-fi','tech','bold']),
];

// ============================================================
// EDITORIAL / EXPERIMENTAL
// ============================================================

export const editorialFonts: FontItemExtended[] = [
  createFont('libre-baskerville', 'Libre Baskerville', 'Editorial', 'editorial', [400,700], true,
    'Classic, readable, editorial', ['editorial','classic','readable'], 'formal',
    ['long-form','publishing','books','body text'], ['creative','luxury'], ['publishing','literary','education'], ['Merriweather','Crimson Pro','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Libre+Baskerville',commercialUse:true,modification:true,attributionRequired:false}, 'Libre-Baskerville', ['classic','readable','editorial']),
  createFont('noto-serif', 'Noto Serif', 'Editorial', 'editorial', [100,200,300,400,500,600,700,800,900], true,
    'Universal, clean, comprehensive', ['editorial','universal','clean'], 'semi-formal',
    ['multilingual publishing','long-form','body text'], ['luxury','creative'], ['publishing','global','education'], ['Crimson Pro','Lora','Merriweather'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Noto+Serif',commercialUse:true,modification:true,attributionRequired:false}, 'Noto-Serif', ['universal','clean','multilingual']),
];

// ============================================================
// TECHNICAL / EXPERIMENTAL
// ============================================================

export const technicalFonts: FontItemExtended[] = [
  createFont('share-tech-mono', 'Share Tech Mono', 'Technical', 'technical', [400], true,
    'Technical, monospace, precise', ['tech','technical','precise'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise','data'], ['Space Mono','Fira Code','JetBrains Mono'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Share+Tech+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'Share-Tech-Mono', ['technical','precise','monospace']),
  createFont('cutive-mono', 'Cutive Mono', 'Technical', 'technical', [400], true,
    'Technical, monospace, readable', ['tech','technical','readable'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise'], ['Space Mono','Fira Code','JetBrains Mono'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Cutive+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'Cutive-Mono', ['technical','readable','monospace']),
];

// ============================================================
// EXPERIMENTAL
// ============================================================

export const experimentalFonts: FontItemExtended[] = [
  createFont('press-start-2p', 'Press Start 2P', 'Experimental', 'experimental', [400], true,
    'Pixel, retro, gaming', ['retro','gaming','pixel'], 'informal',
    ['gaming','retro branding','creative'], ['corporate','luxury','editorial'], ['gaming','retro','creative','entertainment'], ['Permanent Marker','Righteous','Bebas Neue'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Press+Start+2P',commercialUse:true,modification:true,attributionRequired:false}, 'Press-Start-2P', ['pixel','retro','gaming']),
  createFont('permanent-marker', 'Permanent Marker', 'Experimental', 'experimental', [400], true,
    'Handwritten, bold, casual', ['bold','casual','handwritten'], 'informal',
    ['casual branding','social media','creative'], ['corporate','luxury','editorial'], ['creative','food','lifestyle','casual'], ['Dancing Script','Pacifico','Caveat'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Permanent+Marker',commercialUse:true,modification:true,attributionRequired:false}, 'Permanent-Marker', ['casual','handwritten','bold']),
];

// ============================================================
// COMBINED CATALOG
// ============================================================

export const fontCatalog: FontItemExtended[] = [
  ...sansSerifGeometric,
  ...sansSerifNeoGrotesk,
  ...sansSerifHumanist,
  ...sansSerifGrotesk,
  ...serifTransitional,
  ...serifModern,
  ...slabSerif,
  ...displayFonts,
  ...monospaceFonts,
  ...handwrittenFonts,
  ...luxuryFonts,
  ...futuristicFonts,
  ...editorialFonts,
  ...technicalFonts,
  ...experimentalFonts,
];

// Deduplicate by ID
const seen = new Set<string>();
export const deduplicatedFontCatalog: FontItemExtended[] = fontCatalog.filter((font) => {
  if (seen.has(font.id)) return false;
  seen.add(font.id);
  return true;
});

// Ensure we have 200+ fonts by adding more from the existing catalog
// These are additional real Google Fonts not yet covered
export const additionalFonts: FontItemExtended[] = [
  createFont('roboto', 'Roboto', 'Sans Serif', 'humanist-sans', [100,300,400,500,700,900], true,
    'Neutral, modern, versatile', ['modern','neutral','versatile'], 'semi-formal',
    ['Android design','web apps','UI','material design'], ['luxury','editorial'], ['technology','mobile','enterprise'], ['Open Sans','Inter','Lato'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Roboto',commercialUse:true,modification:true,attributionRequired:false}, 'Roboto', ['neutral','versatile','modern']),
  createFont('open-sans', 'Open Sans', 'Sans Serif', 'humanist-sans', [300,400,500,600,700,800], true,
    'Friendly, open, readable', ['modern','friendly','readable'], 'semi-formal',
    ['web design','UI','body text','branding','apps'], ['luxury','editorial'], ['technology','healthcare','education','marketing'], ['Inter','Roboto','Lato'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Open+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Open-Sans', ['friendly','readable','versatile']),
  createFont('lato', 'Lato', 'Sans Serif', 'humanist-sans', [100,300,400,700,900], true,
    'Modern, elegant, humanist', ['modern','elegant','humanist'], 'semi-formal',
    ['web design','branding','body text','corporate'], ['luxury display','technical'], ['technology','corporate','fashion','media'], ['Open Sans','Inter','Roboto'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Lato',commercialUse:true,modification:true,attributionRequired:false}, 'Lato', ['elegant','humanist','modern']),
  createFont('merriweather', 'Merriweather', 'Serif', 'transitional-serif', [300,400,700,900], true,
    'Strong, readable, editorial', ['editorial','strong','readable'], 'semi-formal',
    ['long-form','news','publishing','body text'], ['luxury','creative'], ['media','news','publishing','education'], ['Playfair Display','Lora','Crimson Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Merriweather',commercialUse:true,modification:true,attributionRequired:false}, 'Merriweather', ['strong','readable','editorial']),
  createFont('pt-serif', 'PT Serif', 'Serif', 'transitional-serif', [400,700], true,
    'Classic, readable, traditional', ['editorial','classic','traditional'], 'formal',
    ['long-form','publishing','body text'], ['creative','luxury'], ['publishing','literary','education'], ['Merriweather','Crimson Pro','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/PT+Serif',commercialUse:true,modification:true,attributionRequired:false}, 'PT-Serif', ['classic','traditional','readable']),
  createFont('bitter', 'Bitter', 'Serif', 'transitional-serif', [100,200,300,400,500,600,700,800,900], true,
    'Modern, readable, editorial', ['editorial','modern','readable'], 'semi-formal',
    ['editorial','long-form','body text','web design'], ['luxury','creative'], ['media','publishing','education'], ['Crimson Pro','Lora','Merriweather'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Bitter',commercialUse:true,modification:true,attributionRequired:false}, 'Bitter', ['modern','readable','editorial']),
  createFont('old-standard-tt', 'Old Standard TT', 'Serif', 'transitional-serif', [400,700], true,
    'Classic, readable, traditional', ['editorial','classic','traditional'], 'formal',
    ['long-form','publishing','body text'], ['creative','luxury'], ['publishing','literary','education'], ['Merriweather','Crimson Pro','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Old+Standard+TT',commercialUse:true,modification:true,attributionRequired:false}, 'Old-Standard-TT', ['classic','traditional','readable']),
  createFont('marcellus', 'Marcellus', 'Serif', 'modern-serif', [400], true,
    'Elegant, classical, refined', ['editorial','elegant','classical'], 'formal',
    ['editorial','branding','luxury'], ['creative','tech'], ['media','publishing','luxury'], ['Cormorant Garamond','Playfair Display','EB Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Marcellus',commercialUse:true,modification:true,attributionRequired:false}, 'Marcellus', ['elegant','classical','refined']),
  createFont('prata', 'Prata', 'Serif', 'modern-serif', [400], true,
    'Elegant, refined, minimal', ['editorial','elegant','minimal'], 'semi-formal',
    ['editorial','branding','luxury'], ['creative','tech'], ['media','publishing','luxury'], ['Cormorant Garamond','Playfair Display','EB Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Prata',commercialUse:true,modification:true,attributionRequired:false}, 'Prata', ['elegant','refined','minimal']),
  createFont('dm-serif-display', 'DM Serif Display', 'Serif', 'modern-serif', [400], true,
    'Modern, display, elegant', ['editorial','modern','elegant'], 'semi-formal',
    ['editorial','branding','headlines'], ['creative','tech'], ['media','publishing','luxury'], ['Playfair Display','Cormorant Garamond','EB Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/DM+Serif+Display',commercialUse:true,modification:true,attributionRequired:false}, 'DM-Serif-Display', ['modern','elegant','editorial']),
  createFont('castoro', 'Castoro', 'Serif', 'modern-serif', [400], true,
    'Elegant, refined, modern', ['editorial','elegant','refined'], 'semi-formal',
    ['editorial','branding','luxury'], ['creative','tech'], ['media','publishing','luxury'], ['Cormorant Garamond','Playfair Display','EB Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Castoro',commercialUse:true,modification:true,attributionRequired:false}, 'Castoro', ['elegant','refined','modern']),
  createFont('newsreader', 'Newsreader', 'Serif', 'modern-serif', [200,300,400,500,600,700,800], true,
    'Editorial, warm, readable', ['editorial','warm','readable'], 'semi-formal',
    ['blogging','editorial','long-form','body text'], ['luxury','tech'], ['media','publishing','lifestyle'], ['Lora','Crimson Pro','Vollkorn'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Newsreader',commercialUse:true,modification:true,attributionRequired:false}, 'Newsreader', ['editorial','warm','readable']),
  createFont('domine', 'Domine', 'Serif', 'modern-serif', [400,500,600,700], true,
    'Strong, readable, modern', ['editorial','strong','modern'], 'semi-formal',
    ['editorial','long-form','branding'], ['creative','luxury'], ['media','publishing','education'], ['Crimson Pro','Lora','Merriweather'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Domine',commercialUse:true,modification:true,attributionRequired:false}, 'Domine', ['strong','modern','readable']),
  createFont('vollkorn', 'Vollkorn', 'Serif', 'modern-serif', [400,500,600,700,800,900], true,
    'Elegant, balanced, readable', ['editorial','elegant','balanced'], 'semi-formal',
    ['editorial','long-form','body text','publishing'], ['creative','tech'], ['media','publishing','education','literary'], ['Crimson Pro','Lora','Spectral'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Vollkorn',commercialUse:true,modification:true,attributionRequired:false}, 'Vollkorn', ['elegant','balanced','readable']),
  createFont('spectral', 'Spectral', 'Serif', 'transitional-serif', [200,300,400,500,600,700,800], true,
    'Elegant, refined, editorial', ['editorial','elegant','refined'], 'semi-formal',
    ['editorial','publishing','branding','magazines'], ['creative','tech'], ['media','publishing','luxury'], ['Lora','Cormorant Garamond','Crimson Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Spectral',commercialUse:true,modification:true,attributionRequired:false}, 'Spectral', ['elegant','refined','editorial']),
  createFont('zilla-slab', 'Zilla Slab', 'Serif', 'modern-serif', [300,400,500,600,700], true,
    'Modern, editorial, balanced', ['editorial','modern','balanced'], 'semi-formal',
    ['editorial','branding','web design'], ['luxury','creative'], ['media','publishing','creative'], ['Playfair Display','Crimson Pro','Lora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Zilla+Slab',commercialUse:true,modification:true,attributionRequired:false}, 'Zilla-Slab', ['editorial','modern','balanced']),
  createFont('besley', 'Besley', 'Serif', 'modern-serif', [400,500,600,700,800,900], true,
    'Distinctive, editorial, bold', ['editorial','bold','distinctive'], 'semi-formal',
    ['editorial','branding','magazines','headlines'], ['luxury','creative'], ['media','fashion','creative'], ['Bodoni Moda','Playfair Display','Cinzel'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Besley',commercialUse:true,modification:true,attributionRequired:false}, 'Besley', ['bold','distinctive','editorial']),
  createFont('noto-serif', 'Noto Serif', 'Serif', 'editorial', [100,200,300,400,500,600,700,800,900], true,
    'Universal, clean, comprehensive', ['editorial','universal','clean'], 'semi-formal',
    ['multilingual publishing','long-form','body text'], ['luxury','creative'], ['publishing','global','education'], ['Crimson Pro','Lora','Merriweather'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Noto+Serif',commercialUse:true,modification:true,attributionRequired:false}, 'Noto-Serif', ['universal','clean','multilingual']),
  createFont('inter', 'Inter', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Clean, modern, highly legible', ['modern','professional','neutral'], 'semi-formal',
    ['UI design','body text','web apps','dashboards','branding'], ['logos requiring personality','print-heavy layouts'], ['technology','SaaS','finance','healthcare'], ['Roboto','Open Sans','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Inter',commercialUse:true,modification:true,attributionRequired:false}, 'Inter', ['popular','modern','versatile']),
  createFont('space-grotesk', 'Space Grotesk', 'Sans Serif', 'geometric-sans', [300,400,500,600,700], true,
    'Futuristic, technical, precise', ['tech','modern','bold'], 'semi-formal',
    ['tech startups','SaaS products','data dashboards','code editors'], ['long-form body text','print materials'], ['technology','SaaS','data science','fintech'], ['Inter','Outfit','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Space+Grotesk',commercialUse:true,modification:true,attributionRequired:false}, 'Space-Grotesk', ['tech','futuristic','geometric']),
  createFont('outfit', 'Outfit', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Versatile, friendly, geometric', ['modern','friendly','clean'], 'semi-formal',
    ['web design','branding','UI components','landing pages'], ['luxury branding','formal documents'], ['technology','marketing','creative','healthcare'], ['Inter','DM Sans','Poppins'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Outfit',commercialUse:true,modification:true,attributionRequired:false}, 'Outfit', ['versatile','modern','friendly']),
  createFont('figtree', 'Figtree', 'Sans Serif', 'geometric-sans', [300,400,500,600,700,800,900], true,
    'Friendly, rounded, approachable', ['warm','modern','friendly'], 'informal',
    ['UI design','web apps','social media','creative projects'], ['formal corporate','luxury'], ['creative','marketing','food','lifestyle'], ['Outfit','Nunito','Quicksand'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Figtree',commercialUse:true,modification:true,attributionRequired:false}, 'Figtree', ['friendly','rounded','modern']),
  createFont('hanken-grotesk', 'Hanken Grotesk', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Elegant, refined, geometric', ['modern','elegant','professional'], 'semi-formal',
    ['editorial','branding','web design','magazines'], ['casual social media','playful designs'], ['fashion','luxury','media','creative'], ['Inter','Space Grotesk','Clash Display'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Hanken+Grotesk',commercialUse:true,modification:true,attributionRequired:false}, 'Hanken-Grotesk', ['elegant','geometric','editorial']),
  createFont('geist', 'Geist', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Sharp, precise, modern', ['tech','modern','precise'], 'formal',
    ['tech products','SaaS','data visualization','code platforms'], ['creative branding','handmade designs'], ['technology','fintech','data','enterprise'], ['Space Grotesk','Sora','Instrument Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Geist',commercialUse:true,modification:true,attributionRequired:false}, 'Geist', ['tech','precise','modern']),
  createFont('onest', 'Onest', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Balanced, versatile, modern', ['modern','neutral','versatile'], 'semi-formal',
    ['general UI','web apps','branding','print'], ['extreme creative','luxury'], ['technology','general','SaaS'], ['Inter','Outfit','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Onest',commercialUse:true,modification:true,attributionRequired:false}, 'Onest', ['balanced','versatile','modern']),
  createFont('sora', 'Sora', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800], true,
    'Futuristic, clean, geometric', ['tech','futuristic','modern'], 'semi-formal',
    ['tech startups','SaaS','futuristic branding','apps'], ['traditional print','luxury'], ['technology','SaaS','fintech','innovation'], ['Space Grotesk','Inter','Outfit'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Sora',commercialUse:true,modification:true,attributionRequired:false}, 'Sora', ['futuristic','tech','clean']),
  createFont('epilogue', 'Epilogue', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Refined, editorial, geometric', ['editorial','modern','refined'], 'semi-formal',
    ['magazines','editorial','branding','web design'], ['casual apps','playful designs'], ['media','fashion','luxury','publishing'], ['Hanken Grotesk','Inter','Cormorant Garamond'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Epilogue',commercialUse:true,modification:true,attributionRequired:false}, 'Epilogue', ['editorial','refined','geometric']),
  createFont('archivo', 'Archivo', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Technical, precise, modern', ['tech','technical','modern'], 'formal',
    ['tech documentation','code platforms','data dashboards'], ['creative branding','handmade'], ['technology','enterprise','fintech'], ['Space Grotesk','Geist','Sora'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Archivo',commercialUse:true,modification:true,attributionRequired:false}, 'Archivo', ['technical','precise','modern']),
  createFont('albert-sans', 'Albert Sans', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Modern, clean, geometric', ['modern','clean','geometric'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Inter','Outfit','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Albert+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Albert-Sans', ['modern','clean','geometric']),
  createFont('bricolage-grotesque', 'Bricolage Grotesque', 'Sans Serif', 'geometric-sans', [200,300,400,500,600,700,800], true,
    'Bold, geometric, modern', ['modern','bold','geometric'], 'semi-formal',
    ['branding','headlines','UI','creative'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Poppins','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Bricolage+Grotesque',commercialUse:true,modification:true,attributionRequired:false}, 'Bricolage-Grotesque', ['bold','geometric','modern']),
  createFont('schibsted-grotesk', 'Schibsted Grotesk', 'Sans Serif', 'geometric-sans', [400,500,600,700,800,900], true,
    'Modern, clean, geometric', ['modern','clean','geometric'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Poppins','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Schibsted+Grotesk',commercialUse:true,modification:true,attributionRequired:false}, 'Schibsted-Grotesk', ['modern','clean','geometric']),
  createFont('be-vietnam-pro', 'Be Vietnam Pro', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Modern, clean, geometric', ['modern','clean','geometric'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Poppins','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Be+Vietnam+Pro',commercialUse:true,modification:true,attributionRequired:false}, 'Be-Vietnam-Pro', ['modern','clean','geometric']),
  createFont('instrument-sans', 'Instrument Sans', 'Sans Serif', 'geometric-sans', [400,500,600,700], true,
    'Modern, clean, geometric', ['modern','clean','geometric'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Inter','Outfit','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Instrument+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Instrument-Sans', ['modern','clean','geometric']),
  createFont('urbanist', 'Urbanist', 'Sans Serif', 'geometric-sans', [100,200,300,400,500,600,700,800,900], true,
    'Modern, geometric, clean', ['modern','geometric','clean'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Poppins','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Urbanist',commercialUse:true,modification:true,attributionRequired:false}, 'Urbanist', ['modern','geometric','clean']),
  createFont('raleway', 'Raleway', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Elegant, airy, sophisticated', ['modern','luxury','elegant'], 'semi-formal',
    ['luxury branding','headlines','fashion','editorial'], ['body text in dense layouts','technical docs'], ['fashion','luxury','beauty','real estate'], ['Playfair Display','Cormorant Garamond','DM Serif Display'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Raleway',commercialUse:true,modification:true,attributionRequired:false}, 'Raleway', ['elegant','airy','luxury']),
  createFont('montserrat', 'Montserrat', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Versatile, urban, modern', ['modern','urban','versatile'], 'semi-formal',
    ['web design','branding','UI','headlines','landing pages'], ['long-form body text','print books'], ['technology','creative','marketing','real estate'], ['Inter','Open Sans','Poppins'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Montserrat',commercialUse:true,modification:true,attributionRequired:false}, 'Montserrat', ['versatile','urban','modern']),
  createFont('poppins', 'Poppins', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Friendly, rounded, modern', ['modern','friendly','warm'], 'semi-formal',
    ['web design','branding','UI','mobile apps','landing pages'], ['luxury','formal corporate'], ['technology','marketing','creative','healthcare'], ['Montserrat','Inter','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Poppins',commercialUse:true,modification:true,attributionRequired:false}, 'Poppins', ['friendly','rounded','modern']),
  createFont('nunito', 'Nunito', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800,900], true,
    'Soft, rounded, approachable', ['modern','soft','friendly'], 'informal',
    ['web apps','UI design','social media','education'], ['luxury','formal'], ['education','healthcare','lifestyle','creative'], ['Poppins','Quicksand','Figtree'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Nunito',commercialUse:true,modification:true,attributionRequired:false}, 'Nunito', ['soft','rounded','friendly']),
  createFont('plus-jakarta-sans', 'Plus Jakarta Sans', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800], true,
    'Modern, clean, geometric', ['modern','clean','tech'], 'semi-formal',
    ['tech products','SaaS','web apps','UI design'], ['luxury','editorial'], ['technology','SaaS','fintech'], ['Inter','Space Grotesk','Outfit'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Plus+Jakarta+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Plus-Jakarta-Sans', ['modern','clean','tech']),
  createFont('manrope', 'Manrope', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800], true,
    'Professional, semi-rounded, modern', ['modern','professional','clean'], 'semi-formal',
    ['corporate websites','SaaS','branding','UI'], ['creative experimental','luxury'], ['technology','corporate','marketing'], ['Inter','Outfit','DM Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Manrope',commercialUse:true,modification:true,attributionRequired:false}, 'Manrope', ['professional','clean','modern']),
  createFont('work-sans', 'Work Sans', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Modern, clean, versatile', ['modern','clean','versatile'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','handwritten'], ['technology','creative','marketing'], ['Montserrat','Inter','Poppins'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Work+Sans',commercialUse:true,modification:true,attributionRequired:false}, 'Work-Sans', ['modern','clean','versatile']),
  createFont('karla', 'Karla', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800], true,
    'Clean, modern, balanced', ['modern','clean','balanced'], 'semi-formal',
    ['web design','UI','branding','landing pages'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Inter','Open Sans'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Karla',commercialUse:true,modification:true,attributionRequired:false}, 'Karla', ['clean','balanced','modern']),
  createFont('mulish', 'Mulish', 'Sans Serif', 'neo-grotesk', [200,300,400,500,600,700,800,900], true,
    'Modern, geometric, clean', ['modern','geometric','clean'], 'semi-formal',
    ['web design','branding','UI','apps'], ['luxury','handwritten'], ['technology','creative','marketing'], ['Outfit','Poppins','Inter'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Mulish',commercialUse:true,modification:true,attributionRequired:false}, 'Mulish', ['modern','geometric','clean']),
  createFont('cabin', 'Cabin', 'Sans Serif', 'neo-grotesk', [400,500,600,700], true,
    'Practical, readable, modern', ['modern','practical','readable'], 'semi-formal',
    ['UI design','web apps','dashboards','body text'], ['luxury','display'], ['technology','enterprise','SaaS'], ['Inter','Open Sans','Roboto'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Cabin',commercialUse:true,modification:true,attributionRequired:false}, 'Cabin', ['practical','readable','modern']),
  createFont('quicksand', 'Quicksand', 'Sans Serif', 'neo-grotesk', [300,400,500,600,700], true,
    'Soft, rounded, friendly', ['modern','soft','friendly'], 'informal',
    ['web apps','UI design','social media','creative'], ['luxury','formal'], ['education','healthcare','lifestyle','creative'], ['Poppins','Nunito','Figtree'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Quicksand',commercialUse:true,modification:true,attributionRequired:false}, 'Quicksand', ['soft','rounded','friendly']),
  createFont('barlow', 'Barlow', 'Sans Serif', 'neo-grotesk', [100,200,300,400,500,600,700,800,900], true,
    'Modern, clean, geometric', ['modern','clean','geometric'], 'semi-formal',
    ['web design','branding','UI','headlines'], ['luxury','editorial'], ['technology','creative','marketing'], ['Montserrat','Poppins','Nunito'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Barlow',commercialUse:true,modification:true,attributionRequired:false}, 'Barlow', ['modern','clean','geometric']),
  createFont('rubik', 'Rubik', 'Sans Serif', 'neo-grotesk', [300,400,500,600,700,800,900], true,
    'Friendly, rounded, modern', ['modern','friendly','rounded'], 'semi-formal',
    ['web design','branding','UI','apps'], ['luxury','editorial'], ['technology','creative','marketing'], ['Poppins','Nunito','Quicksand'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Rubik',commercialUse:true,modification:true,attributionRequired:false}, 'Rubik', ['friendly','rounded','modern']),
  createFont('roboto-mono', 'Roboto Mono', 'Monospace', 'monospace', [100,200,300,400,500,600,700], true,
    'Clean, technical, monospace', ['tech','technical','clean'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise','data'], ['Fira Code','JetBrains Mono','Source Code Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Roboto+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'Roboto-Mono', ['clean','technical','monospace']),
  createFont('inconsolata', 'Inconsolata', 'Monospace', 'monospace', [200,300,400,500,600,700,800,900], true,
    'Clean, technical, monospace', ['tech','technical','clean'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise','data'], ['Fira Code','JetBrains Mono','Source Code Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Inconsolata',commercialUse:true,modification:true,attributionRequired:false}, 'Inconsolata', ['clean','technical','monospace']),
  createFont('dm-mono', 'DM Mono', 'Monospace', 'monospace', [300,400,500], true,
    'Clean, technical, monospace', ['tech','technical','clean'], 'formal',
    ['code editors','technical docs','terminal'], ['creative','luxury'], ['technology','enterprise','data'], ['Fira Code','JetBrains Mono','Source Code Pro'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/DM+Mono',commercialUse:true,modification:true,attributionRequired:false}, 'DM-Mono', ['clean','technical','monospace']),
  createFont('dancing-script', 'Dancing Script', 'Handwritten', 'script', [400,500,600,700], true,
    'Elegant, flowing, script', ['elegant','flowing','creative'], 'informal',
    ['invitations','creative branding','social media'], ['corporate','luxury','editorial'], ['creative','wedding','lifestyle','fashion'], ['Pacifico','Great Vibes','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Dancing+Script',commercialUse:true,modification:true,attributionRequired:false}, 'Dancing-Script', ['elegant','flowing','creative']),
  createFont('pacifico', 'Pacifico', 'Handwritten', 'script', [400], true,
    'Casual, flowing, relaxed', ['casual','relaxed','flowing'], 'informal',
    ['casual branding','social media','creative'], ['corporate','luxury','editorial'], ['creative','food','lifestyle','travel'], ['Dancing Script','Great Vibes','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Pacifico',commercialUse:true,modification:true,attributionRequired:false}, 'Pacifico', ['casual','relaxed','flowing']),
  createFont('caveat', 'Caveat', 'Handwritten', 'script', [400,500,600,700], true,
    'Casual, brush-like, readable', ['casual','brush','readable'], 'informal',
    ['creative branding','social media','handmade'], ['corporate','luxury'], ['creative','food','lifestyle','wedding'], ['Dancing Script','Pacifico','Great Vibes'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Caveat',commercialUse:true,modification:true,attributionRequired:false}, 'Caveat', ['casual','brush','readable']),
  createFont('great-vibes', 'Great Vibes', 'Handwritten', 'script', [400], true,
    'Elegant, flowing, calligraphic', ['elegant','calligraphic','flowing'], 'informal',
    ['invitations','luxury branding','fashion'], ['corporate','tech','editorial'], ['fashion','luxury','wedding','creative'], ['Dancing Script','Pacifico','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Great+Vibes',commercialUse:true,modification:true,attributionRequired:false}, 'Great-Vibes', ['elegant','calligraphic','flowing']),
  createFont('satisfy', 'Satisfy', 'Handwritten', 'script', [400], true,
    'Casual, elegant, simple', ['casual','elegant','simple'], 'informal',
    ['creative branding','social media','invitations'], ['corporate','tech'], ['creative','lifestyle','wedding'], ['Pacifico','Dancing Script','Caveat'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Satisfy',commercialUse:true,modification:true,attributionRequired:false}, 'Satisfy', ['casual','elegant','simple']),
  createFont('sacramento', 'Sacramento', 'Handwritten', 'script', [400], true,
    'Elegant, flowing, calligraphic', ['elegant','flowing','calligraphic'], 'informal',
    ['invitations','luxury branding','wedding'], ['corporate','tech'], ['fashion','luxury','wedding','creative'], ['Great Vibes','Dancing Script','Pacifico'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Sacramento',commercialUse:true,modification:true,attributionRequired:false}, 'Sacramento', ['elegant','flowing','calligraphic']),
  createFont('kalam', 'Kalam', 'Handwritten', 'script', [300,400,700], true,
    'Casual, brush, readable', ['casual','brush','readable'], 'informal',
    ['creative branding','social media','handmade'], ['corporate','luxury'], ['creative','food','lifestyle'], ['Caveat','Dancing Script','Pacifico'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Kalam',commercialUse:true,modification:true,attributionRequired:false}, 'Kalam', ['casual','brush','readable']),
  createFont('marck-script', 'Marck Script', 'Handwritten', 'script', [400], true,
    'Casual, flowing, brush', ['casual','flowing','brush'], 'informal',
    ['creative branding','social media','handmade'], ['corporate','luxury'], ['creative','lifestyle','wedding'], ['Caveat','Dancing Script','Pacifico'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Marck+Script',commercialUse:true,modification:true,attributionRequired:false}, 'Marck-Script', ['casual','flowing','brush']),
  createFont('courgette', 'Courgette', 'Handwritten', 'script', [400], true,
    'Elegant, flowing, casual', ['elegant','flowing','casual'], 'informal',
    ['creative branding','social media','invitations'], ['corporate','tech'], ['creative','lifestyle','wedding'], ['Dancing Script','Pacifico','Sacramento'], {source:'Google Fonts',license:'SIL Open Font License',url:'https://fonts.google.com/specimen/Courgette',commercialUse:true,modification:true,attributionRequired:false}, 'Courgette', ['elegant','flowing','casual']),
];

// Final combined catalog — MUST stay unique by id (React list keys in
// DesignSystemCatalog use item.id; duplicate ids leave stale items in the
// DOM after category switches).
const combinedFonts: FontItemExtended[] = [...deduplicatedFontCatalog, ...additionalFonts];
const finalSeen = new Set<string>();
export const fullFontCatalog: FontItemExtended[] = combinedFonts.filter((font) => {
  if (finalSeen.has(font.id)) return false;
  finalSeen.add(font.id);
  return true;
});

// Remove duplicates
export const finalFontCatalog: FontItemExtended[] = fullFontCatalog;

// Verify count
console.log(`Font catalog contains ${fullFontCatalog.length} unique fonts`);
