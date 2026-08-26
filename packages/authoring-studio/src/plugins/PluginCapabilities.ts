/**
 * PluginCapabilities.ts — PM43 Plugin Capabilities Model (ETAP 1)
 *
 * DECISION-081: Wszystkie pluginy działają przez Capability API.
 *
 * Granular capability descriptors for Studio Extension Platform.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type PluginCapability =
  | 'timeline:read'
  | 'timeline:write'
  | 'inspector:register'
  | 'assets:read'
  | 'assets:write'
  | 'production:export'
  | 'production:import'
  | 'commands:register'
  | 'shortcuts:register'
  | 'tools:register';

export interface CapabilityDescriptor {
  readonly capability: PluginCapability;
  readonly description: string;
  readonly isRestricted: boolean;
}

export const KNOWN_CAPABILITIES: ReadonlyArray<CapabilityDescriptor> = [
  { capability: 'timeline:read', description: 'Read animation timeline DTO structure', isRestricted: false },
  { capability: 'timeline:write', description: 'Modify animation timeline DTO structure', isRestricted: true },
  { capability: 'inspector:register', description: 'Register custom property editors', isRestricted: false },
  { capability: 'assets:read', description: 'Browse and search asset registry', isRestricted: false },
  { capability: 'assets:write', description: 'Register or modify asset items', isRestricted: true },
  { capability: 'production:export', description: 'Export animation DTO packages', isRestricted: false },
  { capability: 'production:import', description: 'Import animation DTO packages', isRestricted: true },
  { capability: 'commands:register', description: 'Register productivity commands', isRestricted: false },
  { capability: 'shortcuts:register', description: 'Register keyboard shortcuts', isRestricted: false },
  { capability: 'tools:register', description: 'Register custom timeline tools', isRestricted: false },
];
