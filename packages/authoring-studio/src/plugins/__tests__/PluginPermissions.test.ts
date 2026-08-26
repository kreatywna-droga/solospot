import { describe, it, expect } from 'vitest';
import {
  createPluginPermissionsConfig,
  hasCapabilityPermission,
} from '../PluginPermissions';

describe('PluginPermissions (PM43, ETAP 1 & DECISION-081)', () => {
  it('evaluates capability permission grants (DECISION-081)', () => {
    const config = createPluginPermissionsConfig(
      ['timeline:read', 'assets:write'],
      ['timeline:read'] // assets:write not granted
    );

    expect(hasCapabilityPermission(config, 'timeline:read')).toBe(true);
    expect(hasCapabilityPermission(config, 'assets:write')).toBe(false);
    expect(hasCapabilityPermission(config, 'timeline:write')).toBe(false);
  });
});
