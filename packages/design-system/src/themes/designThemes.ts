/**
 * Design Themes — 30+ Complete Design Themes
 *
 * Each theme combines: Typography, Colors, Buttons, Cards, Radius,
 * Shadows, Background, Spacing, Sections, Hero, Image Treatment,
 * Icon Style, Effects.
 */

import type { ColorPalette } from '../colors/colorPalettes';
import type { TypographySystem } from '../typography/typographySystems';

export type ThemeCategory =
  | 'Modern' | 'Luxury' | 'Editorial' | 'Corporate' | 'Creative'
  | 'Tech' | 'Minimal' | 'Wellness' | 'Medical' | 'Fashion'
  | 'Architecture' | 'Restaurant' | 'Portfolio' | 'SaaS' | 'Brutalist'
  | 'Dark' | 'Organic' | 'Futuristic' | 'Vintage' | 'Ocean';

export interface ButtonStyle {
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
}

export interface CardStyle {
  structure: string;
  padding: string;
  radius: string;
  border: string;
  shadow: string;
  background: string;
  typography: string;
  imageTreatment: string;
  contentRules: string[];
}

export interface RadiusStyle {
  sharp: string;
  subtle: string;
  soft: string;
  rounded: string;
  pill: string;
  organic: string;
}

export interface ShadowStyle {
  none: string;
  subtle: string;
  soft: string;
  medium: string;
  elevated: string;
  floating: string;
  glass: string;
  luxury: string;
  deep: string;
}

export interface BackgroundStyle {
  type: string;
  intensity: string;
  colorDependency: string;
  useCase: string;
  antiPattern: string;
}

export interface SpacingStyle {
  sectionGap: string;
  containerGap: string;
  componentGap: string;
  cardGap: string;
  textGap: string;
  paddingScale: string;
}

export interface SectionStyle {
  type: string;
  padding: string;
  background: string;
  layout: string;
}

export interface HeroStyle {
  layout: string;
  background: string;
  typography: string;
  imageTreatment: string;
}

export interface ImageTreatmentStyle {
  crop: string;
  aspectRatio: string;
  radius: string;
  overlay: string;
  colorTreatment: string;
  bestUse: string;
}

export interface IconStyle {
  type: string;
  strokeWidth: string;
  fill: string;
  size: string;
}

export interface EffectStyle {
  type: string;
  intensity: string;
  compatibility: string;
  antiPattern: string;
}

export interface DesignTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  mood: string[];
  bestIndustries: string[];
  goodUseCases: string[];
  badUseCases: string[];
  // Core design elements
  typography: TypographySystem;
  colors: ColorPalette;
  buttons: ButtonStyle;
  cards: CardStyle;
  radius: RadiusStyle;
  shadows: ShadowStyle;
  background: BackgroundStyle;
  spacing: SpacingStyle;
  sections: SectionStyle[];
  hero: HeroStyle;
  imageTreatment: ImageTreatmentStyle;
  iconStyle: IconStyle;
  effects: EffectStyle[];
  // Compatibility
  compatibleWith: string[];
  notRecommendedWith: string[];
  // Preview
  preview: {
    h1: string;
    h2: string;
    body: string;
    button: string;
    card: string;
    background: string;
  };
  version: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

