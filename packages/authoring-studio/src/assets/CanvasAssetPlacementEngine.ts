/**
 * CanvasAssetPlacementEngine.ts — Sprint S15 Canvas Asset Placement Engine (ETAP 3)
 *
 * Provides operations to place, replace, scale, crop, fit, and duplicate media assets on Canvas.
 * Generates nodes referencing AssetIDs without duplicating binary data inside BuilderDocument.
 */

import { AssetReferenceState, bindAssetReference } from './AnimationAssetReference';

export type FrameFitMode = 'contain' | 'cover' | 'fill' | 'none';

export interface CropBounds {
  readonly cropX: number;
  readonly cropY: number;
  readonly cropWidth: number;
  readonly cropHeight: number;
}

export interface CanvasAssetNodePlacement {
  readonly nodeId: string;
  readonly assetId: string;
  readonly type: 'image' | 'svg' | 'video' | 'audio';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fitMode: FrameFitMode;
  readonly crop?: CropBounds;
  readonly opacity: number;
}

export class CanvasAssetPlacementEngine {
  /**
   * Creates a new canvas node placement referencing an AssetID.
   */
  public static createPlacement(
    assetId: string,
    type: 'image' | 'svg' | 'video' | 'audio',
    x: number = 100,
    y: number = 100,
    width: number = 300,
    height: number = 200,
    fitMode: FrameFitMode = 'cover'
  ): { placement: CanvasAssetNodePlacement; linkState: AssetReferenceState } {
    const nodeId = `node_asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const placement: CanvasAssetNodePlacement = {
      nodeId,
      assetId,
      type,
      x,
      y,
      width,
      height,
      fitMode,
      opacity: 1.0,
    };

    const linkState = bindAssetReference(
      { links: [] },
      assetId,
      'BuilderDocumentNode',
      nodeId,
      'assetId'
    );

    return { placement, linkState };
  }

  /**
   * Replaces the assetId reference on an existing node placement while keeping layout transform.
   */
  public static replaceAsset(
    placement: CanvasAssetNodePlacement,
    newAssetId: string
  ): CanvasAssetNodePlacement {
    return {
      ...placement,
      assetId: newAssetId,
    };
  }

  /**
   * Scales a node placement with optional aspect ratio preservation.
   */
  public static scalePlacement(
    placement: CanvasAssetNodePlacement,
    newWidth: number,
    newHeight: number,
    lockAspectRatio: boolean = true
  ): CanvasAssetNodePlacement {
    if (lockAspectRatio && placement.width > 0) {
      const aspectRatio = placement.height / placement.width;
      return {
        ...placement,
        width: newWidth,
        height: Math.round(newWidth * aspectRatio),
      };
    }

    return {
      ...placement,
      width: newWidth,
      height: newHeight,
    };
  }

  /**
   * Updates crop bounds for an asset placement.
   */
  public static cropPlacement(
    placement: CanvasAssetNodePlacement,
    crop: CropBounds
  ): CanvasAssetNodePlacement {
    return {
      ...placement,
      crop,
    };
  }

  /**
   * Adjusts frame fit mode ('contain', 'cover', 'fill', 'none').
   */
  public static setFitMode(
    placement: CanvasAssetNodePlacement,
    fitMode: FrameFitMode
  ): CanvasAssetNodePlacement {
    return {
      ...placement,
      fitMode,
    };
  }

  /**
   * Duplicates an existing asset node placement.
   */
  public static duplicatePlacement(
    placement: CanvasAssetNodePlacement,
    offsetX: number = 20,
    offsetY: number = 20
  ): CanvasAssetNodePlacement {
    return {
      ...placement,
      nodeId: `node_asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: placement.x + offsetX,
      y: placement.y + offsetY,
    };
  }
}
