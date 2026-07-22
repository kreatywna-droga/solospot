export interface LogContext {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly module?: string;
  readonly eventType?: string;
}

export interface LoggerPayload {
  readonly message: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly module?: string;
  readonly eventType?: string;
  readonly metadata?: Record<string, any>;
}

export interface PlatformLogger {
  info(payload: LoggerPayload): void;
  warn(payload: LoggerPayload): void;
  error(payload: LoggerPayload & { readonly error?: Error }): void;
  fatal(payload: LoggerPayload & { readonly error?: Error }): void;
  setEventBus(eventBus: any): void; // Weak typing/any here to prevent circular dependency imports in typescript compilation
}

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'FATAL';

export interface PlatformErrorOptions {
  readonly message: string;
  readonly code: string;
  readonly severity: ErrorSeverity;
  readonly module: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly metadata?: Record<string, any>;
}

export type HealthStatus = 'READY' | 'DEGRADED' | 'FAILED';

export interface HealthResult {
  readonly status: HealthStatus;
  readonly message?: string;
  readonly timestamp: string;
  readonly details?: Record<string, any>;
}

export interface HealthCheck {
  readonly name: string;
  check(): Promise<HealthResult>;
}

export interface AggregatedHealthResult {
  readonly status: HealthStatus;
  readonly timestamp: string;
  readonly components: Record<string, HealthResult>;
}

export type PlatformState = 'CREATED' | 'INITIALIZING' | 'READY' | 'DEGRADED' | 'FAILED';

export interface BootstrapContext {
  readonly platformVersion: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly initializedModules: string[];
  readonly healthStatus: PlatformState;
  readonly bootstrapTimeMs: number;
  readonly errors: Array<{ module: string; message: string; timestamp: string }>;
}
