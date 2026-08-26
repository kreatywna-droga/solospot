/**
 * DesignTokens.ts — Sprint S2 Design Tokens (Theme System)
 *
 * Studio design tokens for typography, spacing, radius, and shadows.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface StudioDesignTokens {
  readonly fontFamilySans: string;
  readonly fontFamilyMono: string;
  readonly fontSizeSm: string;
  readonly fontSizeMd: string;
  readonly fontSizeLg: string;
  readonly spacingXs: string;
  readonly spacingSm: string;
  readonly spacingMd: string;
  readonly spacingLg: string;
  readonly borderRadiusSm: string;
  readonly borderRadiusMd: string;
  readonly shadowSm: string;
  readonly shadowMd: string;
}

export const STANDARD_DESIGN_TOKENS: StudioDesignTokens = {
  fontFamilySans: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMono: 'JetBrains Mono, Menlo, monospace',
  fontSizeSm: '12px',
  fontSizeMd: '14px',
  fontSizeLg: '16px',
  spacingXs: '4px',
  spacingSm: '8px',
  spacingMd: '16px',
  spacingLg: '24px',
  borderRadiusSm: '4px',
  borderRadiusMd: '8px',
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};
