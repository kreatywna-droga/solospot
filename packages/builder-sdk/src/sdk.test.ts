import { describe, it, expect } from 'vitest';
import {
  SDK_VERSION,
  MIN_COMPATIBLE_SDK_VERSION,
  PluginManifest,
  PropertyExtension,
  CommandExtension,
  BuilderEvent,
} from './index';

describe('Builder SDK Contracts & Integrity', () => {
  it('should export correct SDK version constants', () => {
    expect(SDK_VERSION).toBe('2.0.0');
    expect(MIN_COMPATIBLE_SDK_VERSION).toBe('2.0.0');
  });

  it('should conform to PluginManifest interface contract', () => {
    const manifest: PluginManifest = {
      id: 'plugin:custom-border-extension',
      name: 'Custom Border Extension',
      version: '1.0.0',
      author: 'WEB FACTOR Team',
      description: 'Adds custom border rendering capabilities',
      requiredSDKVersion: SDK_VERSION,
      capabilities: {
        canRegisterProperties: true,
      },
    };

    expect(manifest.id).toContain('plugin:');
    expect(manifest.requiredSDKVersion).toBe('2.0.0');
  });

  it('should conform to PropertyExtension contract', () => {
    const borderExtension: PropertyExtension<string> = {
      id: 'ext:border-width',
      propertyName: 'borderWidth',
      category: 'border',
      defaultValue: '1px',
      validate: (val: string) => typeof val === 'string' && val.endsWith('px'),
      toCSS: (val: string) => ({ borderWidth: val }),
    };

    expect(borderExtension.validate('2px')).toBe(true);
    expect(borderExtension.validate('invalid')).toBe(false);
    expect(borderExtension.toCSS('4px')).toEqual({ borderWidth: '4px' });
  });

  it('should conform to CommandExtension contract', () => {
    const cmdExt: CommandExtension<{ property: string; value: any }, boolean> = {
      id: 'cmd:update-props',
      commandName: 'UPDATE_PROPS',
      validate: (args) => Boolean(args.property),
      execute: (args) => true,
    };

    expect(cmdExt.validate({ property: 'border', value: 'solid' })).toBe(true);
    expect(cmdExt.execute({ property: 'border', value: 'solid' })).toBe(true);
  });

  it('should format BuilderEvent correctly', () => {
    const event: BuilderEvent<{ selectedId: string }> = {
      type: 'selection:changed',
      payload: { selectedId: 'comp_123' },
      metadata: {
        timestamp: new Date().toISOString(),
        sourceId: 'canvas',
      },
    };

    expect(event.type).toBe('selection:changed');
    expect(event.payload.selectedId).toBe('comp_123');
  });
});
