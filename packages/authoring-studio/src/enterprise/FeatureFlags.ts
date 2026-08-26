/**
 * FeatureFlags.ts — PM46 Feature Flags & Rollout Management (ETAP 2)
 *
 * DECISION-096: Feature Flags są niezależne od Runtime Engine i sterują wyłącznie konfiguracją funkcji.
 *
 * Feature flag models, feature gates, rollout strategies, and environment overrides.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type RolloutStrategyType = 'boolean' | 'percentage' | 'user_segment' | 'environment_override';

export interface RolloutStrategy {
  readonly type: RolloutStrategyType;
  readonly percentage?: number; // 0 to 100
  readonly allowedSegments?: ReadonlyArray<string>;
}

export interface FeatureFlagModel {
  readonly flagId: string;
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly defaultValue: boolean;
  readonly strategy: RolloutStrategy;
  readonly environmentOverrides: Record<string, boolean>; // e.g. { "staging": true, "production": false }
}

export function isFeatureGateEnabled(
  flag: FeatureFlagModel,
  environment: string = 'production',
  userSegment?: string
): boolean {
  if (flag.environmentOverrides[environment] !== undefined) {
    return flag.environmentOverrides[environment];
  }

  if (flag.strategy.type === 'boolean') {
    return flag.defaultValue;
  }

  if (flag.strategy.type === 'user_segment' && userSegment && flag.strategy.allowedSegments) {
    return flag.strategy.allowedSegments.includes(userSegment);
  }

  return flag.defaultValue;
}
