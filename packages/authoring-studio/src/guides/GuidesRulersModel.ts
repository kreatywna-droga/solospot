/**
 * GuidesRulersModel.ts — Sprint S23 Guides & Rulers Domain Model
 *
 * Headless DTO data models for:
 * - UserGuide (horizontal/vertical guide lines)
 * - RulerConfig (ruler display parameters & unit settings)
 * - RulerTick (viewport pixel ticks & world coordinate labels)
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type GuideOrientation = 'horizontal' | 'vertical';

export interface UserGuide {
  readonly id: string;
  readonly type: GuideOrientation;
  readonly position: number; // World space coordinate
  readonly locked: boolean;
  readonly color?: string;
}

export interface RulerConfig {
  readonly unit: 'px' | 'in' | 'cm' | 'mm';
  readonly majorTickInterval: number; // World space interval (e.g. 100px)
  readonly minorTickSubdivisions: number; // e.g. 10 subdivisions per major interval
  readonly origin: { readonly x: number; readonly y: number };
  readonly visible: boolean;
}

export const DEFAULT_RULER_CONFIG: RulerConfig = {
  unit: 'px',
  majorTickInterval: 100,
  minorTickSubdivisions: 10,
  origin: { x: 0, y: 0 },
  visible: true,
};

export interface RulerTick {
  readonly screenPosition: number; // Viewport screen pixel location
  readonly worldValue: number;      // Corresponding world coordinate value
  readonly isMajor: boolean;
  readonly label?: string;
}
