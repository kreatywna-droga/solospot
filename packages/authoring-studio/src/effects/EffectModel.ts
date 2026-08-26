/**
 * EffectModel.ts — Sprint S20 Effects Model (ETAP 2)
 *
 * Defines declarative DTO effect descriptors for:
 * Blur, Drop Shadow, Inner Shadow, Glow, Color Adjustment (Brightness, Contrast, Saturation, Hue), and Opacity.
 *
 * Effects are pure DTO/command descriptors, NOT an independent rendering engine.
 * Headless model: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface BaseEffect {
  readonly id: string;
  readonly type: 'blur' | 'drop-shadow' | 'inner-shadow' | 'glow' | 'color-adjustment' | 'opacity';
  readonly name: string;
  readonly enabled: boolean;
}

export interface BlurEffect extends BaseEffect {
  readonly type: 'blur';
  readonly radius: number; // px, e.g. 0 - 100
}

export interface DropShadowEffect extends BaseEffect {
  readonly type: 'drop-shadow';
  readonly offsetX: number; // px
  readonly offsetY: number; // px
  readonly blur: number; // px
  readonly spread: number; // px
  readonly color: string; // hex or rgba
  readonly opacity: number; // 0.0 - 1.0
}

export interface InnerShadowEffect extends BaseEffect {
  readonly type: 'inner-shadow';
  readonly offsetX: number; // px
  readonly offsetY: number; // px
  readonly blur: number; // px
  readonly spread: number; // px
  readonly color: string; // hex or rgba
  readonly opacity: number; // 0.0 - 1.0
}

export interface GlowEffect extends BaseEffect {
  readonly type: 'glow';
  readonly radius: number; // px
  readonly color: string; // hex or rgba
  readonly intensity: number; // 0.0 - 1.0 or scale
  readonly inner?: boolean;
}

export interface ColorAdjustmentEffect extends BaseEffect {
  readonly type: 'color-adjustment';
  readonly brightness: number; // -100 to 100 (percentage change, default 0)
  readonly contrast: number; // -100 to 100 (percentage change, default 0)
  readonly saturation: number; // -100 to 100 (percentage change, default 0)
  readonly hue: number; // -180 to 180 (degrees, default 0)
}

export interface OpacityEffect extends BaseEffect {
  readonly type: 'opacity';
  readonly opacity: number; // 0.0 - 1.0
}

export type EffectDescriptor =
  | BlurEffect
  | DropShadowEffect
  | InnerShadowEffect
  | GlowEffect
  | ColorAdjustmentEffect
  | OpacityEffect;

export function createBlurEffect(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  radius?: number;
}): BlurEffect {
  return {
    id: params.id,
    type: 'blur',
    name: params.name ?? `Blur_${params.id}`,
    enabled: params.enabled ?? true,
    radius: params.radius ?? 5,
  };
}

export function createDropShadowEffect(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
  color?: string;
  opacity?: number;
}): DropShadowEffect {
  return {
    id: params.id,
    type: 'drop-shadow',
    name: params.name ?? `DropShadow_${params.id}`,
    enabled: params.enabled ?? true,
    offsetX: params.offsetX ?? 0,
    offsetY: params.offsetY ?? 4,
    blur: params.blur ?? 8,
    spread: params.spread ?? 0,
    color: params.color ?? '#000000',
    opacity: params.opacity ?? 0.25,
  };
}

export function createInnerShadowEffect(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
  color?: string;
  opacity?: number;
}): InnerShadowEffect {
  return {
    id: params.id,
    type: 'inner-shadow',
    name: params.name ?? `InnerShadow_${params.id}`,
    enabled: params.enabled ?? true,
    offsetX: params.offsetX ?? 0,
    offsetY: params.offsetY ?? 2,
    blur: params.blur ?? 4,
    spread: params.spread ?? 0,
    color: params.color ?? '#000000',
    opacity: params.opacity ?? 0.3,
  };
}

export function createGlowEffect(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  radius?: number;
  color?: string;
  intensity?: number;
  inner?: boolean;
}): GlowEffect {
  return {
    id: params.id,
    type: 'glow',
    name: params.name ?? `Glow_${params.id}`,
    enabled: params.enabled ?? true,
    radius: params.radius ?? 12,
    color: params.color ?? '#3B82F6',
    intensity: params.intensity ?? 0.8,
    inner: params.inner ?? false,
  };
}

export function createColorAdjustmentEffect(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
}): ColorAdjustmentEffect {
  return {
    id: params.id,
    type: 'color-adjustment',
    name: params.name ?? `ColorAdjustment_${params.id}`,
    enabled: params.enabled ?? true,
    brightness: params.brightness ?? 0,
    contrast: params.contrast ?? 0,
    saturation: params.saturation ?? 0,
    hue: params.hue ?? 0,
  };
}

export function createOpacityEffect(params: {
  id: string;
  name?: string;
  enabled?: boolean;
  opacity?: number;
}): OpacityEffect {
  return {
    id: params.id,
    type: 'opacity',
    name: params.name ?? `Opacity_${params.id}`,
    enabled: params.enabled ?? true,
    opacity: params.opacity ?? 1.0,
  };
}

/**
 * Evaluates active effect descriptors into standard CSS filter string representation.
 */
export function evaluateCSSFilter(effects: ReadonlyArray<EffectDescriptor>): string {
  const parts: string[] = [];

  for (const fx of effects) {
    if (!fx.enabled) continue;

    switch (fx.type) {
      case 'blur':
        if (fx.radius > 0) parts.push(`blur(${fx.radius}px)`);
        break;
      case 'color-adjustment':
        if (fx.brightness !== 0) parts.push(`brightness(${100 + fx.brightness}%)`);
        if (fx.contrast !== 0) parts.push(`contrast(${100 + fx.contrast}%)`);
        if (fx.saturation !== 0) parts.push(`saturate(${100 + fx.saturation}%)`);
        if (fx.hue !== 0) parts.push(`hue-rotate(${fx.hue}deg)`);
        break;
      case 'opacity':
        if (fx.opacity < 1.0) parts.push(`opacity(${Math.max(0, Math.min(1, fx.opacity))})`);
        break;
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Evaluates active shadow/glow effect descriptors into shadow properties DTO.
 */
export function evaluateShadow(
  effects: ReadonlyArray<EffectDescriptor>
): { color: string; blur: number; offsetX: number; offsetY: number; inner?: boolean } | undefined {
  for (const fx of effects) {
    if (!fx.enabled) continue;

    if (fx.type === 'drop-shadow') {
      return {
        color: fx.color,
        blur: fx.blur,
        offsetX: fx.offsetX,
        offsetY: fx.offsetY,
        inner: false,
      };
    }

    if (fx.type === 'inner-shadow') {
      return {
        color: fx.color,
        blur: fx.blur,
        offsetX: fx.offsetX,
        offsetY: fx.offsetY,
        inner: true,
      };
    }

    if (fx.type === 'glow') {
      return {
        color: fx.color,
        blur: fx.radius,
        offsetX: 0,
        offsetY: 0,
        inner: fx.inner ?? false,
      };
    }
  }

  return undefined;
}
