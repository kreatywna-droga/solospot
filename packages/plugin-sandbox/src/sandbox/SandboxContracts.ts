export type SandboxEnvironment = 'iframe' | 'worker' | 'isolated-vm' | 'mock';

export interface SandboxLimits {
  maxMemoryMb: number;
  maxExecutionTimeMs: number;
  maxNetworkRequestsPerMin: number;
  allowDOMAccess: boolean;
}

export interface SandboxCapabilities {
  allowFetch: boolean;
  allowLocalStorage: boolean;
  allowPostMessage: boolean;
  allowDOMMutation: boolean;
}

export interface SandboxContext {
  pluginId: string;
  environment: SandboxEnvironment;
  limits: SandboxLimits;
  capabilities: SandboxCapabilities;
  activePermissions: string[];
  createdAt: string;
}

export interface SandboxResult<T = any> {
  pluginId: string;
  success: boolean;
  durationMs: number;
  memoryUsedMb?: number;
  output?: T;
  errors?: string[];
}
