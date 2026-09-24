/**
 * Builder Integration — BuilderDocument Style Application
 *
 * Provides integration with BuilderDocument for style application.
 */

import type { StyleApplicationResult, StyleApplicationOptions } from '../types';

export interface BuilderIntegration {
  applyStylePack(stylePackId: string, documentId: string, options?: Record<string, unknown>): StyleApplicationResult;
  switchStylePack(oldPackId: string, newPackId: string, documentId: string): StyleApplicationResult;
  previewStylePack(stylePackId: string): unknown;
  getAppliedStyles(documentId: string): string[];
}

export function createBuilderIntegration(
  stylePacks: any[],
  designThemes: any[]
): BuilderIntegration {
  return {
    applyStylePack(stylePackId: string, documentId: string, options: Record<string, unknown> = {}): StyleApplicationResult {
      const pack = stylePacks.find((p: any) => p.id === stylePackId);
      if (!pack) {
        return {
          success: false,
          applied: [],
          skipped: [],
          conflicts: [],
          warnings: [`Style pack ${stylePackId} not found`],
        };
      }

      const applied: string[] = [];
      const skipped: string[] = [];
      const conflicts: StyleApplicationResult['conflicts'] = [];

      // Apply typography
      if (pack.typographyId && (!options.applyTo || (options.applyTo as string[]).includes('typography'))) {
        applied.push('typography');
      } else {
        skipped.push('typography');
      }

      // Apply colors
      if (pack.colorPaletteId && (!options.applyTo || (options.applyTo as string[]).includes('colors'))) {
        applied.push('colors');
      } else {
        skipped.push('colors');
      }

      // Apply buttons
      if (pack.buttonSystemId && (!options.applyTo || (options.applyTo as string[]).includes('buttons'))) {
        applied.push('buttons');
      } else {
        skipped.push('buttons');
      }

      // Apply cards
      if (pack.cardSystemId && (!options.applyTo || (options.applyTo as string[]).includes('cards'))) {
        applied.push('cards');
      } else {
        skipped.push('cards');
      }

      // Apply radius
      if (pack.radiusId && (!options.applyTo || (options.applyTo as string[]).includes('radius'))) {
        applied.push('radius');
      } else {
        skipped.push('radius');
      }

      // Apply shadows
      if (pack.shadowId && (!options.applyTo || (options.applyTo as string[]).includes('shadows'))) {
        applied.push('shadows');
      } else {
        skipped.push('shadows');
      }

      // Apply background
      if (pack.backgroundId && (!options.applyTo || (options.applyTo as string[]).includes('background'))) {
        applied.push('background');
      } else {
        skipped.push('background');
      }

      // Apply spacing
      if (pack.spacingId && (!options.applyTo || (options.applyTo as string[]).includes('spacing'))) {
        applied.push('spacing');
      } else {
        skipped.push('spacing');
      }

      return {
        success: true,
        applied,
        skipped,
        conflicts,
        warnings: [],
      };
    },
    switchStylePack(oldPackId: string, newPackId: string, documentId: string): StyleApplicationResult {
      const result = this.applyStylePack(newPackId, documentId);
      return {
        ...result,
        success: true,
        warnings: [...result.warnings, `Switched from ${oldPackId} to ${newPackId}`],
      };
    },
    previewStylePack(stylePackId: string): unknown {
      const pack = stylePacks.find((p: any) => p.id === stylePackId);
      return pack ? pack.preview : null;
    },
    getAppliedStyles(documentId: string): string[] {
      return [];
    },
  };
}

export function applyStyleToBuilderDocument(
  stylePackId: string,
  documentId: string,
  builderIntegration: BuilderIntegration,
  options?: StyleApplicationOptions
): StyleApplicationResult {
  const result = builderIntegration.applyStylePack(
    stylePackId,
    documentId,
    options as Record<string, unknown> | undefined
  );

  if (options?.previewOnly) {
    return {
      ...result,
      success: true,
      warnings: [...result.warnings, 'Preview only - no changes applied'],
    };
  }

  return result;
}

export default createBuilderIntegration([], []);
