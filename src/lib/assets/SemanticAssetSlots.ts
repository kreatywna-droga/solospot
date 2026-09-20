/**
 * SemanticAssetSlots.ts
 *
 * Defines canonical semantic asset slots and provides a recursive scanner
 * for BuilderNode trees to detect placeholders and match them with appropriate
 * asset requirements (category, mood, style, orientation).
 */

import type { BuilderNode } from '../../../packages/builder-core/src';
import type {
  VisualAssetCategory,
  VisualAssetMood,
  VisualAssetStyle,
  AssetOrientation,
} from './AssetTypes';

export type CanonicalSlotType =
  | 'HERO_PRIMARY_IMAGE'
  | 'HERO_BACKGROUND_IMAGE'
  | 'HERO_BACKGROUND_VIDEO'
  | 'FEATURE_IMAGE_01'
  | 'FEATURE_IMAGE_02'
  | 'FEATURE_IMAGE_03'
  | 'PRODUCT_MAIN'
  | 'PRODUCT_SECONDARY_01'
  | 'PRODUCT_SECONDARY_02'
  | 'PRODUCT_SECONDARY_03'
  | 'PORTFOLIO_IMAGE_01'
  | 'PORTFOLIO_IMAGE_02'
  | 'PORTFOLIO_IMAGE_03'
  | 'PORTFOLIO_IMAGE_04'
  | 'PORTFOLIO_IMAGE_05'
  | 'PORTFOLIO_IMAGE_06'
  | 'TEAM_PORTRAIT_01'
  | 'TEAM_PORTRAIT_02'
  | 'TEAM_PORTRAIT_03'
  | 'TEAM_PORTRAIT_04'
  | 'TESTIMONIAL_AVATAR_01'
  | 'TESTIMONIAL_AVATAR_02'
  | 'TESTIMONIAL_AVATAR_03'
  | 'GALLERY_IMAGE_01'
  | 'GALLERY_IMAGE_02'
  | 'GALLERY_IMAGE_03'
  | 'GALLERY_IMAGE_04'
  | 'GALLERY_IMAGE_05'
  | 'GALLERY_IMAGE_06'
  | 'GALLERY_IMAGE_07'
  | 'GALLERY_IMAGE_08'
  | 'CTA_BACKGROUND_IMAGE'
  | 'FOOTER_BACKGROUND_IMAGE'
  | 'GENERAL_IMAGE';

export interface SemanticAssetSlot {
  slotId: string;
  canonicalType: CanonicalSlotType;
  nodeId: string;
  nodeType: string;
  targetProperty: 'src' | 'backgroundImage' | 'videoUrl' | 'backgroundVideo';
  categoryRequirement: VisualAssetCategory;
  preferredOrientation: AssetOrientation;
  recommendedStyle?: VisualAssetStyle;
  recommendedMood?: VisualAssetMood;
  description: string;
  currentValue?: string;
  isFilled: boolean;
  isPlaceholder: boolean;
}

/**
 * Determines whether a given URL is empty, missing, or an obvious placeholder
 */
export function isPlaceholderUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === '' || trimmed === '#' || trimmed === 'none') return true;
  if (trimmed.includes('via.placeholder.com')) return true;
  if (trimmed.includes('placeholder')) return true;
  if (trimmed.includes('dummyimage.com')) return true;
  if (trimmed.includes('example.com')) return true;
  return false;
}

/**
 * Extracts URL from CSS `url(...)` declaration if present
 */
export function extractCssUrl(cssValue: string | undefined | null): string | undefined {
  if (!cssValue || typeof cssValue !== 'string') return undefined;
  const match = cssValue.match(/url\(["']?([^"')]+)["']?\)/i);
  return match ? match[1].trim() : cssValue.trim();
}

interface ScanContext {
  teamCounter: number;
  testimonialCounter: number;
  productCounter: number;
  featureCounter: number;
  galleryCounter: number;
  portfolioCounter: number;
  generalCounter: number;
}

/**
 * Recursively scans a BuilderNode tree and extracts all visual asset slots
 */
