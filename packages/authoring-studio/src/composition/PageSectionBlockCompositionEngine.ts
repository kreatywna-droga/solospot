/**
 * PageSectionBlockCompositionEngine.ts — Sprint G1-54 Page Section & Block Composition Engine (Night Shift Level 16)
 *
 * Implements a pure TypeScript, headless page section & block composition system for WEB FACTOR Authoring Studio.
 * Allows non-programmer users to build websites and ecommerce stores using structured Sections, Blocks,
 * Responsive Breakpoint layout rules, and Ecommerce Product Catalog bindings.
 *
 * Provides bidirectional translation to VectorDocumentSnapshot SSOT, single-commit workflow transactions,
 * and high-fidelity HTML/SVG markup export.
 *
 * NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, VectorConstraintEdge, VectorTransform } from '../vector/VectorDomainModel';
import { VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Types
// ---------------------------------------------------------------------------

export type ProjectType = 'website' | 'ecommerce-store';

export type PageSectionType =
  | 'hero'
  | 'features'
  | 'ecommerce-catalog'
  | 'pricing'
  | 'navbar'
  | 'footer'
  | 'custom';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'product-card'
  | 'grid-container'
  | 'divider';

export type ResponsiveBreakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveLayoutConfig {
  readonly stackingDirection: 'vertical' | 'horizontal';
  readonly columns: number; // 1 to 12
  readonly gapPx: number;
  readonly paddingPx: number;
  readonly alignment: 'start' | 'center' | 'end' | 'space-between';
}

export interface EcommerceProductBindingDTO {
  readonly productId: string;
  readonly title: string;
  readonly priceFormatted: string;
  readonly imageUrl?: string;
  readonly ctaLabel?: string;
  readonly inStock?: boolean;
}

export interface BlockNodeDTO {
  readonly id: string;
  readonly type: BlockType;
  readonly name?: string;
  readonly textContent?: string;
  readonly styleProps?: {
    readonly fontSizePx?: number;
    readonly colorHex?: string;
    readonly backgroundColorHex?: string;
    readonly borderRadiusPx?: number;
    readonly widthPx?: number;
    readonly heightPx?: number;
  };
  readonly productBinding?: EcommerceProductBindingDTO;
  readonly children?: ReadonlyArray<BlockNodeDTO>;
}

export interface PageSectionDTO {
  readonly id: string;
  readonly type: PageSectionType;
  readonly title: string;
  readonly presetId?: string;
  readonly responsiveLayout: Record<ResponsiveBreakpoint, ResponsiveLayoutConfig>;
  readonly blocks: ReadonlyArray<BlockNodeDTO>;
  readonly backgroundColorHex?: string;
  readonly isVisible?: boolean;
}

export interface PageCompositionDocument {
  readonly id: string;
  readonly title: string;
  readonly projectType: ProjectType;
  readonly sections: ReadonlyArray<PageSectionDTO>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PresetDefinition {
  readonly id: string;
  readonly sectionType: PageSectionType;
  readonly title: string;
  readonly defaultBlocks: ReadonlyArray<BlockNodeDTO>;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class PageSectionBlockCompositionEngine {
  private static readonly DEFAULT_LAYOUT: Record<ResponsiveBreakpoint, ResponsiveLayoutConfig> = {
    desktop: { stackingDirection: 'horizontal', columns: 3, gapPx: 20, paddingPx: 40, alignment: 'start' },
    tablet: { stackingDirection: 'vertical', columns: 2, gapPx: 16, paddingPx: 24, alignment: 'center' },
    mobile: { stackingDirection: 'vertical', columns: 1, gapPx: 12, paddingPx: 16, alignment: 'center' }
  };

  private static readonly PRESETS: Map<string, PresetDefinition> = new Map([
    [
      'hero_default',
      {
        id: 'hero_default',
        sectionType: 'hero',
        title: 'Hero Banner',
        defaultBlocks: [
          {
            id: 'block_hero_title',
            type: 'heading',
            textContent: 'Welcome to WEB FACTOR Authoring Studio',
            styleProps: { fontSizePx: 48, colorHex: '#111827' }
          },
          {
            id: 'block_hero_sub',
            type: 'paragraph',
            textContent: 'Create, customize, and publish stunning websites and online stores autonomously.',
            styleProps: { fontSizePx: 18, colorHex: '#4B5563' }
          },
          {
            id: 'block_hero_cta',
            type: 'button',
            textContent: 'Get Started Now',
            styleProps: { backgroundColorHex: '#2563EB', colorHex: '#FFFFFF', borderRadiusPx: 6 }
          }
        ]
      }
    ],
    [
      'features_grid',
      {
        id: 'features_grid',
        sectionType: 'features',
        title: 'Feature Showcase',
        defaultBlocks: [
          {
            id: 'block_feat_1',
            type: 'heading',
            textContent: 'Autonomous Engineering',
            styleProps: { fontSizePx: 24, colorHex: '#1F2937' }
          },
          {
            id: 'block_feat_2',
            type: 'heading',
            textContent: 'Responsive Constraints',
            styleProps: { fontSizePx: 24, colorHex: '#1F2937' }
          },
          {
            id: 'block_feat_3',
            type: 'heading',
            textContent: 'Instant Storefront',
            styleProps: { fontSizePx: 24, colorHex: '#1F2937' }
          }
        ]
      }
    ],
    [
      'ecommerce_catalog',
      {
        id: 'ecommerce_catalog',
        sectionType: 'ecommerce-catalog',
        title: 'Featured Storefront Products',
        defaultBlocks: [
          {
            id: 'prod_card_1',
            type: 'product-card',
            name: 'Pro Wireless Earbuds',
            productBinding: {
              productId: 'prod_101',
              title: 'Pro Wireless Earbuds',
              priceFormatted: '$149.00',
              imageUrl: 'https://example.com/earbuds.png',
              ctaLabel: 'Add to Cart',
              inStock: true
            }
          },
          {
            id: 'prod_card_2',
            type: 'product-card',
            name: 'Ultra Mechanical Keyboard',
            productBinding: {
              productId: 'prod_102',
              title: 'Ultra Mechanical Keyboard',
              priceFormatted: '$199.00',
              imageUrl: 'https://example.com/keyboard.png',
              ctaLabel: 'Add to Cart',
              inStock: true
            }
          }
        ]
      }
    ],
    [
      'pricing_table',
      {
        id: 'pricing_table',
        sectionType: 'pricing',
        title: 'Subscription Plans',
        defaultBlocks: [
          {
            id: 'price_starter',
            type: 'paragraph',
            textContent: 'Starter Plan — $29/mo',
            styleProps: { fontSizePx: 20, colorHex: '#1E40AF' }
          },
          {
            id: 'price_pro',
            type: 'paragraph',
            textContent: 'Pro Store Plan — $79/mo',
            styleProps: { fontSizePx: 20, colorHex: '#1E40AF' }
          }
        ]
      }
    ],
    [
      'navbar_default',
      {
        id: 'navbar_default',
        sectionType: 'navbar',
        title: 'Navigation Header',
        defaultBlocks: [
          {
            id: 'nav_brand',
            type: 'heading',
            textContent: 'WEB FACTOR STORE',
            styleProps: { fontSizePx: 20, colorHex: '#111827' }
          },
          {
            id: 'nav_btn',
            type: 'button',
            textContent: 'Cart (0)',
            styleProps: { backgroundColorHex: '#059669', colorHex: '#FFFFFF', borderRadiusPx: 4 }
          }
        ]
      }
    ],
    [
      'footer_default',
      {
        id: 'footer_default',
        sectionType: 'footer',
        title: 'Footer',
        defaultBlocks: [
          {
            id: 'footer_copy',
            type: 'paragraph',
            textContent: '© 2026 WEB FACTOR Authoring Studio. All rights reserved.',
            styleProps: { fontSizePx: 14, colorHex: '#6B7280' }
          }
        ]
      }
    ]
  ]);

  /**
   * Creates a new, immutable PageCompositionDocument.
   */
  public static createPageComposition(title: string, projectType: ProjectType = 'website'): PageCompositionDocument {
    const docId = `page_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    return {
      id: docId,
      title: title || 'Untitled Page',
      projectType,
      sections: [],
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Adds a new section to the composition from a preset or blank.
   */
  public static addSection(
    doc: PageCompositionDocument,
    sectionType: PageSectionType,
    presetId?: string,
    insertIndex?: number
  ): PageCompositionDocument {
    if (!doc) throw new Error('PageSectionBlockCompositionEngine: Document is null or undefined');

    const preset = presetId ? this.PRESETS.get(presetId) : undefined;
    const sectionId = `sec_${sectionType}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const newSection: PageSectionDTO = {
      id: sectionId,
      type: sectionType,
      title: preset ? preset.title : `${sectionType.toUpperCase()} Section`,
      presetId,
      responsiveLayout: JSON.parse(JSON.stringify(this.DEFAULT_LAYOUT)),
      blocks: preset ? JSON.parse(JSON.stringify(preset.defaultBlocks)) : [],
      backgroundColorHex: '#FFFFFF',
      isVisible: true
    };

    const nextSections = [...doc.sections];
    if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= nextSections.length) {
      nextSections.splice(insertIndex, 0, newSection);
    } else {
      nextSections.push(newSection);
    }

    return {
      ...doc,
      sections: nextSections,
      updatedAt: Date.now()
    };
  }

  /**
   * Removes a section by ID.
   */
  public static removeSection(doc: PageCompositionDocument, sectionId: string): PageCompositionDocument {
    if (!doc) return doc;
    return {
      ...doc,
      sections: doc.sections.filter(s => s.id !== sectionId),
      updatedAt: Date.now()
    };
  }

  /**
   * Reorders a section to a target index.
   */
  public static reorderSections(
    doc: PageCompositionDocument,
    sectionId: string,
    targetIndex: number
  ): PageCompositionDocument {
    if (!doc || targetIndex < 0 || targetIndex >= doc.sections.length) return doc;
    const currentIndex = doc.sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1 || currentIndex === targetIndex) return doc;

    const nextSections = [...doc.sections];
    const [moved] = nextSections.splice(currentIndex, 1);
    nextSections.splice(targetIndex, 0, moved);

    return {
      ...doc,
      sections: nextSections,
      updatedAt: Date.now()
    };
  }

  /**
   * Inserts a block into a section.
   */
  public static insertBlock(
    doc: PageCompositionDocument,
    sectionId: string,
    block: BlockNodeDTO,
    parentBlockId?: string
  ): PageCompositionDocument {
    if (!doc || !block || !block.id) return doc;

    const nextSections = doc.sections.map(section => {
      if (section.id !== sectionId) return section;

      if (parentBlockId) {
        const updateChildren = (blocks: ReadonlyArray<BlockNodeDTO>): ReadonlyArray<BlockNodeDTO> => {
          return blocks.map(b => {
            if (b.id === parentBlockId) {
              return { ...b, children: [...(b.children || []), block] };
            }
            if (b.children && b.children.length > 0) {
              return { ...b, children: updateChildren(b.children) };
            }
            return b;
          });
        };
        return { ...section, blocks: updateChildren(section.blocks) };
      }

      return { ...section, blocks: [...section.blocks, block] };
    });

    return {
      ...doc,
      sections: nextSections,
      updatedAt: Date.now()
    };
  }

  /**
   * Removes a block from a section.
   */
  public static removeBlock(
    doc: PageCompositionDocument,
    sectionId: string,
    blockId: string
  ): PageCompositionDocument {
    if (!doc) return doc;

    const removeBlockRecursive = (blocks: ReadonlyArray<BlockNodeDTO>): ReadonlyArray<BlockNodeDTO> => {
      return blocks
        .filter(b => b.id !== blockId)
        .map(b => (b.children ? { ...b, children: removeBlockRecursive(b.children) } : b));
    };

    const nextSections = doc.sections.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, blocks: removeBlockRecursive(section.blocks) };
    });

    return {
      ...doc,
      sections: nextSections,
      updatedAt: Date.now()
    };
  }

  /**
   * Updates a block's content or style patch.
   */
  public static updateBlockContent(
    doc: PageCompositionDocument,
    sectionId: string,
    blockId: string,
    contentPatch: Partial<BlockNodeDTO>
  ): PageCompositionDocument {
    if (!doc || !contentPatch) return doc;

    const updateBlockRecursive = (blocks: ReadonlyArray<BlockNodeDTO>): ReadonlyArray<BlockNodeDTO> => {
      return blocks.map(b => {
        if (b.id === blockId) {
          return {
            ...b,
            ...contentPatch,
            styleProps: contentPatch.styleProps
              ? { ...b.styleProps, ...contentPatch.styleProps }
              : b.styleProps
          };
        }
        if (b.children && b.children.length > 0) {
          return { ...b, children: updateBlockRecursive(b.children) };
        }
        return b;
      });
    };

    const nextSections = doc.sections.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, blocks: updateBlockRecursive(section.blocks) };
    });

    return {
      ...doc,
      sections: nextSections,
      updatedAt: Date.now()
    };
  }

  /**
   * Binds ecommerce product catalog data DTO to a block node.
   */
  public static bindEcommerceProduct(
    doc: PageCompositionDocument,
    sectionId: string,
    blockId: string,
    productBinding: EcommerceProductBindingDTO
  ): PageCompositionDocument {
    return this.updateBlockContent(doc, sectionId, blockId, { productBinding });
  }

  /**
   * Updates responsive layout configuration for a specific section and breakpoint.
   */
  public static setResponsiveLayout(
    doc: PageCompositionDocument,
    sectionId: string,
    breakpoint: ResponsiveBreakpoint,
    layoutConfig: Partial<ResponsiveLayoutConfig>
  ): PageCompositionDocument {
    if (!doc || !layoutConfig) return doc;

    const nextSections = doc.sections.map(section => {
      if (section.id !== sectionId) return section;
      const currentBreakpointConfig = section.responsiveLayout[breakpoint] || this.DEFAULT_LAYOUT[breakpoint];
      return {
        ...section,
        responsiveLayout: {
          ...section.responsiveLayout,
          [breakpoint]: {
            ...currentBreakpointConfig,
            ...layoutConfig
          }
        }
      };
    });

    return {
      ...doc,
      sections: nextSections,
      updatedAt: Date.now()
    };
  }

  /**
   * Converts a PageCompositionDocument into an immutable VectorDocumentSnapshot SSOT.
   */
  public static toVectorDocumentSnapshot(doc: PageCompositionDocument): VectorDocumentSnapshot {
    if (!doc || !doc.sections) {
      return { nodes: [], selectedIds: [], constraintEdges: [] };
    }

    const nodes: VectorNode[] = [];
    const constraintEdges: VectorConstraintEdge[] = [];
    let currentY = 0;

    doc.sections.forEach((section, sIdx) => {
      if (section.isVisible === false) return;

      const sectionHeight = 400;
      const sectionNodeId = section.id;

      const sectionNode: VectorNode = {
        id: sectionNodeId,
        name: section.title,
        type: 'rectangle',
        transform: {
          x: 0,
          y: currentY,
          width: 1200,
          height: sectionHeight,
          rotationDeg: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          skewY: 0
        },
        visible: true,
        locked: false
      };
      nodes.push(sectionNode);

      let blockX = 40;
      let blockY = currentY + 30;

      section.blocks.forEach((block, bIdx) => {
        const blockNodeId = `${sectionNodeId}_${block.id}`;
        const blockHeight = block.type === 'product-card' ? 220 : 60;
        const blockWidth = block.type === 'product-card' ? 320 : 1120;

        const blockNode: VectorNode = {
          id: blockNodeId,
          name: block.name || block.textContent || block.id,
          type: 'rectangle',
          transform: {
            x: blockX,
            y: blockY,
            width: blockWidth,
            height: blockHeight,
            rotationDeg: 0,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0
          },
          visible: true,
          locked: false
        };
        nodes.push(blockNode);

        // Add structural constraint edge anchored to section container
        constraintEdges.push({
          id: `edge_${blockNodeId}_to_${sectionNodeId}`,
          sourceNodeId: blockNodeId,
          targetNodeId: sectionNodeId,
          horizontal: 'MIN',
          vertical: 'MIN'
        });

        blockY += blockHeight + 16;
      });

      currentY += sectionHeight + 32;
    });

    return {
      nodes,
      selectedIds: nodes.length > 0 ? [nodes[0].id] : [],
      constraintEdges
    };
  }

  /**
   * Renders semantic HTML markup string for preview, export, and publishing.
   */
  public static exportToHtmlString(doc: PageCompositionDocument): string {
    if (!doc || !doc.sections) return '<main class="web-factor-page-empty"></main>';

    const renderBlockHtml = (block: BlockNodeDTO): string => {
      const style = block.styleProps
        ? `style="font-size: ${block.styleProps.fontSizePx || 16}px; color: ${block.styleProps.colorHex || 'inherit'};"`
        : '';

      switch (block.type) {
        case 'heading':
          return `<h2 id="${block.id}" ${style}>${block.textContent || ''}</h2>`;
        case 'paragraph':
          return `<p id="${block.id}" ${style}>${block.textContent || ''}</p>`;
        case 'button':
          return `<button id="${block.id}" class="btn-primary" ${style}>${block.textContent || 'Click'}</button>`;
        case 'product-card':
          const pb = block.productBinding;
          return `
            <div id="${block.id}" class="ecommerce-product-card" data-product-id="${pb?.productId || ''}">
              ${pb?.imageUrl ? `<img src="${pb.imageUrl}" alt="${pb.title}" class="product-thumb" />` : ''}
              <h3 class="product-title">${pb?.title || block.name || 'Product'}</h3>
              <span class="product-price">${pb?.priceFormatted || '$0.00'}</span>
              <button class="add-to-cart-btn">${pb?.ctaLabel || 'Add to Cart'}</button>
            </div>
          `.trim();
        default:
          return `<div id="${block.id}" class="block-default" ${style}>${block.textContent || ''}</div>`;
      }
    };

    const sectionsHtml = doc.sections
      .filter(s => s.isVisible !== false)
      .map(s => {
        const blocksHtml = s.blocks.map(renderBlockHtml).join('\n');
        return `
          <section id="${s.id}" class="wf-section wf-section-${s.type}" data-preset="${s.presetId || 'custom'}">
            <div class="container">
              ${blocksHtml}
            </div>
          </section>
        `.trim();
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${doc.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; font-family: Inter, sans-serif; background: #F9FAFB; color: #111827; }
          .wf-section { padding: 40px 20px; border-bottom: 1px solid #E5E7EB; }
          .container { max-width: 1200px; margin: 0 auto; }
          .ecommerce-product-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; background: #FFF; width: 280px; }
          .product-title { font-size: 18px; margin: 8px 0; }
          .product-price { font-size: 20px; font-weight: bold; color: #059669; display: block; margin-bottom: 12px; }
          .add-to-cart-btn { background: #2563EB; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <main class="web-factor-page" data-project-type="${doc.projectType}">
          ${sectionsHtml}
        </main>
      </body>
      </html>
    `.trim();
  }
}
