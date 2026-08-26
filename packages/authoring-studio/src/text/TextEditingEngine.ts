/**
 * TextEditingEngine.ts — Sprint S17 Text Editing Engine (ETAP 3)
 *
 * Handles text node editing operations:
 * - create text node
 * - update text content
 * - update text styles (font, size, weight, fill, line height, letter spacing, align)
 * - resize text bounding box
 * - duplicate & delete text nodes
 *
 * All operations return updated TextNode DTOs for dispatching to BuilderDocument & HistoryStack.
 */

import { TextNode, TextStyle, createTextNode, TextAlignment } from './TextDomainModel';
import { TypographyEngine } from './TypographyEngine';

export class TextEditingEngine {
  /**
   * Creates a new TextNode instance.
   */
  public static createText(
    id: string,
    content: string = 'Heading Text',
    x: number = 100,
    y: number = 100,
    customStyle?: Partial<TextStyle>
  ): TextNode {
    return createTextNode(id, content, x, y, 300, 100, customStyle);
  }

  /**
   * Updates content text string of a TextNode.
   */
  public static updateContent(node: TextNode, newContent: string): TextNode {
    const updated: TextNode = {
      ...node,
      content: newContent,
      name: newContent.substring(0, 20) || 'Text',
    };

    // Auto-recalculate height metric if wrapping
    const metrics = TypographyEngine.computeLayoutMetrics(updated);
    return {
      ...updated,
      bounds: {
        ...updated.bounds,
        height: Math.max(updated.bounds.height, metrics.totalHeightPx),
      },
    };
  }

  /**
   * Updates partial text style properties.
   */
  public static updateStyle(node: TextNode, styleDelta: Partial<TextStyle>): TextNode {
    return {
      ...node,
      style: {
        ...node.style,
        ...styleDelta,
      },
    };
  }

  /**
   * Resizes text node bounding box.
   */
  public static resizeTextBox(node: TextNode, width: number, height: number): TextNode {
    return {
      ...node,
      bounds: {
        ...node.bounds,
        width: Math.max(20, width),
        height: Math.max(20, height),
      },
    };
  }

  /**
   * Sets text alignment (left, center, right, justify).
   */
  public static setAlignment(node: TextNode, align: TextAlignment): TextNode {
    return TextEditingEngine.updateStyle(node, { align });
  }

  /**
   * Duplicates text node with downstream spatial offset.
   */
  public static duplicateText(node: TextNode, offsetX: number = 20, offsetY: number = 20): TextNode {
    return {
      ...node,
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bounds: {
        ...node.bounds,
        x: node.bounds.x + offsetX,
        y: node.bounds.y + offsetY,
      },
    };
  }
}
