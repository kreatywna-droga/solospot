/**
 * ResourceTracker.ts — GPU & DOM Resource Lifecycle Management
 *
 * Prevents resource leaks by tracking all allocated resources and
 * providing bulk disposal on unmount or navigation.
 *
 * Every engine MUST register its resources here:
 *   - WebGL contexts
 *   - WebGL textures, buffers, programs, render targets
 *   - Canvas 2D contexts
 *   - Video elements
 *   - Animation frames (rAF IDs)
 *   - Event listeners
 *   - Three.js scenes, meshes, materials, textures, geometries
 *
 * Usage:
 *   const tracker = createResourceTracker('my-engine');
 *   tracker.track('webgl-context', () => gl.getExtension('WEBGL_lose_context')?.loseContext());
 *   // ... on unmount:
 *   tracker.disposeAll();
 */

import type { ResourceType, TrackedResource } from '../ExperienceRuntimeTypes';

interface ResourceTrackerInstance {
  readonly id: string;
  track(type: ResourceType, dispose: () => void, size?: number): string;
  untrack(resourceId: string): void;
  disposeAll(): void;
  getStats(): ResourceTrackerStats;
}

export interface ResourceTrackerStats {
  trackerId: string;
  totalResources: number;
  resourcesByType: Partial<Record<ResourceType, number>>;
  estimatedMemoryBytes: number;
}

const instances = new Map<string, ResourceTrackerInstance>();
const allResources = new Map<string, TrackedResource & { trackerId: string }>();

let globalResourceId = 0;

function generateResourceId(): string {
  return `res_${++globalResourceId}_${Date.now().toString(36)}`;
}

/**
 * Create a named resource tracker for a specific engine.
 */
export function createResourceTracker(trackerId: string): ResourceTrackerInstance {
  if (instances.has(trackerId)) {
    return instances.get(trackerId)!;
  }

  const instance: ResourceTrackerInstance = {
    id: trackerId,

    track(type: ResourceType, dispose: () => void, size?: number): string {
      const resourceId = generateResourceId();
      const resource: TrackedResource & { trackerId: string } = {
        id: resourceId,
        type,
        createdAt: Date.now(),
        size,
        dispose,
        trackerId,
      };
      allResources.set(resourceId, resource);
      return resourceId;
    },

    untrack(resourceId: string): void {
      const resource = allResources.get(resourceId);
      if (resource && resource.trackerId === trackerId) {
        try {
          resource.dispose();
        } catch (e) {
          console.warn(`[ResourceTracker] Error disposing ${resource.type}:`, e);
        }
        allResources.delete(resourceId);
      }
    },

    disposeAll(): void {
      const toDispose = Array.from(allResources.values()).filter(
        r => r.trackerId === trackerId
      );
      for (const resource of toDispose) {
        try {
          resource.dispose();
        } catch (e) {
          console.warn(`[ResourceTracker] Error disposing ${resource.type}:`, e);
        }
        allResources.delete(resource.id);
      }
    },

    getStats(): ResourceTrackerStats {
      const resources = Array.from(allResources.values()).filter(
        r => r.trackerId === trackerId
      );
      const byType: Partial<Record<ResourceType, number>> = {};
      let memory = 0;
      for (const r of resources) {
        byType[r.type] = (byType[r.type] || 0) + 1;
        memory += r.size || 0;
      }
      return {
        trackerId,
        totalResources: resources.length,
        resourcesByType: byType,
        estimatedMemoryBytes: memory,
      };
    },
  };

  instances.set(trackerId, instance);
  return instance;
}

/**
 * Get global resource statistics across all trackers.
 */
export function getGlobalResourceStats(): {
  totalTrackers: number;
  totalResources: number;
  resourcesByType: Partial<Record<ResourceType, number>>;
  estimatedMemoryBytes: number;
} {
  const resources = Array.from(allResources.values());
  const byType: Partial<Record<ResourceType, number>> = {};
  let memory = 0;
  for (const r of resources) {
    byType[r.type] = (byType[r.type] || 0) + 1;
    memory += r.size || 0;
  }
  return {
    totalTrackers: instances.size,
    totalResources: resources.length,
    resourcesByType: byType,
    estimatedMemoryBytes: memory,
  };
}

/**
 * Dispose ALL resources across ALL trackers.
 * Use on full page navigation or app unmount.
 */
export function disposeAllResources(): void {
  for (const instance of instances.values()) {
    instance.disposeAll();
  }
  instances.clear();
  allResources.clear();
  globalResourceId = 0;
}

/**
 * Auto-dispose resources older than maxAgeMs.
 * Use for periodic cleanup of orphaned resources.
 */
export function disposeStaleResources(maxAgeMs: number = 60_000): number {
  const now = Date.now();
  let disposed = 0;

  for (const [id, resource] of allResources) {
    if (now - resource.createdAt > maxAgeMs) {
      try {
        resource.dispose();
      } catch {
        // ignore
      }
      allResources.delete(id);
      disposed++;
    }
  }

  return disposed;
}