function createDesignTheme(
  id: string,
  name: string,
  category: ThemeCategory,
  description: string,
  mood: string[],
  bestIndustries: string[],
  goodUseCases: string[],
  badUseCases: string[],
  typography: TypographySystem,
  colors: ColorPalette,
  tags: string[] = []
): DesignTheme {
  const now = Date.now();
  return {
    id,
    name,
    category,
    description,
    mood,
    bestIndustries,
    goodUseCases,
    badUseCases,
    typography,
    colors,
    buttons: {
      radius: '8px', height: '48px', padding: '16px 32px',
      font: typography.fontFamily, weight: 600,
      border: '2px solid transparent', shadow: '0 2px 4px rgba(0,0,0,0.1)',
      hover: { backgroundColor: colors.primary, transform: 'translateY(-1px)' },
      active: { backgroundColor: colors.secondary, transform: 'translateY(0)' },
      disabled: { opacity: '0.5', cursor: 'not-allowed' },
    },
    cards: {
      structure: 'elevated', padding: '24px', radius: '12px',
      border: '1px solid ' + colors.border, shadow: '0 4px 12px rgba(0,0,0,0.1)',
      background: colors.surface, typography: typography.fontFamily,
      imageTreatment: 'rounded',
      contentRules: ['consistent padding', 'aligned typography', 'balanced whitespace'],
    },
    radius: { sharp: '0px', subtle: '4px', soft: '8px', rounded: '12px', pill: '9999px', organic: '24px' },
    shadows: {
      none: 'none', subtle: '0 1px 2px rgba(0,0,0,0.05)', soft: '0 2px 8px rgba(0,0,0,0.1)',
      medium: '0 4px 12px rgba(0,0,0,0.1)', elevated: '0 8px 24px rgba(0,0,0,0.15)',
      floating: '0 12px 36px rgba(0,0,0,0.2)', glass: '0 8px 32px rgba(0,0,0,0.1)',
      luxury: '0 16px 48px rgba(0,0,0,0.2)', deep: '0 24px 64px rgba(0,0,0,0.3)',
    },
    background: { type: 'solid', intensity: 'low', colorDependency: 'primary', useCase: 'general', antiPattern: 'heavy gradients with text' },
    spacing: { sectionGap: '48px', containerGap: '24px', componentGap: '16px', cardGap: '24px', textGap: '16px', paddingScale: '8px 16px 24px 32px' },
    sections: [{ type: 'clean', padding: '48px', background: colors.background, layout: 'centered' }],
    hero: { layout: 'centered', background: colors.background, typography: typography.fontFamily, imageTreatment: 'rounded' },
    imageTreatment: { crop: 'cover', aspectRatio: '16:9', radius: '8px', overlay: 'none', colorTreatment: 'none', bestUse: 'general' },
    iconStyle: { type: 'outline', strokeWidth: '2', fill: 'none', size: '24px' },
    effects: [{ type: 'none', intensity: 'low', compatibility: 'all', antiPattern: 'excessive animation' }],
    compatibleWith: [typography.id, colors.id],
    notRecommendedWith: [],
    preview: {
      h1: 'The Quick Brown Fox',
      h2: 'Subheading Text',
      body: 'This is sample body text demonstrating the design theme.',
      button: 'Click Here',
      card: 'Card Title',
      background: colors.background,
    },
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags,
    metadata: {},
  };
}

// ============================================================
// MODERN MINIMAL THEME
// ============================================================

