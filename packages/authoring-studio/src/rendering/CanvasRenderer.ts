/**
 * CanvasRenderer.ts — Sprint S11 Canvas Rendering Backend Implementation
 *
 * Real Canvas 2D Backend implementation executing RendererCommand DTOs on Canvas surface.
 * Handles rectangles, images, text, 2D matrix transformations, opacity, clipping, and blend modes.
 *
 * ALL Canvas API calls are isolated inside this adapter.
 */

import { DEFAULT_CANVAS2D_CAPABILITIES, RendererCapabilities } from './RendererCapabilities';
import { RendererBackend } from './RendererBackend';
import {
  ClearCommand,
  DrawImageCommand,
  DrawRectCommand,
  DrawTextCommand,
  DrawEllipseCommand,
  DrawPolygonCommand,
  DrawLineCommand,
  DrawPathCommand,
  RestrictClipCommand,
  RendererCommand,
  SetBlendModeCommand,
  SetOpacityCommand,
  SetTransformCommand,
} from './RendererCommand';
import { RendererState } from './RendererState';
import { RendererSurface } from './RendererSurface';
import { CanvasRendererStateStack } from './CanvasRendererState';

export class CanvasRenderer implements RendererBackend {
  public readonly capabilities: RendererCapabilities = DEFAULT_CANVAS2D_CAPABILITIES;
  private surface?: RendererSurface;
  private ctx?: any;
  private stateStack = new CanvasRendererStateStack();
  private imageCache = new Map<string, any>();
  private initialized = false;

  public get isInitialized(): boolean {
    return this.initialized;
  }

  public initialize(surface: RendererSurface): void {
    this.surface = surface;
    const surfaceContext = surface.getSurfaceContext();
    this.ctx = surfaceContext.ctx2d;
    this.stateStack.reset();
    this.initialized = true;
  }

  public beginFrame(frameIndex: number, timestampMs: number): void {
    if (!this.initialized || !this.surface) {
      throw new Error('CanvasRenderer not initialized before beginFrame call.');
    }
    this.stateStack.reset();
    if (this.ctx && typeof this.ctx.save === 'function') {
      this.ctx.save();
    }
  }

  public executeCommands(commands: ReadonlyArray<RendererCommand>): void {
    if (!this.initialized || !this.ctx) return;

    for (const cmd of commands) {
      this.executeCommand(cmd);
    }
  }

  public endFrame(): void {
    if (!this.initialized || !this.ctx) return;
    if (typeof this.ctx.restore === 'function') {
      this.ctx.restore();
    }
  }

  public getState(): RendererState {
    return {
      viewportWidth: this.surface?.width ?? 0,
      viewportHeight: this.surface?.height ?? 0,
      devicePixelRatio: this.surface?.devicePixelRatio ?? 1.0,
      currentOpacity: this.stateStack.opacity,
      currentBlendMode: this.stateStack.blendMode,
      currentTransform: this.stateStack.transform,
      activeClipBounds: this.stateStack.clipBounds,
      stackDepth: this.stateStack.depth,
    };
  }

  public destroy(): void {
    this.imageCache.clear();
    this.stateStack.reset();
    this.surface = undefined;
    this.ctx = undefined;
    this.initialized = false;
  }

