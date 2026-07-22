import { z } from 'zod';

export interface PackageInfo {
  id: string;
  version: string;
  priority: number;
}

export interface ThemeInfo {
  id: string;
  version: string;
  settings: Record<string, any>;
}

export interface RuntimeSnapshot {
  tenantId: string;
  engineVersion: string;
  schemaVersion: string;
  packages: PackageInfo[];
  capabilities: string[];
  theme: ThemeInfo;
  configuration: Record<string, any>;
  runtimeHash: string;
  composedAt: string;
}

export const PackageInfoSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  priority: z.number().int().nonnegative(),
});

export const ThemeInfoSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  settings: z.record(z.string(), z.any()),
});

export const RuntimeSnapshotSchema = z.object({
  tenantId: z.string().min(1),
  engineVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
  packages: z.array(PackageInfoSchema),
  capabilities: z.array(z.string()),
  theme: ThemeInfoSchema,
  configuration: z.record(z.string(), z.any()),
  runtimeHash: z.string().min(1),
  composedAt: z.string().datetime(),
});

/**
 * Recursively freezes an object to ensure complete immutability.
 */
export function deepFreeze<T extends Record<string, any>>(obj: T): T {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (
      obj.hasOwnProperty(prop) &&
      obj[prop] !== null &&
      (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
}
