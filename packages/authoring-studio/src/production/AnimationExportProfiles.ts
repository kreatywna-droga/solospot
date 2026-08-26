/**
 * AnimationExportProfiles.ts — PM41 Export Profiles (ETAP 7)
 *
 * Provides export profile descriptors for:
 *   - Internal Studio Format (.studio.json)
 *   - Pure JSON DTO (.json)
 *   - Lottie Metadata Profile
 *   - Web Animations API (WAAPI) Metadata Profile
 *
 * NOTE: This is NOT a Lottie/WAAPI code generator. It is pure export profile descriptor metadata.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type ExportProfileType =
  | 'studio_json'
  | 'pure_json'
  | 'lottie_metadata'
  | 'waapi_metadata';

export interface ExportProfileDescriptor {
  readonly id: ExportProfileType;
  readonly name: string;
  readonly description: string;
  readonly fileExtension: string;
  readonly mimeType: string;
  readonly supportedFeatures: ReadonlyArray<string>;
}

export const EXPORT_PROFILES: ReadonlyArray<ExportProfileDescriptor> = [
  {
    id: 'studio_json',
    name: 'Internal Studio Format',
    description: 'Full Authoring Studio animation package with manifest and metadata',
    fileExtension: '.studio.json',
    mimeType: 'application/json',
    supportedFeatures: ['clips', 'tracks', 'keyframes', 'easings', 'triggers', 'manifest'],
  },
  {
    id: 'pure_json',
    name: 'Pure Animation DTO',
    description: 'Raw AnimationTimeline DTO without Studio metadata',
    fileExtension: '.json',
    mimeType: 'application/json',
    supportedFeatures: ['clips', 'tracks', 'keyframes', 'easings'],
  },
  {
    id: 'lottie_metadata',
    name: 'Lottie Export Profile Descriptor',
    description: 'Target export profile for Lottie-compatible vector animations',
    fileExtension: '.lottie.json',
    mimeType: 'application/json',
    supportedFeatures: ['opacity', 'translate', 'scale', 'rotate', 'cubic-bezier'],
  },
  {
    id: 'waapi_metadata',
    name: 'Web Animations API Descriptor',
    description: 'Target export profile for browser native Web Animations API',
    fileExtension: '.waapi.json',
    mimeType: 'application/json',
    supportedFeatures: ['keyframes', 'easings', 'fillMode', 'iterations'],
  },
];

/**
 * Retrieves an export profile descriptor by ID.
 */
export function getExportProfile(profileId: ExportProfileType): ExportProfileDescriptor {
  const profile = EXPORT_PROFILES.find((p) => p.id === profileId);
  if (!profile) {
    throw new Error(`Unknown export profile ID: "${profileId}"`);
  }
  return profile;
}