  private executeCommand(cmd: RendererCommand): void {
    switch (cmd.type) {
      case 'SAVE':
        this.stateStack.pushState();
        if (typeof this.ctx.save === 'function') this.ctx.save();
        break;

      case 'RESTORE':
        this.stateStack.popState();
        if (typeof this.ctx.restore === 'function') this.ctx.restore();
        break;

      case 'SET_TRANSFORM':
        this.stateStack.setTransform(cmd.transform);
        if (typeof this.ctx.setTransform === 'function') {
          const [a, b, c, d, e, f] = cmd.transform;
          this.ctx.setTransform(a, b, c, d, e, f);
        }
        break;

      case 'SET_OPACITY':
        this.stateStack.setOpacity(cmd.opacity);
        if ('globalAlpha' in this.ctx) {
          this.ctx.globalAlpha = this.stateStack.opacity;
        }
        break;

      case 'SET_BLEND_MODE':
        this.stateStack.setBlendMode(cmd.blendMode);
        if ('globalCompositeOperation' in this.ctx) {
          this.ctx.globalCompositeOperation = cmd.blendMode;
        }
        break;

      case 'RESTRICT_CLIP':
        this.stateStack.setClipBounds(cmd.bounds);
        if (typeof this.ctx.beginPath === 'function' && typeof this.ctx.rect === 'function') {
          this.ctx.beginPath();
          this.ctx.rect(cmd.bounds.x, cmd.bounds.y, cmd.bounds.width, cmd.bounds.height);
          if (typeof this.ctx.clip === 'function') {
            this.ctx.clip();
          }
        }
        break;

      case 'CLEAR':
        this.handleClear(cmd);
        break;

      case 'DRAW_RECT':
        this.handleDrawRect(cmd);
        break;

      case 'DRAW_IMAGE':
        this.handleDrawImage(cmd);
        break;

      case 'DRAW_TEXT':
        this.handleDrawText(cmd);
        break;

      case 'DRAW_ELLIPSE':
        this.handleDrawEllipse(cmd);
        break;

      case 'DRAW_POLYGON':
        this.handleDrawPolygon(cmd);
        break;

      case 'DRAW_LINE':
        this.handleDrawLine(cmd);
        break;

      case 'DRAW_PATH':
        this.handleDrawPath(cmd);
        break;

      case 'APPLY_SHADOW':
        if (this.ctx) {
          if ('shadowColor' in this.ctx) this.ctx.shadowColor = cmd.color;
          if ('shadowBlur' in this.ctx) this.ctx.shadowBlur = cmd.blur;
          if ('shadowOffsetX' in this.ctx) this.ctx.shadowOffsetX = cmd.offsetX;
          if ('shadowOffsetY' in this.ctx) this.ctx.shadowOffsetY = cmd.offsetY;
        }
        break;

      case 'APPLY_FILTER':
        if (this.ctx && 'filter' in this.ctx) {
          this.ctx.filter = cmd.filterString;
        }
        break;

      case 'CLEAR_EFFECTS':
        if (this.ctx) {
          if ('shadowColor' in this.ctx) this.ctx.shadowColor = 'transparent';
          if ('shadowBlur' in this.ctx) this.ctx.shadowBlur = 0;
          if ('shadowOffsetX' in this.ctx) this.ctx.shadowOffsetX = 0;
          if ('shadowOffsetY' in this.ctx) this.ctx.shadowOffsetY = 0;
          if ('filter' in this.ctx) this.ctx.filter = 'none';
        }
        break;
    }
  }

  private handleClear(cmd: ClearCommand): void {
    if (cmd.color) {
      if (typeof this.ctx.fillRect === 'function') {
        const prevFill = this.ctx.fillStyle;
        this.ctx.fillStyle = cmd.color;
        this.ctx.fillRect(0, 0, this.surface?.width ?? 1920, this.surface?.height ?? 1080);
        this.ctx.fillStyle = prevFill;
      }
    } else if (typeof this.ctx.clearRect === 'function') {
      this.ctx.clearRect(0, 0, this.surface?.width ?? 1920, this.surface?.height ?? 1080);
    }
  }

