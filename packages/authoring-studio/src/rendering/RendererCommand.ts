/**
 * RendererCommand.ts — Sprint S11 Visual Rendering Backend
 *
 * Immutable DTO commands compiled from RenderFrame for execution by RendererBackend.
 * NO DOM, NO React, NO window. Pure TS types.
 */

export interface RenderBoundingBoxDTO {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type Matrix2DAffine = readonly [number, number, number, number, number, number];

export interface SaveCommand {
  readonly type: 'SAVE';
}

export interface RestoreCommand {
  readonly type: 'RESTORE';
}

export interface SetTransformCommand {
  readonly type: 'SET_TRANSFORM';
  readonly transform: Matrix2DAffine;
}

export interface SetOpacityCommand {
  readonly type: 'SET_OPACITY';
  readonly opacity: number;
}

export interface SetBlendModeCommand {
  readonly type: 'SET_BLEND_MODE';
  readonly blendMode: string;
}

export interface RestrictClipCommand {
  readonly type: 'RESTRICT_CLIP';
  readonly bounds: RenderBoundingBoxDTO;
}

export interface ClearCommand {
  readonly type: 'CLEAR';
  readonly color?: string;
}

export interface GradientFillDTO {
  readonly type: 'linear-gradient' | 'radial-gradient';
  readonly stops: ReadonlyArray<{ readonly offset: number; readonly color: string }>;
  readonly angleDeg?: number;
}

export interface DrawRectCommand {
  readonly type: 'DRAW_RECT';
  readonly nodeId: string;
  readonly bounds: RenderBoundingBoxDTO;
  readonly fillStyle?: string;
  readonly fillGradient?: GradientFillDTO;
  readonly fillOpacity?: number;
  readonly strokeStyle?: string;
  readonly strokeWidth?: number;
  readonly strokeOpacity?: number;
  readonly strokeDashArray?: number[];
  readonly strokeDashOffset?: number;
  readonly strokeLineJoin?: 'miter' | 'round' | 'bevel';
  readonly strokeMiterLimit?: number;
  readonly cornerRadius?: number;
}

export interface DrawImageCommand {
  readonly type: 'DRAW_IMAGE';
  readonly nodeId: string;
  readonly bounds: RenderBoundingBoxDTO;
  readonly src: string;
  readonly objectFit?: 'contain' | 'cover' | 'fill';
}

export interface DrawTextCommand {
  readonly type: 'DRAW_TEXT';
  readonly nodeId: string;
  readonly bounds: RenderBoundingBoxDTO;
  readonly text: string;
  readonly font?: string;
  readonly fontSize?: number;
  readonly fillStyle?: string;
  readonly align?: 'left' | 'center' | 'right';
  readonly baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic';
}

export interface DrawEllipseCommand {
  readonly type: 'DRAW_ELLIPSE';
  readonly nodeId: string;
  readonly bounds: RenderBoundingBoxDTO;
  readonly fillStyle?: string;
  readonly fillGradient?: GradientFillDTO;
  readonly fillOpacity?: number;
  readonly strokeStyle?: string;
  readonly strokeWidth?: number;
  readonly strokeOpacity?: number;
  readonly strokeDashArray?: number[];
  readonly strokeDashOffset?: number;
  readonly strokeLineJoin?: 'miter' | 'round' | 'bevel';
  readonly strokeMiterLimit?: number;
}

export interface DrawPolygonCommand {
  readonly type: 'DRAW_POLYGON';
  readonly nodeId: string;
  readonly bounds: RenderBoundingBoxDTO;
  readonly points: ReadonlyArray<{ readonly x: number; readonly y: number }>;
  readonly fillStyle?: string;
  readonly fillGradient?: GradientFillDTO;
  readonly fillOpacity?: number;
  readonly strokeStyle?: string;
  readonly strokeWidth?: number;
  readonly strokeOpacity?: number;
  readonly strokeDashArray?: number[];
  readonly strokeDashOffset?: number;
  readonly strokeLineJoin?: 'miter' | 'round' | 'bevel';
  readonly strokeMiterLimit?: number;
}

export interface DrawLineCommand {
  readonly type: 'DRAW_LINE';
  readonly nodeId: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly strokeStyle?: string;
  readonly strokeWidth?: number;
  readonly strokeOpacity?: number;
  readonly strokeDashArray?: number[];
  readonly strokeDashOffset?: number;
  readonly strokeLineJoin?: 'miter' | 'round' | 'bevel';
  readonly strokeMiterLimit?: number;
  readonly lineCap?: 'butt' | 'round' | 'square';
}

export interface DrawPathCommand {
  readonly type: 'DRAW_PATH';
  readonly nodeId: string;
  readonly bounds: RenderBoundingBoxDTO;
  readonly d: string;
  readonly fillStyle?: string;
  readonly fillGradient?: GradientFillDTO;
  readonly fillOpacity?: number;
  readonly strokeStyle?: string;
  readonly strokeWidth?: number;
  readonly strokeOpacity?: number;
  readonly strokeDashArray?: number[];
  readonly strokeDashOffset?: number;
  readonly strokeLineJoin?: 'miter' | 'round' | 'bevel';
  readonly strokeMiterLimit?: number;
}

export interface ApplyShadowCommand {
  readonly type: 'APPLY_SHADOW';
  readonly color: string;
  readonly blur: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly inner?: boolean;
}

export interface ApplyFilterCommand {
  readonly type: 'APPLY_FILTER';
  readonly filterString: string;
}

export interface ClearEffectsCommand {
  readonly type: 'CLEAR_EFFECTS';
}

export type RendererCommand =
  | SaveCommand
  | RestoreCommand
  | SetTransformCommand
  | SetOpacityCommand
  | SetBlendModeCommand
  | RestrictClipCommand
  | ClearCommand
  | DrawRectCommand
  | DrawImageCommand
  | DrawTextCommand
  | DrawEllipseCommand
  | DrawPolygonCommand
  | DrawLineCommand
  | DrawPathCommand
  | ApplyShadowCommand
  | ApplyFilterCommand
  | ClearEffectsCommand;


