/**
 * GuidesRulersController.ts — Sprint S23 Guides & Rulers Calculation Controller
 *
 * Pure headless controller for:
 * - Adding, moving, removing, locking, clearing user guides
 * - Calculating dynamic ruler tick intervals and pixel positions based on Camera zoom & pan
 * - Dynamic smart guides & alignment indicator computations
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Camera } from '../camera/CameraModel';
import { CoordinateSystems } from '../camera/CoordinateSystems';
import { Scene } from '../scene/SceneGraphModel';
import { BoundingBox } from '../selection/BoundingBoxModel';
import { GuidesEngine, SmartGuideResult } from '../selection/GuidesEngine';
import { DEFAULT_RULER_CONFIG, RulerConfig, RulerTick, UserGuide } from './GuidesRulersModel';

export class GuidesRulersController {
  /**
   * Creates a new UserGuide object.
   */
  public static createGuide(params: {
    id?: string;
    type: 'horizontal' | 'vertical';
    position: number;
    locked?: boolean;
    color?: string;
  }): UserGuide {
    return {
      id: params.id ?? `guide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: params.type,
      position: params.position,
      locked: params.locked ?? false,
      color: params.color ?? '#3B82F6',
    };
  }

  /**
   * Appends a guide line to an existing list of guides.
   */
  public static addGuide(guides: ReadonlyArray<UserGuide>, newGuide: UserGuide): ReadonlyArray<UserGuide> {
    return [...guides, newGuide];
  }

  /**
   * Moves an unlocked guide line to a new world position.
   */
  public static moveGuide(
    guides: ReadonlyArray<UserGuide>,
    guideId: string,
    newPosition: number
  ): ReadonlyArray<UserGuide> {
    return guides.map((guide) => {
      if (guide.id === guideId && !guide.locked) {
        return { ...guide, position: newPosition };
      }
      return guide;
    });
  }

  /**
   * Removes a guide line by ID.
   */
  public static removeGuide(guides: ReadonlyArray<UserGuide>, guideId: string): ReadonlyArray<UserGuide> {
    return guides.filter((guide) => guide.id !== guideId);
  }

  /**
   * Toggles lock state for a guide line.
   */
  public static toggleLockGuide(guides: ReadonlyArray<UserGuide>, guideId: string): ReadonlyArray<UserGuide> {
    return guides.map((guide) => {
      if (guide.id === guideId) {
        return { ...guide, locked: !guide.locked };
      }
      return guide;
    });
  }

  /**
   * Clears all user guide lines.
   */
  public static clearGuides(): ReadonlyArray<UserGuide> {
    return [];
  }

  /**
   * Computes dynamic ruler ticks for a viewport dimension (width or height) using camera zoom and offset.
   */
  public static computeRulerTicks(
    viewportLength: number,
    camera: Camera,
    orientation: 'horizontal' | 'vertical',
    config: RulerConfig = DEFAULT_RULER_CONFIG
  ): ReadonlyArray<RulerTick> {
    const zoom = camera.transform.zoom;

    // Adapt tick interval based on zoom scale factor
    let stepWorld = config.majorTickInterval;
    if (zoom < 0.2) stepWorld *= 5;
    else if (zoom < 0.5) stepWorld *= 2;
    else if (zoom > 4.0) stepWorld /= 5;
    else if (zoom > 2.0) stepWorld /= 2;

    const screenStart = 0;
    const screenEnd = viewportLength;

    const worldStart = orientation === 'horizontal'
      ? CoordinateSystems.screenToWorld({ x: screenStart, y: 0 }, camera).x
      : CoordinateSystems.screenToWorld({ x: 0, y: screenStart }, camera).y;

    const worldEnd = orientation === 'horizontal'
      ? CoordinateSystems.screenToWorld({ x: screenEnd, y: 0 }, camera).x
      : CoordinateSystems.screenToWorld({ x: 0, y: screenEnd }, camera).y;

    const startValue = Math.floor(worldStart / stepWorld) * stepWorld;
    const endValue = Math.ceil(worldEnd / stepWorld) * stepWorld;

    const ticks: RulerTick[] = [];
    const minorStep = stepWorld / config.minorTickSubdivisions;

    for (let val = startValue; val <= endValue; val += minorStep) {
      const isMajor = Math.abs(val % stepWorld) < 0.001 || Math.abs((val % stepWorld) - stepWorld) < 0.001;

      const screenPoint = orientation === 'horizontal'
        ? CoordinateSystems.worldToScreen({ x: val, y: 0 }, camera).x
        : CoordinateSystems.worldToScreen({ x: 0, y: val }, camera).y;

      if (screenPoint >= 0 && screenPoint <= viewportLength) {
        ticks.push({
          screenPosition: screenPoint,
          worldValue: Math.round(val),
          isMajor,
          label: isMajor ? `${Math.round(val)}` : undefined,
        });
      }
    }

    return ticks;
  }

  /**
   * Computes smart guide lines and gap indicators for active selection against scene object bounds.
   */
  public static computeSmartGuides(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    activeBounds: BoundingBox
  ): SmartGuideResult {
    return GuidesEngine.computeSmartGuides(scene, selectedNodeIds, activeBounds);
  }
}