  private applyFillStyle(ctx: any, cmd: { fillStyle?: string; fillGradient?: any; fillOpacity?: number }): void {
    if (cmd.fillGradient && typeof ctx.createLinearGradient === 'function') {
      const g = cmd.fillGradient;
      let gradient: any = null;
      if (g.type === 'radial-gradient' && typeof ctx.createRadialGradient === 'function') {
        const r = Math.max(1, (this.surface?.width ?? 100) / 2);
        gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      } else if (typeof ctx.createLinearGradient === 'function') {
        const angle = g.angleDeg ?? 0;
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = 50 - Math.cos(rad) * 50;
        const y1 = 50 - Math.sin(rad) * 50;
        const x2 = 50 + Math.cos(rad) * 50;
        const y2 = 50 + Math.sin(rad) * 50;
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      }
      if (gradient && Array.isArray(g.stops)) {
        for (const stop of g.stops) {
          if (typeof gradient.addColorStop === 'function') {
            gradient.addColorStop(stop.offset, stop.color);
          }
        }
        ctx.fillStyle = gradient;
        return;
      }
    }
    if (cmd.fillStyle) ctx.fillStyle = cmd.fillStyle;
    if (cmd.fillOpacity !== undefined && 'globalAlpha' in ctx) {
      ctx.globalAlpha = Math.max(0, Math.min(1, cmd.fillOpacity));
    }
  }

  private applyStrokeStyle(ctx: any, cmd: {
    strokeStyle?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    strokeDashArray?: number[];
    strokeDashOffset?: number;
    strokeLineJoin?: string;
    strokeMiterLimit?: number;
  }): void {
    if (cmd.strokeStyle) ctx.strokeStyle = cmd.strokeStyle;
    if (cmd.strokeWidth) ctx.lineWidth = cmd.strokeWidth;
    if (cmd.strokeOpacity !== undefined && 'globalAlpha' in ctx) {
      ctx.globalAlpha = Math.max(0, Math.min(1, cmd.strokeOpacity));
    }
    if (cmd.strokeDashArray && typeof ctx.setLineDash === 'function') {
      ctx.setLineDash(cmd.strokeDashArray);
      if (cmd.strokeDashOffset !== undefined && 'lineDashOffset' in ctx) {
        ctx.lineDashOffset = cmd.strokeDashOffset;
      }
    }
    if (cmd.strokeLineJoin && 'lineJoin' in ctx) ctx.lineJoin = cmd.strokeLineJoin;
    if (cmd.strokeMiterLimit !== undefined && 'miterLimit' in ctx) ctx.miterLimit = cmd.strokeMiterLimit;
  }

  private handleDrawRect(cmd: DrawRectCommand): void {
    const { x, y, width, height } = cmd.bounds;
    const cornerRadius = cmd.cornerRadius ?? 0;

    if (cornerRadius > 0 && typeof this.ctx.roundRect === 'function') {
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, width, height, cornerRadius);
      if (cmd.fillStyle || cmd.fillGradient) {
        const prevFill = this.ctx.fillStyle;
        const prevAlpha = this.ctx.globalAlpha;
        this.applyFillStyle(this.ctx, cmd);
        if (typeof this.ctx.fill === 'function') this.ctx.fill();
        this.ctx.fillStyle = prevFill;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
      }
      if (cmd.strokeStyle) {
        const prevStroke = this.ctx.strokeStyle;
        const prevLineWidth = this.ctx.lineWidth;
        const prevAlpha = this.ctx.globalAlpha;
        const prevDash = typeof this.ctx.getLineDash === 'function' ? this.ctx.getLineDash() : undefined;
        this.applyStrokeStyle(this.ctx, cmd);
        if (typeof this.ctx.stroke === 'function') this.ctx.stroke();
        this.ctx.strokeStyle = prevStroke;
        this.ctx.lineWidth = prevLineWidth;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
        if (prevDash && typeof this.ctx.setLineDash === 'function') this.ctx.setLineDash(prevDash);
      }
      return;
    }

    if (cmd.fillStyle || cmd.fillGradient) {
      const prevFill = this.ctx.fillStyle;
      const prevAlpha = this.ctx.globalAlpha;
      this.applyFillStyle(this.ctx, cmd);
      if (typeof this.ctx.fillRect === 'function') this.ctx.fillRect(x, y, width, height);
      this.ctx.fillStyle = prevFill;
      if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
    }

