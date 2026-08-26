import { describe, it, expect } from 'vitest';
import {
  createAnimationPackage,
  unpackAnimationPackage,
} from '../AnimationPackage';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const mockTimeline: AnimationTimeline = {
  id: 'tl-pkg-test',
  targetNodeId: 'sec-pkg',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [],
};

describe('AnimationPackage (PM41, ETAP 5)', () => {
  it('creates and unpacks redistributable animation package payloads', () => {
    const pkg = createAnimationPackage(
      'HeroPack',
      '1.2.0',
      'Studio Author',
      [mockTimeline],
      [],
      ['core-anim']
    );

    expect(pkg.manifest.packageName).toBe('HeroPack');
    expect(pkg.manifest.packageVersion).toBe('1.2.0');
    expect(pkg.manifest.dependencies).toEqual(['core-anim']);
    expect(pkg.timelines).toHaveLength(1);

    const unpacked = unpackAnimationPackage(pkg);
    expect(unpacked.manifest.packageName).toBe('HeroPack');
    expect(unpacked.timelines[0].id).toBe('tl-pkg-test');
  });
});
