import { PlatformState } from '../types';

export const BootstrapStates = {
  CREATED: 'CREATED' as PlatformState,
  INITIALIZING: 'INITIALIZING' as PlatformState,
  READY: 'READY' as PlatformState,
  DEGRADED: 'DEGRADED' as PlatformState,
  FAILED: 'FAILED' as PlatformState,
} as const;
