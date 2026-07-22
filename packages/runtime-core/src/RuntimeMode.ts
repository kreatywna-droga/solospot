export type RuntimeMode = 'LIVE' | 'PREVIEW' | 'EXPORT';

export const RUNTIME_MODES: readonly RuntimeMode[] = ['LIVE', 'PREVIEW', 'EXPORT'] as const;

export function isRuntimeMode(value: string): value is RuntimeMode {
  return RUNTIME_MODES.includes(value as RuntimeMode);
}

export function parseRuntimeMode(value: string, fallback: RuntimeMode = 'LIVE'): RuntimeMode {
  return isRuntimeMode(value) ? value : fallback;
}