/**
 * TypographyEngine.ts — Sprint S17 Typography Engine (ETAP 2)
 *
 * Pure headless text layout & metrics calculation engine:
 * - Line breaking & word wrapping algorithms
 * - Text line metrics (ascent, descent, baseline, height)
 * - Horizontal alignment offset calculation
 * - Bounding box computation & character spacing
 *
 * ZERO DOM, ZERO Canvas API, ZERO browser text measurement in domain layer.
 */

import { TextNode, TextStyle, TextBoundingBox } from './TextDomainModel';

export interface TextLineMetric {
  readonly lineIndex: number;
  readonly text: string;
  readonly xOffset: number;
  readonly yOffset: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly baselinePx: number;
}

export interface TypographyLayoutMetrics {
  readonly lines: readonly TextLineMetric[];
  readonly totalWidthPx: number;
  readonly totalHeightPx: number;
  readonly maxLineWidthPx: number;
  readonly lineCount: number;
}

export class TypographyEngine {
  /**
   * Approximates character width based on font size and letter spacing.
   * Pure deterministic mathematical approximation without browser DOM.
   */
  public static estimateCharWidth(fontSize: number, letterSpacing: number): number {
    // Average proportional character width ~ 0.55 * fontSize + letterSpacing
    return fontSize * 0.55 + letterSpacing;
  }

  /**
   * Computes line breaks and word wrapping for a text node within container width.
   */
  public static computeWordWrap(content: string, fontSize: number, letterSpacing: number, maxWidthPx: number): string[] {
    if (!content || maxWidthPx <= 0) return [content];

    const paragraphs = content.split('\n');
    const lines: string[] = [];
    const charWidth = TypographyEngine.estimateCharWidth(fontSize, letterSpacing);

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = testLine.length * charWidth;

        if (testWidth > maxWidthPx && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Computes complete text layout metrics (lines, baseline, bounding box, alignment).
   */
  public static computeLayoutMetrics(node: TextNode): TypographyLayoutMetrics {
    const { style, bounds, content } = node;
    const charWidth = TypographyEngine.estimateCharWidth(style.fontSize, style.letterSpacing);
    const lineHeightPx = style.fontSize * style.lineHeight;

    const wrappedLines = style.overflow === 'wrap'
      ? TypographyEngine.computeWordWrap(content, style.fontSize, style.letterSpacing, bounds.width)
      : content.split('\n');

    let maxLineWidthPx = 0;
    const lines: TextLineMetric[] = wrappedLines.map((lineText, idx) => {
      const lineWidthPx = lineText.length * charWidth;
      maxLineWidthPx = Math.max(maxLineWidthPx, lineWidthPx);

      // Alignment offset
      let xOffset = 0;
      if (style.align === 'center') {
        xOffset = Math.max(0, (bounds.width - lineWidthPx) / 2);
      } else if (style.align === 'right') {
        xOffset = Math.max(0, bounds.width - lineWidthPx);
      }

      const yOffset = idx * lineHeightPx;
      const baselinePx = yOffset + style.fontSize * 0.8; // Standard 80% ascent baseline

      return {
        lineIndex: idx,
        text: lineText,
        xOffset: Number(xOffset.toFixed(2)),
        yOffset: Number(yOffset.toFixed(2)),
        widthPx: Number(lineWidthPx.toFixed(2)),
        heightPx: Number(lineHeightPx.toFixed(2)),
        baselinePx: Number(baselinePx.toFixed(2)),
      };
    });

    const totalWidthPx = style.overflow === 'wrap' ? bounds.width : Math.max(bounds.width, maxLineWidthPx);
    const totalHeightPx = Math.max(bounds.height, lines.length * lineHeightPx);

    return {
      lines,
      totalWidthPx: Number(totalWidthPx.toFixed(2)),
      totalHeightPx: Number(totalHeightPx.toFixed(2)),
      maxLineWidthPx: Number(maxLineWidthPx.toFixed(2)),
      lineCount: lines.length,
    };
  }

  /**
   * Calculates auto-fit bounding box dimensions for text content.
   */
  public static computeAutoFitBounds(node: TextNode): TextBoundingBox {
    const metrics = TypographyEngine.computeLayoutMetrics(node);
    return {
      x: node.bounds.x,
      y: node.bounds.y,
      width: Math.max(50, metrics.maxLineWidthPx + 20),
      height: Math.max(30, metrics.totalHeightPx + 10),
    };
  }
}
