import { describe, it, expect } from 'vitest';
import {
  EXPORT_PROFILES,
  getExportProfile,
} from '../AnimationExportProfiles';

describe('AnimationExportProfiles (PM41, ETAP 7)', () => {
  it('provides export profile descriptors for studio, json, lottie, and waapi', () => {
    expect(EXPORT_PROFILES.length).toBeGreaterThanOrEqual(4);

    const studioProfile = getExportProfile('studio_json');
    expect(studioProfile.name).toBe('Internal Studio Format');
    expect(studioProfile.fileExtension).toBe('.studio.json');

    const lottieProfile = getExportProfile('lottie_metadata');
    expect(lottieProfile.fileExtension).toBe('.lottie.json');
  });

  it('throws error for unknown profile ID', () => {
    expect(() => getExportProfile('unknown_profile' as any)).toThrow();
  });
});
