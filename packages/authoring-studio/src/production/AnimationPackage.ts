/**
 * AnimationPackage.ts — PM41 Animation Packaging (ETAP 5)
 *
 * Package manifest DTOs and packager/unpackager helpers for redistributable animation assets.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import type { AnimationPreset } from './AnimationPresetLibrary';

export interface AnimationPackageManifest {
  readonly packageName: string;
  readonly packageVersion: string;
  readonly author: string;
  readonly license: string;
  readonly minimumStudioVersion: string;
  readonly dependencies: ReadonlyArray<string>;
  readonly createdAt: string;
}

export interface AnimationPackageData {
  readonly manifest: AnimationPackageManifest;
  readonly timelines: ReadonlyArray<AnimationTimeline>;
  readonly presets: ReadonlyArray<AnimationPreset>;
}

/**
 * Creates a redistributable animation package payload.
 */
export function createAnimationPackage(
  packageName: string,
  packageVersion: string,
  author: string,
  timelines: ReadonlyArray<AnimationTimeline>,
  presets: ReadonlyArray<AnimationPreset> = [],
  dependencies: ReadonlyArray<string> = []
): AnimationPackageData {
  const manifest: AnimationPackageManifest = {
    packageName,
    packageVersion,
    author,
    license: 'MIT',
    minimumStudioVersion: '1.0.0',
    dependencies,
    createdAt: new Date().toISOString(),
  };

  return {
    manifest,
    timelines: JSON.parse(JSON.stringify(timelines)),
    presets: JSON.parse(JSON.stringify(presets)),
  };
}

/**
 * Unpacks an animation package into serializable objects.
 */
export function unpackAnimationPackage(pkg: AnimationPackageData): {
  manifest: AnimationPackageManifest;
  timelines: ReadonlyArray<AnimationTimeline>;
  presets: ReadonlyArray<AnimationPreset>;
} {
  if (!pkg || !pkg.manifest || !pkg.timelines) {
    throw new Error('Invalid animation package payload.');
  }

  return {
    manifest: pkg.manifest,
    timelines: pkg.timelines,
    presets: pkg.presets ?? [],
  };
}
