/**
 * SpriteSheets.ts — Sprint S10 Export Rendering
 *
 * Generates sprite sheet grid layout metadata and UV mapping coordinates.
 * Pure logic. NO DOM dependencies.
 */

export interface SpriteUVRect {
  readonly frameIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly uMin: number;
  readonly vMin: number;
  readonly uMax: number;
  readonly vMax: number;
}

export interface SpriteSheetMetadata {
  readonly columns: number;
  readonly rows: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly totalWidth: number;
  readonly totalHeight: number;
  readonly frameCount: number;
  readonly uvs: ReadonlyArray<SpriteUVRect>;
}

export class SpriteSheetGenerator {
  public static calculateMetadata(
    frameCount: number,
    frameWidth: number,
    frameHeight: number,
    maxColumns = 10
  ): SpriteSheetMetadata {
    const columns = Math.min(frameCount, maxColumns);
    const rows = Math.ceil(frameCount / columns);
    const totalWidth = columns * frameWidth;
    const totalHeight = rows * frameHeight;

    const uvs: SpriteUVRect[] = [];

    for (let i = 0; i < frameCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      const x = col * frameWidth;
      const y = row * frameHeight;

      uvs.push({
        frameIndex: i,
        x,
        y,
        width: frameWidth,
        height: frameHeight,
        uMin: x / totalWidth,
        vMin: y / totalHeight,
        uMax: (x + frameWidth) / totalWidth,
        vMax: (y + frameHeight) / totalHeight,
      });
    }

    return {
      columns,
      rows,
      frameWidth,
      frameHeight,
      totalWidth,
      totalHeight,
      frameCount,
      uvs,
    };
  }
}
