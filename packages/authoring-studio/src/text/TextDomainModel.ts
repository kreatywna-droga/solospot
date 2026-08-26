/**
 * TextDomainModel.ts — Sprint S17 Text Domain Model (ETAP 1)
 *
 * Defines pure DTO data structures for Text Nodes, Typography Styles, Font Descriptors,
 * and Text Layout properties.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextDirection = 'ltr' | 'rtl';
export type TextOverflow = 'clip' | 'ellipsis' | 'wrap';
export type FontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold';

export interface FontDescriptor {
  readonly family: string;
  readonly weight: FontWeight;
  readonly style: 'normal' | 'italic' | 'oblique';
  readonly sourceUrl?: string;
}

export interface TextStyle {
  readonly fontFamily: string;
  readonly fontSize: number;       // Size in pixels (>= 1)
  readonly fontWeight: FontWeight;
  readonly fontStyle: 'normal' | 'italic' | 'oblique';
  readonly fill: string;           // Color hex / rgba string
  readonly stroke?: string;         // Text outline color
  readonly strokeWidth?: number;    // Text outline width
  readonly letterSpacing: number;  // Character spacing in pixels / em
  readonly lineHeight: number;     // Multiplier (e.g. 1.2, 1.5) or px offset
  readonly align: TextAlignment;
  readonly direction: TextDirection;
  readonly overflow: TextOverflow;
  readonly textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  readonly opacity: number;        // Normalized opacity [0, 1]
}

export interface TextBoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TextNode {
  readonly id: string;
  readonly type: 'text';
  readonly name: string;
  readonly content: string;
  readonly style: TextStyle;
  readonly bounds: TextBoundingBox;
  readonly rotationDeg: number;
  readonly locked: boolean;
  readonly visible: boolean;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 24,
  fontWeight: '400',
  fontStyle: 'normal',
  fill: '#000000',
  letterSpacing: 0,
  lineHeight: 1.2,
  align: 'left',
  direction: 'ltr',
  overflow: 'wrap',
  opacity: 1.0,
};

export function createTextNode(
  id: string,
  content: string,
  x: number = 0,
  y: number = 0,
  width: number = 300,
  height: number = 100,
  customStyle?: Partial<TextStyle>
): TextNode {
  return {
    id,
    type: 'text',
    name: content.substring(0, 20) || 'Text',
    content,
    style: {
      ...DEFAULT_TEXT_STYLE,
      ...customStyle,
    },
    bounds: { x, y, width, height },
    rotationDeg: 0,
    locked: false,
    visible: true,
  };
}
