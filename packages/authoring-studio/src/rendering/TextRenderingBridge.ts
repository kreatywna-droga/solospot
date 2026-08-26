/**
 * TextRenderingBridge.ts — Sprint S17 Text Rendering Bridge (ETAP 5)
 *
 * Bridges TextNode DTOs and Typography Engine layout metrics into render commands
 * for the existing RenderingEngine & CanvasRenderer.
 * Zero 2nd renderer, zero DOM-based renderer in domain.
 */

import { TextNode } from '../text/TextDomainModel';
import { TypographyEngine, TypographyLayoutMetrics } from '../text/TypographyEngine';

export interface TextRenderInstruction {
  readonly nodeId: string;
  readonly content: string;
  readonly bounds: { x: number; y: number; width: number; height: number };
  readonly rotationDeg: number;
  readonly style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fill: string;
    align: string;
    opacity: number;
  };
  readonly layoutMetrics: TypographyLayoutMetrics;
}

export class TextRenderingBridge {
  /**
   * Converts a TextNode into a pure render instruction payload for CanvasRenderer.
   */
  public static buildRenderInstruction(node: TextNode): TextRenderInstruction {
    const layoutMetrics = TypographyEngine.computeLayoutMetrics(node);

    return {
      nodeId: node.id,
      content: node.content,
      bounds: { ...node.bounds },
      rotationDeg: node.rotationDeg,
      style: {
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        fill: node.style.fill,
        align: node.style.align,
        opacity: node.style.opacity,
      },
      layoutMetrics,
    };
  }
}
