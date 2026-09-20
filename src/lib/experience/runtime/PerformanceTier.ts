/**
 * PerformanceTier.ts — Automatic Device Performance Classification
 *
 * Detects device capability and assigns HIGH / MEDIUM / LOW tier.
 * Used to:
 *   - Cap particle counts
 *   - Reduce shader complexity
 *   - Disable expensive effects on low-end devices
 *   - Scale render resolution
 *
 * Detection signals:
 *   - Hardware concurrency (CPU cores)
 *   - Device memory (if available)
 *   - WebGL renderer string
 *   - Screen pixel ratio
 *   - Navigator platform
 */

import type { PerformanceTier } from '../ExperienceRuntimeTypes';

let cachedTier: PerformanceTier | null = null;

function getWebGLRendererInfo(): { renderer: string; vendor: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return { renderer: 'unknown', vendor: 'unknown' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      const result = {
        renderer: gl.getParameter(gl.RENDERER),
        vendor: gl.getParameter(gl.VENDOR),
      };
      canvas.remove();
      return result;
    }

    const result = {
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    };
    canvas.remove();
    return result;
  } catch {
    return { renderer: 'unknown', vendor: 'unknown' };
  }
}

function isLowPowerDevice(): boolean {
  try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
      platform?: string;
    };

    // Check device memory (Chrome only)
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return true;

    // Check CPU cores
    if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return true;

    // Check platform for known low-power mobile
    const platform = (nav.platform || '').toLowerCase();
    if (platform.includes('android') && nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function isHighEndDevice(): boolean {
  try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
    };

    const { renderer } = getWebGLRendererInfo();
    const rendererLower = renderer.toLowerCase();

    // High-end GPU detection
    const highEndGPUs = [
      'rtx', 'gtx 10', 'gtx 20', 'gtx 30', 'gtx 40',
      'radeon rx', 'radeon pro',
      'apple m1', 'apple m2', 'apple m3',
      'adreno 6', 'adreno 7',
      'mail-g', 'xclipse',
    ];
    const hasHighEndGPU = highEndGPUs.some(gpu => rendererLower.includes(gpu));

    // High CPU + memory
    const cores = nav.hardwareConcurrency ?? 0;
    const memory = nav.deviceMemory ?? 0;
    const hasHighResources = cores >= 8 && memory >= 8;

    // High pixel ratio (Retina/HiDPI)
    const pixelRatio = window.devicePixelRatio || 1;
    const isHighRes = pixelRatio >= 2;

    return hasHighEndGPU || hasHighResources || (isHighRes && cores >= 4);
  } catch {
    return false;
  }
}

/**
 * Detect the performance tier of the current device.
 * Result is cached after first call.
 */
export function detectPerformanceTier(): PerformanceTier {
  if (cachedTier) return cachedTier;

  if (typeof window === 'undefined') {
    cachedTier = 'medium';
    return cachedTier;
  }

  if (isLowPowerDevice()) {
    cachedTier = 'low';
  } else if (isHighEndDevice()) {
    cachedTier = 'high';
  } else {
    cachedTier = 'medium';
  }

  return cachedTier;
}

/**
 * Get performance-appropriate values for a given setting.
 * Returns the value matching the device tier.
 */
export function tierValue<T>(values: { high: T; medium: T; low: T }): T {
  const tier = detectPerformanceTier();
  return values[tier];
}

/**
 * Get maximum particle count for current device tier.
 */
export function getMaxParticleCount(): number {
  return tierValue({ high: 800, medium: 400, low: 150 });
}

/**
 * Get maximum simultaneous WebGL contexts allowed.
 */
export function getMaxWebGLContexts(): number {
  return tierValue({ high: 8, medium: 4, low: 2 });
}

/**
 * Get recommended shader complexity.
 */
export function getShaderComplexity(): 'high' | 'medium' | 'low' {
  return tierValue({ high: 'high' as const, medium: 'medium' as const, low: 'low' as const });
}

/**
 * Force a specific tier (for testing).
 */
export function setPerformanceTierForTesting(tier: PerformanceTier | null): void {
  cachedTier = tier;
}