    if (cmd.strokeStyle) {
      const prevStroke = this.ctx.strokeStyle;
      const prevLineWidth = this.ctx.lineWidth;
      const prevAlpha = this.ctx.globalAlpha;
      const prevDash = typeof this.ctx.getLineDash === 'function' ? this.ctx.getLineDash() : undefined;
      this.applyStrokeStyle(this.ctx, cmd);
      if (typeof this.ctx.strokeRect === 'function') this.ctx.strokeRect(x, y, width, height);
      this.ctx.strokeStyle = prevStroke;
      this.ctx.lineWidth = prevLineWidth;
      if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
      if (prevDash && typeof this.ctx.setLineDash === 'function') this.ctx.setLineDash(prevDash);
    }
  }

  private handleDrawImage(cmd: DrawImageCommand): void {
    const { x, y, width, height } = cmd.bounds;
    const img = this.imageCache.get(cmd.src);

    if (img && typeof this.ctx.drawImage === 'function') {
      this.ctx.drawImage(img, x, y, width, height);
    } else {
      // Fallback rect drawing if image not loaded or mock environment
      if (typeof this.ctx.fillRect === 'function') {
        const prevFill = this.ctx.fillStyle;
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.fillStyle = prevFill;
      }
    }
  }

  private handleDrawText(cmd: DrawTextCommand): void {
    const { x, y } = cmd.bounds;
    if (typeof this.ctx.fillText === 'function') {
      const prevFont = this.ctx.font;
      const prevFill = this.ctx.fillStyle;
      const prevAlign = this.ctx.textAlign;
      const prevBaseline = this.ctx.textBaseline;

      const fontSize = cmd.fontSize ?? 16;
      const font = cmd.font ?? `${fontSize}px sans-serif`;
      this.ctx.font = font;

      if (cmd.fillStyle) this.ctx.fillStyle = cmd.fillStyle;
      if (cmd.align) this.ctx.textAlign = cmd.align;
      if (cmd.baseline) this.ctx.textBaseline = cmd.baseline;

      this.ctx.fillText(cmd.text, x, y);

      this.ctx.font = prevFont;
      this.ctx.fillStyle = prevFill;
      this.ctx.textAlign = prevAlign;
      this.ctx.textBaseline = prevBaseline;
    }
  }

  private handleDrawEllipse(cmd: DrawEllipseCommand): void {
    const { x, y, width, height } = cmd.bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;

    if (typeof this.ctx.ellipse === 'function') {
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);

      if (cmd.fillStyle || cmd.fillGradient) {
        const prevFill = this.ctx.fillStyle;
        const prevAlpha = this.ctx.globalAlpha;
        this.applyFillStyle(this.ctx, cmd);
        if (typeof this.ctx.fill === 'function') this.ctx.fill();
        this.ctx.fillStyle = prevFill;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
      }

      if (cmd.strokeStyle) {
        const prevStroke = this.ctx.strokeStyle;
        const prevLineWidth = this.ctx.lineWidth;
        const prevAlpha = this.ctx.globalAlpha;
        const prevDash = typeof this.ctx.getLineDash === 'function' ? this.ctx.getLineDash() : undefined;
        this.applyStrokeStyle(this.ctx, cmd);
        if (typeof this.ctx.stroke === 'function') this.ctx.stroke();
        this.ctx.strokeStyle = prevStroke;
        this.ctx.lineWidth = prevLineWidth;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
        if (prevDash && typeof this.ctx.setLineDash === 'function') this.ctx.setLineDash(prevDash);
      }
    }
  }

  private handleDrawPolygon(cmd: DrawPolygonCommand): void {
    if (!cmd.points || cmd.points.length === 0) return;

    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
      this.ctx.moveTo(cmd.points[0].x, cmd.points[0].y);

      for (let i = 1; i < cmd.points.length; i++) {
        this.ctx.lineTo(cmd.points[i].x, cmd.points[i].y);
      }

      this.ctx.closePath();

      if (cmd.fillStyle || cmd.fillGradient) {
        const prevFill = this.ctx.fillStyle;
        const prevAlpha = this.ctx.globalAlpha;
        this.applyFillStyle(this.ctx, cmd);
        if (typeof this.ctx.fill === 'function') this.ctx.fill();
        this.ctx.fillStyle = prevFill;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
      }

      if (cmd.strokeStyle) {
        const prevStroke = this.ctx.strokeStyle;
        const prevLineWidth = this.ctx.lineWidth;
        const prevAlpha = this.ctx.globalAlpha;
        const prevDash = typeof this.ctx.getLineDash === 'function' ? this.ctx.getLineDash() : undefined;
        this.applyStrokeStyle(this.ctx, cmd);
        if (typeof this.ctx.stroke === 'function') this.ctx.stroke();
        this.ctx.strokeStyle = prevStroke;
        this.ctx.lineWidth = prevLineWidth;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
        if (prevDash && typeof this.ctx.setLineDash === 'function') this.ctx.setLineDash(prevDash);
      }
    }
  }

  private handleDrawLine(cmd: DrawLineCommand): void {
    if (typeof this.ctx.beginPath === 'function') {
      this.ctx.beginPath();
      this.ctx.moveTo(cmd.x1, cmd.y1);
      this.ctx.lineTo(cmd.x2, cmd.y2);

      if (cmd.strokeStyle) {
        const prevStroke = this.ctx.strokeStyle;
        const prevLineWidth = this.ctx.lineWidth;
        const prevAlpha = this.ctx.globalAlpha;
        const prevCap = this.ctx.lineCap;
        const prevJoin = this.ctx.lineJoin;
        const prevDash = typeof this.ctx.getLineDash === 'function' ? this.ctx.getLineDash() : undefined;

        this.applyStrokeStyle(this.ctx, cmd);
        if (cmd.lineCap) this.ctx.lineCap = cmd.lineCap;

        if (typeof this.ctx.stroke === 'function') this.ctx.stroke();

        this.ctx.strokeStyle = prevStroke;
        this.ctx.lineWidth = prevLineWidth;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
        this.ctx.lineCap = prevCap;
        this.ctx.lineJoin = prevJoin;
        if (prevDash && typeof this.ctx.setLineDash === 'function') this.ctx.setLineDash(prevDash);
      }
    }
  }

  private handleDrawPath(cmd: DrawPathCommand): void {
    if (typeof Path2D !== 'undefined' && typeof this.ctx.fill === 'function') {
      const path2d = new Path2D(cmd.d);
      if (cmd.fillStyle || cmd.fillGradient) {
        const prevFill = this.ctx.fillStyle;
        const prevAlpha = this.ctx.globalAlpha;
        this.applyFillStyle(this.ctx, cmd);
        this.ctx.fill(path2d);
        this.ctx.fillStyle = prevFill;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
      }
      if (cmd.strokeStyle && typeof this.ctx.stroke === 'function') {
        const prevStroke = this.ctx.strokeStyle;
        const prevLineWidth = this.ctx.lineWidth;
        const prevAlpha = this.ctx.globalAlpha;
        const prevDash = typeof this.ctx.getLineDash === 'function' ? this.ctx.getLineDash() : undefined;
        this.applyStrokeStyle(this.ctx, cmd);
        this.ctx.stroke(path2d);
        this.ctx.strokeStyle = prevStroke;
        this.ctx.lineWidth = prevLineWidth;
        if (prevAlpha !== undefined) this.ctx.globalAlpha = prevAlpha;
        if (prevDash && typeof this.ctx.setLineDash === 'function') this.ctx.setLineDash(prevDash);
      }
    }
  }
}