export function scanNodeForAssetSlots(rootNode: BuilderNode): SemanticAssetSlot[] {
  const slots: SemanticAssetSlot[] = [];
  const ctx: ScanContext = {
    teamCounter: 0,
    testimonialCounter: 0,
    productCounter: 0,
    featureCounter: 0,
    galleryCounter: 0,
    portfolioCounter: 0,
    generalCounter: 0,
  };

  function traverse(node: BuilderNode, ancestors: string[]) {
    if (!node) return;

    const currentContext = [...ancestors, (node.label || '').toLowerCase(), (node.id || '').toLowerCase()];
    const contextStr = currentContext.join(' ');

    // 1. Check Image Nodes
    if (node.type === 'image') {
      const src = (node.props?.src as string) || '';
      const isPlaceholder = isPlaceholderUrl(src);
      const isFilled = !isPlaceholder;

      let canonicalType: CanonicalSlotType = 'GENERAL_IMAGE';
      let category: VisualAssetCategory = 'creative';
      let orientation: AssetOrientation = 'landscape';
      let desc = 'General Content Image';

      if (contextStr.includes('hero') || contextStr.includes('header')) {
        canonicalType = 'HERO_PRIMARY_IMAGE';
        category = 'tech';
        orientation = 'landscape';
        desc = 'Hero Primary Showcase Image';
      } else if (contextStr.includes('team') || contextStr.includes('member') || contextStr.includes('founder') || contextStr.includes('staff')) {
        ctx.teamCounter++;
        const num = String(ctx.teamCounter).padStart(2, '0');
        canonicalType = `TEAM_PORTRAIT_${num}` as CanonicalSlotType;
        category = 'people';
        orientation = 'portrait';
        desc = `Team Member Portrait #${ctx.teamCounter}`;
      } else if (contextStr.includes('testimonial') || contextStr.includes('review') || contextStr.includes('avatar') || contextStr.includes('client')) {
        ctx.testimonialCounter++;
        const num = String(ctx.testimonialCounter).padStart(2, '0');
        canonicalType = `TESTIMONIAL_AVATAR_${num}` as CanonicalSlotType;
        category = 'people';
        orientation = 'square';
        desc = `Client Testimonial Avatar #${ctx.testimonialCounter}`;
      } else if (contextStr.includes('product') || contextStr.includes('item') || contextStr.includes('shop') || contextStr.includes('store') || contextStr.includes('pricing')) {
        ctx.productCounter++;
        if (ctx.productCounter === 1) {
          canonicalType = 'PRODUCT_MAIN';
          desc = 'Primary Product Visual';
        } else {
          const num = String(ctx.productCounter - 1).padStart(2, '0');
          canonicalType = `PRODUCT_SECONDARY_${num}` as CanonicalSlotType;
          desc = `Secondary Product Showcase #${ctx.productCounter}`;
        }
        category = 'product';
        orientation = 'square';
      } else if (contextStr.includes('gallery') || contextStr.includes('masonry') || contextStr.includes('collage')) {
        ctx.galleryCounter++;
        const num = String(ctx.galleryCounter).padStart(2, '0');
        canonicalType = `GALLERY_IMAGE_${num}` as CanonicalSlotType;
        category = 'creative';
        orientation = 'landscape';
        desc = `Gallery Showcase #${ctx.galleryCounter}`;
      } else if (contextStr.includes('portfolio') || contextStr.includes('work') || contextStr.includes('case')) {
        ctx.portfolioCounter++;
        const num = String(ctx.portfolioCounter).padStart(2, '0');
        canonicalType = `PORTFOLIO_IMAGE_${num}` as CanonicalSlotType;
        category = 'creative';
        orientation = 'landscape';
        desc = `Portfolio Project #${ctx.portfolioCounter}`;
      } else if (contextStr.includes('feature') || contextStr.includes('benefit') || contextStr.includes('service')) {
        ctx.featureCounter++;
        const num = String(ctx.featureCounter).padStart(2, '0');
        canonicalType = `FEATURE_IMAGE_${num}` as CanonicalSlotType;
        category = 'tech';
        orientation = 'landscape';
        desc = `Feature Highlight #${ctx.featureCounter}`;
      } else {
        ctx.generalCounter++;
        canonicalType = 'GENERAL_IMAGE';
        category = 'creative';
        orientation = 'landscape';
        desc = `Section Image #${ctx.generalCounter}`;
      }

      slots.push({
        slotId: `${node.id}-${canonicalType}`,
        canonicalType,
        nodeId: node.id,
        nodeType: 'image',
        targetProperty: 'src',
        categoryRequirement: category,
        preferredOrientation: orientation,
        description: desc,
        currentValue: src,
        isFilled,
        isPlaceholder,
      });
    }

    // 2. Check Background Images in styles
    if (node.styles?.backgroundImage) {
      const rawBg = node.styles.backgroundImage as string;
      const extractedUrl = extractCssUrl(rawBg);
      const isPlaceholder = isPlaceholderUrl(extractedUrl);
      const isFilled = !isPlaceholder;

      let canonicalType: CanonicalSlotType = 'HERO_BACKGROUND_IMAGE';
      let desc = 'Hero Background Image';

      if (contextStr.includes('cta')) {
        canonicalType = 'CTA_BACKGROUND_IMAGE';
        desc = 'Call to Action Background';
      } else if (contextStr.includes('footer')) {
        canonicalType = 'FOOTER_BACKGROUND_IMAGE';
        desc = 'Footer Ambient Background';
      } else if (!contextStr.includes('hero') && !contextStr.includes('header')) {
        canonicalType = 'GENERAL_IMAGE';
        desc = 'Section Background';
      }

      slots.push({
        slotId: `${node.id}-bg`,
        canonicalType,
        nodeId: node.id,
        nodeType: node.type,
        targetProperty: 'backgroundImage',
        categoryRequirement: 'background',
        preferredOrientation: 'landscape',
        description: desc,
        currentValue: extractedUrl,
        isFilled,
        isPlaceholder,
      });
    }

    // 3. Check Video Nodes or Background Video props
    if (node.type === 'video' || node.props?.backgroundVideo || (node.props?.videoUrl as string)) {
      const videoSrc = (node.props?.videoUrl as string) || (node.props?.src as string) || (node.props?.backgroundVideo as string) || '';
      const isPlaceholder = isPlaceholderUrl(videoSrc);
      const isFilled = !isPlaceholder;

      slots.push({
        slotId: `${node.id}-video`,
        canonicalType: 'HERO_BACKGROUND_VIDEO',
        nodeId: node.id,
        nodeType: node.type,
        targetProperty: node.props?.backgroundVideo ? 'backgroundVideo' : 'videoUrl',
        categoryRequirement: 'video',
        preferredOrientation: 'landscape',
        description: 'Ambient Background Video',
        currentValue: videoSrc,
        isFilled,
        isPlaceholder,
      });
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child, currentContext);
      }
    }
  }

  traverse(rootNode, []);
  return slots;
}

/**
 * Batch scans multiple root/section nodes
 */
export function scanNodesForAssetSlots(nodes: BuilderNode[]): SemanticAssetSlot[] {
  const allSlots: SemanticAssetSlot[] = [];
  for (const node of nodes) {
    allSlots.push(...scanNodeForAssetSlots(node));
  }
  return allSlots;
}
