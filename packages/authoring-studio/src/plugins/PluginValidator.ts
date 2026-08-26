/**
 * PluginValidator.ts — PM43 Plugin Validator (ETAP 2)
 *
 * Manifest structure and API compatibility validator.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginManifest } from './PluginManifest';
import { validatePluginManifest } from './PluginManifest';

export interface PluginCompatibilityReport {
  readonly isCompatible: boolean;
  readonly targetApiVersion: string;
  readonly studioApiVersion: string;
  readonly errors: ReadonlyArray<string>;
}

export function validatePluginCompatibility(
  manifest: PluginManifest,
  currentStudioApiVersion: string = '1.0.0'
): PluginCompatibilityReport {
  const manifestValidation = validatePluginManifest(manifest);
  const errors: string[] = [...manifestValidation.errors];

  const targetApiVersion = manifest.metadata?.apiVersion ?? '0.0.0';
  const targetMajor = parseInt(targetApiVersion.split('.')[0] ?? '0', 10);
  const currentMajor = parseInt(currentStudioApiVersion.split('.')[0] ?? '0', 10);

  if (targetMajor !== currentMajor) {
    errors.push(
      `Incompatible Extension API version "${targetApiVersion}". Studio expected major version ${currentMajor}.`
    );
  }

  return {
    isCompatible: errors.length === 0,
    targetApiVersion,
    studioApiVersion: currentStudioApiVersion,
    errors,
  };
}
