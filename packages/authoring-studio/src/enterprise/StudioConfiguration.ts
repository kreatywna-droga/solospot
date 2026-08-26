/**
 * StudioConfiguration.ts — PM46 Studio Configuration Service (ETAP 7)
 *
 * DECISION-099: Health, Diagnostics i Configuration są pasywnymi usługami platformowymi, bez logiki wykonywania Runtime.
 *
 * Studio configuration schemas, environment profiles, and configuration validators.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface EnvironmentProfile {
  readonly profileId: string;
  readonly name: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly settings: Record<string, unknown>;
}

export interface ConfigurationSchema {
  readonly schemaVersion: string;
  readonly requiredKeys: ReadonlyArray<string>;
}

export interface StudioConfiguration {
  readonly profile: EnvironmentProfile;
  readonly schema: ConfigurationSchema;
}

export interface ConfigurationValidationReport {
  readonly isValid: boolean;
  readonly missingKeys: ReadonlyArray<string>;
}

export function validateStudioConfiguration(
  config: StudioConfiguration
): ConfigurationValidationReport {
  const missingKeys: string[] = [];

  for (const key of config.schema.requiredKeys) {
    if (config.profile.settings[key] === undefined) {
      missingKeys.push(key);
    }
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}
