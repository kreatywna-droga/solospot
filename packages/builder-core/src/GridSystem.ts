// GridSystem.ts
// C7: Builder Pro — Grid snapping, guide lines, measurements

import { GridConfig, DEFAULT_GRID_CONFIG, SnapResult } from './CanvasState';

export interface SnapInput {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly containerWidth: number;
}

export class GridSystem {
  private readonly config: GridConfig;

  constructor(config: Partial<GridConfig> = {}) {
    this.config = { ...DEFAULT_GRID_CONFIG, ...config };
  }

  public updateConfig(config: Partial<GridConfig>): void {
    const updated = { ...this.config, ...config };
    (this as any).config = updated;
  }

  public getConfig(): GridConfig {
    return this.config;
  }

  public snap(input: SnapInput): SnapResult {
    if (!this.config.snapToGrid) {
      return { x: input.x, y: input.y, snapped: false, guides: [] };
    }

    const columnWidth = this.calculateColumnWidth(input.containerWidth);
    const gutter = this.config.gutter;
    const margin = this.config.margin;

    const snappedX = Math.round((input.x - margin) / (columnWidth + gutter)) * (columnWidth + gutter) + margin;
    const snappedY = Math.round(input.y / this.config.gutter) * this.config.gutter;

    const guides = this.computeGuides(input, snappedX, snappedY, columnWidth);

    return {
      x: snappedX,
      y: snappedY,
      snapped: snappedX !== input.x || snappedY !== input.y,
      guides,
    };
  }

  public snapToElement(
    input: SnapInput,
    elementBounds: { x: number; y: number; width: number; height: number }
  ): SnapResult {
    const threshold = 8;
    const guides: Array<{ axis: 'x' | 'y'; position: number }> = [];

    let x = input.x;
    let y = input.y;
    let snapped = false;

    const elementCenterX = elementBounds.x + elementBounds.width / 2;
    const elementRight = elementBounds.x + elementBounds.width;
    const inputCenterX = input.x + input.width / 2;
    const inputRight = input.x + input.width;

    if (Math.abs(inputCenterX - elementCenterX) < threshold) {
      x = elementCenterX - input.width / 2;
      snapped = true;
      guides.push({ axis: 'x', position: elementCenterX });
    } else if (Math.abs(input.x - elementBounds.x) < threshold) {
      x = elementBounds.x;
      snapped = true;
      guides.push({ axis: 'x', position: elementBounds.x });
    } else if (Math.abs(inputRight - elementRight) < threshold) {
      x = elementRight - input.width;
      snapped = true;
      guides.push({ axis: 'x', position: elementRight });
    } else if (Math.abs(inputCenterX - elementCenterX) < threshold) {
      x = elementCenterX - input.width / 2;
      snapped = true;
      guides.push({ axis: 'x', position: elementCenterX });
    }

    if (Math.abs(input.y - elementBounds.y) < threshold) {
      y = elementBounds.y;
      snapped = true;
      guides.push({ axis: 'y', position: elementBounds.y });
    } else if (Math.abs(input.y + input.height - elementBounds.y + elementBounds.height) < threshold) {
      y = elementBounds.y + elementBounds.height - input.height;
      snapped = true;
      guides.push({ axis: 'y', position: elementBounds.y + elementBounds.height });
    } else if (Math.abs(input.y + input.height / 2 - (elementBounds.y + elementBounds.height / 2)) < threshold) {
      y = elementBounds.y + elementBounds.height / 2 - input.height / 2;
      snapped = true;
      guides.push({ axis: 'y', position: elementBounds.y + elementBounds.height / 2 });
    }

    return { x, y, snapped, guides };
  }

  public toggleVisibility(): GridConfig {
    return { ...this.config, showGuides: !this.config.showGuides };
  }

  private calculateColumnWidth(containerWidth: number): number {
    const totalGutter = this.config.gutter * (this.config.columns - 1);
    const totalMargin = this.config.margin * 2;
    return (containerWidth - totalMargin - totalGutter) / this.config.columns;
  }

  private computeGuides(
    input: SnapInput,
    snappedX: number,
    snappedY: number,
    columnWidth: number
  ): Array<{ axis: 'x' | 'y'; position: number }> {
    const guides: Array<{ axis: 'x' | 'y'; position: number }> = [];

    if (!this.config.showGuides) {
      return guides;
    }

    const centerX = snappedX + input.width / 2;
    const centerY = snappedY + input.height / 2;

    for (let i = 0; i < this.config.columns; i++) {
      const colX = this.config.margin + i * (columnWidth + this.config.gutter);
      const colCenterX = colX + columnWidth / 2;

      if (Math.abs(centerX - colCenterX) < 1) {
        guides.push({ axis: 'x', position: colCenterX });
      }
    }

    if (snappedY === 0) {
      guides.push({ axis: 'y', position: 0 });
    }

    return guides;
  }
}