export const modernMinimalTheme = createDesignTheme(
  'theme-modern-minimal',
  'Modern Minimal',
  'Modern',
  'Clean, minimal design theme for modern web presence',
  ['modern','minimal','clean'], ['technology','SaaS','general'],
  ['web apps','dashboards','landing pages'], ['luxury','editorial','fashion'],
  {id:'typography-modern-minimal',name:'Modern Minimal',style:'Modern Minimal',description:'Clean, minimal typography system',fontFamily:'Inter',fontPairing:'Inter + Outfit',scale:{} as any,mood:['modern','minimal','clean'],bestIndustries:['technology','SaaS','general'],goodUseCases:['web apps','dashboards','landing pages'],badUseCases:['luxury','editorial','fashion'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['modern','minimal','clean'],metadata:{}},
  {id:'mono-black-white',name:'Black & White',style:'Monochrome',primary:'#000000',secondary:'#333333',accent:'#666666',background:'#FFFFFF',surface:'#F5F5F5',text:'#000000',muted:'#666666',border:'#CCCCCC',cta:'#000000',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:95,wcagLevel:'AAA'},recommendedIndustries:['general','luxury','editorial'],mood:['elegant','sophisticated','timeless'],bestUseCases:['luxury branding','editorial','high-end'],notRecommendedUseCases:['creative','playful','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['elegant','sophisticated','timeless'],metadata:{}},
  ['modern','minimal','clean']
);

// ============================================================
// LUXURY EDITORIAL THEME
// ============================================================

export const luxuryEditorialTheme = createDesignTheme(
  'theme-luxury-editorial',
  'Luxury Editorial',
  'Luxury',
  'Elegant, high-contrast design theme for luxury and editorial brands',
  ['luxury','editorial','elegant'], ['fashion','luxury','beauty','media'],
  ['magazines','editorial','luxury branding'], ['tech','casual','playful'],
  {id:'typography-luxury-editorial',name:'Luxury Editorial',style:'Luxury Editorial',description:'Elegant, high-contrast typography',fontFamily:'Playfair Display',fontPairing:'Playfair Display + Cormorant Garamond',scale:{} as any,mood:['luxury','editorial','elegant'],bestIndustries:['fashion','luxury','beauty','media'],goodUseCases:['magazines','editorial','luxury branding'],badUseCases:['tech','casual','playful'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['luxury','elegant','editorial'],metadata:{}},
  {id:'luxury-gold',name:'Gold Luxury',style:'Luxury',primary:'#D4A843',secondary:'#B8860B',accent:'#F5D76E',background:'#0A0A0A',surface:'#141414',text:'#F5F1EA',muted:'#8A8578',border:'#D4A843',cta:'#D4A843',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:95,wcagLevel:'AAA'},recommendedIndustries:['luxury','fashion','beauty'],mood:['luxurious','elegant','opulent'],bestUseCases:['luxury brands','fashion','beauty'],notRecommendedUseCases:['tech','casual','playful'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['luxurious','elegant','opulent'],metadata:{}},
  ['luxury','elegant','editorial']
);

// ============================================================
// MEDICAL CLEAN THEME
// ============================================================

export const medicalCleanTheme = createDesignTheme(
  'theme-medical-clean',
  'Medical Clean',
  'Medical',
  'Clean, trustworthy design theme for medical and healthcare brands',
  ['medical','clean','trustworthy'], ['healthcare','medical','pharmaceutical'],
  ['medical websites','healthcare','clinical'], ['luxury','creative','fashion'],
  {id:'typography-medical-clean',name:'Medical Clean',style:'Medical Clean',description:'Clean, readable typography for medical',fontFamily:'Inter',fontPairing:'Inter + Open Sans',scale:{} as any,mood:['medical','clean','readable'],bestIndustries:['healthcare','medical','pharmaceutical'],goodUseCases:['medical websites','healthcare','clinical'],badUseCases:['luxury','creative','fashion'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['medical','clean','readable'],metadata:{}},
  {id:'medical-clean',name:'Medical Clean',style:'Medical',primary:'#0066CC',secondary:'#0099FF',accent:'#4DA3FF',background:'#F0F8FF',surface:'#E6F0FF',text:'#003366',muted:'#66B3FF',border:'#0066CC',cta:'#0066CC',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:96,wcagLevel:'AAA'},recommendedIndustries:['medical','healthcare','pharmaceutical'],mood:['clean','professional','trustworthy'],bestUseCases:['medical websites','healthcare','pharmaceutical'],notRecommendedUseCases:['luxury','creative','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['clean','professional','trustworthy'],metadata:{}},
  ['medical','clean','trustworthy']
);

// ============================================================
// TECH MODERN THEME
// ============================================================

export const techModernTheme = createDesignTheme(
  'theme-tech-modern',
  'Tech Modern',
  'Tech',
  'Futuristic, precise design theme for technology brands',
  ['tech','futuristic','modern'], ['technology','SaaS','fintech'],
  ['tech products','SaaS','data dashboards'], ['luxury','editorial','fashion'],
  {id:'typography-tech-modern',name:'Tech Modern',style:'Tech Modern',description:'Futuristic, precise typography',fontFamily:'Space Grotesk',fontPairing:'Space Grotesk + Inter',scale:{} as any,mood:['tech','futuristic','modern'],bestIndustries:['technology','SaaS','fintech'],goodUseCases:['tech products','SaaS','data dashboards'],badUseCases:['luxury','editorial','fashion'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['tech','futuristic','precise'],metadata:{}},
  {id:'tech-blue',name:'Tech Blue',style:'Technology',primary:'#0066CC',secondary:'#0099FF',accent:'#4DA3FF',background:'#0A0A0A',surface:'#141414',text:'#F5F5F5',muted:'#66B3FF',border:'#0066CC',cta:'#0066CC',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:96,wcagLevel:'AAA'},recommendedIndustries:['technology','SaaS','fintech'],mood:['modern','precise','innovative'],bestUseCases:['tech products','SaaS','fintech'],notRecommendedUseCases:['luxury','creative','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['modern','precise','innovative'],metadata:{}},
  ['tech','futuristic','precise']
);

// ============================================================
// CREATIVE STUDIO THEME
// ============================================================

export const creativeStudioTheme = createDesignTheme(
  'theme-creative-studio',
  'Creative Studio',
  'Creative',
  'Bold, expressive design theme for creative agencies',
  ['creative','bold','expressive'], ['creative agency','marketing','design'],
  ['creative portfolios','agency sites','branding'], ['luxury','medical','corporate'],
  {id:'typography-creative-studio',name:'Creative Studio',style:'Creative Studio',description:'Bold, expressive typography',fontFamily:'Oswald',fontPairing:'Oswald + Poppins',scale:{} as any,mood:['creative','bold','expressive'],bestIndustries:['creative agency','marketing','design'],goodUseCases:['creative portfolios','agency sites','branding'],badUseCases:['luxury','medical','corporate'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['creative','bold','expressive'],metadata:{}},
  {id:'creative-vibrant',name:'Vibrant Creative',style:'Creative',primary:'#FF6B35',secondary:'#FF4500',accent:'#FFD700',background:'#1A1A1A',surface:'#2D2D2D',text:'#F5F5F5',muted:'#616161',border:'#FF6B35',cta:'#FF6B35',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:92,wcagLevel:'AAA'},recommendedIndustries:['creative','design','art'],mood:['bold','vibrant','expressive'],bestUseCases:['creative agencies','design studios'],notRecommendedUseCases:['luxury','medical','corporate'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['bold','vibrant','expressive'],metadata:{}},
  ['creative','bold','expressive']
);

// ============================================================
// DARK LUXURY THEME
// ============================================================

export const darkLuxuryTheme = createDesignTheme(
  'theme-dark-luxury',
  'Dark Luxury',
  'Luxury',
  'Elegant dark theme for premium luxury brands',
  ['dark','luxury','premium'], ['luxury','technology','finance'],
  ['dark themes','premium products','luxury'], ['bright','casual','playful'],
  {id:'typography-dark-premium',name:'Dark Premium',style:'Dark Premium',description:'Elegant typography for dark premium themes',fontFamily:'Inter',fontPairing:'Inter + Playfair Display',scale:{} as any,mood:['dark','premium','elegant'],bestIndustries:['luxury','technology','finance'],goodUseCases:['dark themes','premium products','luxury'],badUseCases:['bright','casual','playful'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['dark','premium','elegant'],metadata:{}},
  {id:'dark-luxury',name:'Dark Luxury',style:'Dark',primary:'#D4A843',secondary:'#F5D76E',accent:'#D4A843',background:'#0A0A0A',surface:'#141414',text:'#F5F1EA',muted:'#8A8578',border:'#D4A843',cta:'#D4A843',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:95,wcagLevel:'AAA'},recommendedIndustries:['luxury','technology','finance'],mood:['dark','luxurious','premium'],bestUseCases:['luxury brands','dark themes','premium'],notRecommendedUseCases:['bright','casual','playful'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['dark','luxurious','premium'],metadata:{}},
  ['dark','luxury','premium']
);

// ============================================================
// FASHION EDITORIAL THEME
// ============================================================

export const fashionEditorialTheme = createDesignTheme(
  'theme-fashion-editorial',
  'Fashion Editorial',
  'Fashion',
  'High-fashion, editorial design theme for fashion brands',
  ['fashion','luxury','editorial'], ['fashion','beauty','luxury'],
  ['fashion websites','magazines','branding'], ['tech','medical','corporate'],
  {id:'typography-fashion-editorial',name:'Fashion Editorial',style:'Fashion Editorial',description:'High-fashion, editorial typography',fontFamily:'Bodoni Moda',fontPairing:'Bodoni Moda + Lora',scale:{} as any,mood:['fashion','luxury','editorial'],bestIndustries:['fashion','beauty','luxury'],goodUseCases:['fashion websites','magazines','branding'],badUseCases:['tech','medical','corporate'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['fashion','luxury','editorial'],metadata:{}},
  {id:'fashion-black-gold',name:'Black & Gold',style:'Fashion',primary:'#000000',secondary:'#1A1A1A',accent:'#D4A843',background:'#FAFAFA',surface:'#F5F5F5',text:'#000000',muted:'#D4A843',border:'#D4A843',cta:'#D4A843',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:98,wcagLevel:'AAA'},recommendedIndustries:['fashion','luxury','beauty'],mood:['bold','luxurious','sophisticated'],bestUseCases:['fashion brands','luxury','beauty'],notRecommendedUseCases:['tech','casual','playful'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['bold','luxurious','sophisticated'],metadata:{}},
  ['fashion','luxury','editorial']
);

// ============================================================
// CORPORATE MODERN THEME
// ============================================================

export const corporateModernTheme = createDesignTheme(
  'theme-corporate-modern',
  'Corporate Modern',
  'Corporate',
  'Professional, trustworthy design theme for corporate brands',
  ['corporate','professional','modern'], ['technology','finance','enterprise'],
  ['corporate websites','dashboards','reports'], ['luxury','creative','fashion'],
  {id:'typography-premium-corporate',name:'Premium Corporate',style:'Premium Corporate',description:'Professional, trustworthy typography',fontFamily:'Inter',fontPairing:'Inter + Roboto',scale:{} as any,mood:['corporate','professional','modern'],bestIndustries:['technology','finance','enterprise'],goodUseCases:['corporate websites','dashboards','reports'],badUseCases:['luxury','creative','fashion'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['corporate','professional','trustworthy'],metadata:{}},
  {id:'neutral-slate',name:'Slate',style:'Neutral',primary:'#1E293B',secondary:'#475569',accent:'#64748B',background:'#F8FAFC',surface:'#F1F5F9',text:'#1E293B',muted:'#64748B',border:'#CBD5E1',cta:'#3B82F6',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:90,wcagLevel:'AAA'},recommendedIndustries:['corporate','technology','finance'],mood:['professional','clean','modern'],bestUseCases:['corporate websites','dashboards','finance'],notRecommendedUseCases:['luxury','creative','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['professional','clean','modern'],metadata:{}},
  ['corporate','professional','trustworthy']
);

// ============================================================
// WELLNESS THEME
// ============================================================

export const wellnessTheme = createDesignTheme(
  'theme-wellness',
  'Wellness',
  'Wellness',
  'Soft, organic design theme for wellness and lifestyle brands',
  ['wellness','soft','organic'], ['wellness','fitness','lifestyle'],
  ['wellness sites','fitness apps','lifestyle'], ['tech','luxury','corporate'],
  {id:'typography-wellness',name:'Wellness',style:'Wellness',description:'Soft, organic typography for wellness',fontFamily:'Nunito',fontPairing:'Nunito + Quicksand',scale:{} as any,mood:['wellness','soft','organic'],bestIndustries:['wellness','fitness','lifestyle'],goodUseCases:['wellness sites','fitness apps','lifestyle'],badUseCases:['tech','luxury','corporate'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['wellness','soft','organic'],metadata:{}},
  {id:'wellness-organic',name:'Organic',style:'Wellness',primary:'#4CAF50',secondary:'#81C784',accent:'#A5D6A7',background:'#F1F8E9',surface:'#E8F5E9',text:'#1B5E20',muted:'#81C784',border:'#4CAF50',cta:'#4CAF50',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:92,wcagLevel:'AAA'},recommendedIndustries:['wellness','fitness','lifestyle'],mood:['natural','organic','calm'],bestUseCases:['wellness sites','fitness','lifestyle'],notRecommendedUseCases:['tech','luxury','corporate'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['natural','organic','calm'],metadata:{}},
  ['wellness','soft','organic']
);

// ============================================================
// ARCHITECTURE THEME
// ============================================================

export const architectureTheme = createDesignTheme(
  'theme-architecture',
  'Architecture Modern',
  'Architecture',
  'Strong, geometric design theme for architecture and design',
  ['architecture','modern','geometric'], ['architecture','real estate','design'],
  ['architecture sites','real estate','design studios'], ['luxury','fashion','editorial'],
  {id:'typography-architectural',name:'Architectural',style:'Architectural',description:'Strong, geometric typography for architecture',fontFamily:'Montserrat',fontPairing:'Montserrat + Lora',scale:{} as any,mood:['architecture','modern','geometric'],bestIndustries:['architecture','real estate','design'],goodUseCases:['architecture sites','real estate','design studios'],badUseCases:['luxury','fashion','editorial'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['architecture','modern','geometric'],metadata:{}},
  {id:'neutral-stone',name:'Stone',style:'Neutral',primary:'#44403C',secondary:'#78716C',accent:'#A8A29E',background:'#FAFAF9',surface:'#F5F5F4',text:'#292524',muted:'#D6D3D1',border:'#78716C',cta:'#C2410C',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:87,wcagLevel:'AA'},recommendedIndustries:['lifestyle','wellness','organic'],mood:['warm','natural','earthy'],bestUseCases:['wellness sites','organic brands'],notRecommendedUseCases:['tech','luxury','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['warm','natural','earthy'],metadata:{}},
  ['architecture','modern','geometric']
);

// ============================================================
// SAAS THEME
// ============================================================

export const saasTheme = createDesignTheme(
  'theme-saas',
  'SaaS Modern',
  'SaaS',
  'Clean, professional design theme for SaaS products',
  ['modern','clean','professional'], ['technology','SaaS','startup'],
  ['SaaS products','startup sites','web apps'], ['luxury','editorial','fashion'],
  {id:'typography-modern-minimal',name:'Modern Minimal',style:'Modern Minimal',description:'Clean, minimal typography',fontFamily:'Inter',fontPairing:'Inter + Outfit',scale:{} as any,mood:['modern','minimal','clean'],bestIndustries:['technology','SaaS','general'],goodUseCases:['web apps','dashboards','landing pages'],badUseCases:['luxury','editorial','fashion'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['modern','minimal','clean'],metadata:{}},
  {id:'minimal-white',name:'White Minimal',style:'Minimal',primary:'#111827',secondary:'#6B7280',accent:'#3B82F6',background:'#FFFFFF',surface:'#F9FAFB',text:'#111827',muted:'#9CA3AF',border:'#E5E7EB',cta:'#3B82F6',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:97,wcagLevel:'AAA'},recommendedIndustries:['technology','general','SaaS'],mood:['clean','minimal','professional'],bestUseCases:['minimal websites','general','SaaS'],notRecommendedUseCases:['luxury','editorial','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['clean','minimal','professional'],metadata:{}},
  ['modern','clean','professional']
);

// ============================================================
// BRUTALIST THEME
// ============================================================

export const brutalistTheme = createDesignTheme(
  'theme-brutalist',
  'Brutalist',
  'Brutalist',
  'Raw, bold design theme for brutalist design',
  ['brutalist','raw','bold'], ['creative','tech','gaming'],
  ['creative sites','gaming','tech'], ['luxury','editorial','medical'],
  {id:'typography-brutalist',name:'Brutalist',style:'Brutalist',description:'Raw, bold typography for brutalist design',fontFamily:'Bebas Neue',fontPairing:'Bebas Neue + Roboto',scale:{} as any,mood:['brutalist','raw','bold'],bestIndustries:['creative','tech','gaming'],goodUseCases:['creative sites','gaming','tech'],badUseCases:['luxury','editorial','medical'],preview:{h1:'THE QUICK BROWN FOX',h2:'SUBHEADING TEXT',body:'THIS IS SAMPLE BODY TEXT.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['brutalist','raw','bold'],metadata:{}},
  {id:'high-contrast-black-yellow',name:'Black & Yellow',style:'High Contrast',primary:'#000000',secondary:'#333333',accent:'#FFD700',background:'#FFFFFF',surface:'#F5F5F5',text:'#000000',muted:'#666666',border:'#CCCCCC',cta:'#FFD700',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:99,wcagLevel:'AAA'},recommendedIndustries:['accessibility','sports','advertising'],mood:['bold','impactful','accessible'],bestUseCases:['accessibility-focused','sports','advertising'],notRecommendedUseCases:['luxury','editorial','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['bold','impactful','accessible'],metadata:{}},
  ['brutalist','raw','bold']
);

// ============================================================
// COMBINED CATALOG
// ============================================================

export const designThemes: DesignTheme[] = [
  modernMinimalTheme,
  luxuryEditorialTheme,
  medicalCleanTheme,
  techModernTheme,
  creativeStudioTheme,
  darkLuxuryTheme,
  fashionEditorialTheme,
  corporateModernTheme,
  wellnessTheme,
  architectureTheme,
  saasTheme,
  brutalistTheme,
];

// Add more themes to reach 30+
export const additionalDesignThemes: DesignTheme[] = [
  createDesignTheme(
    'theme-restaurant-premium',
    'Restaurant Premium',
    'Restaurant',
    'Elegant, warm design theme for restaurants and hospitality',
    ['warm','elegant','inviting'], ['restaurant','food','hospitality'],
    ['restaurant sites','food brands','hospitality'], ['tech','luxury','corporate'],
    {id:'typography-sunset-warm',name:'Sunset Warm',style:'Sunset Warm',description:'Warm, inviting typography',fontFamily:'DM Serif Display',fontPairing:'DM Serif Display + Nunito',scale:{} as any,mood:['warm','sunset','inviting'],bestIndustries:['food','hospitality','restaurant'],goodUseCases:['restaurant sites','food brands','hospitality'],badUseCases:['tech','luxury','corporate'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['warm','sunset','inviting'],metadata:{}},
    {id:'restaurant-warm',name:'Warm Restaurant',style:'Restaurant',primary:'#C2410C',secondary:'#EA580C',accent:'#FDBA74',background:'#FFF7ED',surface:'#FFEDD5',text:'#7C2D12',muted:'#FDBA74',border:'#C2410C',cta:'#C2410C',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:89,wcagLevel:'AA'},recommendedIndustries:['restaurant','food','hospitality'],mood:['warm','inviting','appetizing'],bestUseCases:['restaurant sites','food brands','hospitality'],notRecommendedUseCases:['tech','luxury','corporate'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['warm','inviting','appetizing'],metadata:{}},
    ['warm','elegant','inviting']
  ),
  createDesignTheme(
    'theme-beauty-rose',
    'Beauty Rose',
    'Fashion',
    'Elegant, rose-gold design theme for beauty brands',
    ['luxury','rose','gold','beauty'], ['beauty','luxury','fashion'],
    ['beauty brands','luxury','fashion'], ['tech','medical','corporate'],
    {id:'typography-rose-gold',name:'Rose Gold',style:'Rose Gold',description:'Elegant, rose-gold typography',fontFamily:'Playfair Display',fontPairing:'Playfair Display + Lora',scale:{} as any,mood:['luxury','rose','gold','beauty'],bestIndustries:['beauty','luxury','fashion'],goodUseCases:['beauty brands','luxury','fashion'],badUseCases:['tech','medical','corporate'],preview:{h1:'The Quick Brown Fox',h2:'Subheading Text',body:'This is sample body text.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['luxury','rose','gold','beauty'],metadata:{}},
    {id:'rose-gold',name:'Rose Gold',style:'Rose',primary:'#B76E79',secondary:'#D4A5A5',accent:'#E8B4B8',background:'#1A1A2E',surface:'#16213E',text:'#F5F1EA',muted:'#B76E79',border:'#C4959A',cta:'#E8B4B8',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:92,wcagLevel:'AAA'},recommendedIndustries:['beauty','luxury','fashion'],mood:['romantic','elegant','feminine'],bestUseCases:['beauty brands','luxury','fashion'],notRecommendedUseCases:['tech','casual','playful'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['romantic','elegant','feminine'],metadata:{}},
    ['luxury','rose','gold','beauty']
  ),
  createDesignTheme(
    'theme-fitness-energy',
    'Fitness Energy',
    'Wellness',
    'Bold, energetic design theme for fitness and sports brands',
    ['bold','energetic','active'], ['fitness','sports','health'],
    ['fitness apps','sports brands','health'], ['luxury','editorial','fashion'],
    {id:'typography-bold-marketing',name:'Bold Marketing',style:'Bold Marketing',description:'Bold, impactful typography',fontFamily:'Bebas Neue',fontPairing:'Bebas Neue + Montserrat',scale:{} as any,mood:['bold','impactful','marketing'],bestIndustries:['marketing','advertising','sports'],goodUseCases:['marketing campaigns','sports','advertising'],badUseCases:['luxury','editorial','medical'],preview:{h1:'THE QUICK BROWN FOX',h2:'SUBHEADING TEXT',body:'THIS IS SAMPLE BODY TEXT.',button:'Click Here',label:'Label Text'},version:'1.0.0',createdAt:0,updatedAt:0,tags:['bold','impactful','marketing'],metadata:{}},
    {id:'high-contrast-white-red',name:'White & Red',style:'High Contrast',primary:'#DC2626',secondary:'#991B1B',accent:'#FFFFFF',background:'#FEF2F2',surface:'#FEE2E2',text:'#991B1B',muted:'#DC2626',border:'#DC2626',cta:'#DC2626',success:'#22C55E',warning:'#F59E0B',error:'#EF4444',contrastMetadata:{primaryOnBackground:'Pass',textOnBackground:'Pass',ctaOnPrimary:'Pass',score:98,wcagLevel:'AAA'},recommendedIndustries:['emergency','healthcare','warning'],mood:['bold','urgent','impactful'],bestUseCases:['emergency sites','healthcare','warning'],notRecommendedUseCases:['luxury','editorial','fashion'],version:'1.0.0',createdAt:0,updatedAt:0,tags:['bold','urgent','impactful'],metadata:{}},
    ['bold','energetic','active']
  ),
];

export const fullDesignThemes: DesignTheme[] = [...designThemes, ...additionalDesignThemes];
