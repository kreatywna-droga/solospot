import { PlatformErrorOptions, ErrorSeverity } from '../types';

/**
 * Base error class for all platform and domain specific errors.
 * Extends JS Error to carry telemetry, severity levels, and execution contexts.
 */
export class PlatformError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly module: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly tenantId?: string;
  public readonly metadata?: Record<string, any>;

  constructor(options: PlatformErrorOptions) {
    super(options.message);

    this.name = this.constructor.name;
    this.code = options.code;
    this.severity = options.severity;
    this.module = options.module;
    this.correlationId = options.correlationId;
    this.causationId = options.causationId;
    this.tenantId = options.tenantId;

    if (options.metadata) {
      this.metadata = this.deepFreeze({ ...options.metadata });
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes the error to a clean JSON telemetry payload.
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      module: this.module,
      correlationId: this.correlationId,
      causationId: this.causationId,
      tenantId: this.tenantId,
      metadata: this.metadata,
      stack: this.stack,
    };
  }

  private deepFreeze<T extends Record<string, any>>(obj: T): T {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (
        obj.hasOwnProperty(prop) &&
        obj[prop] !== null &&
        (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
        !Object.isFrozen(obj[prop])
      ) {
        this.deepFreeze(obj[prop]);
      }
    });
    return obj;
  }
}

/**
 * Thrown when configuration variables fail parsing or are missing.
 */
export class ConfigurationError extends PlatformError {
  constructor(message: string, correlationId?: string, metadata?: Record<string, any>) {
    super({
      message,
      code: 'CONFIG_VALIDATION_FAILED',
      severity: 'FATAL',
      module: 'CONFIGURATION',
      correlationId,
      metadata,
    });
  }
}

/**
 * Thrown for runtime execution failures within composition and rendering engines.
 */
export class RuntimeError extends PlatformError {
  constructor(message: string, correlationId?: string, metadata?: Record<string, any>) {
    super({
      message,
      code: 'RUNTIME_EXECUTION_FAILED',
      severity: 'HIGH',
      module: 'RUNTIME',
      correlationId,
      metadata,
    });
  }
}

/**
 * Thrown when tenant lookup fails (not found or status is suspended/maintenance).
 */
export class TenantResolutionError extends PlatformError {
  constructor(message: string, code: 'TENANT_NOT_FOUND' | 'TENANT_SUSPENDED', correlationId?: string, metadata?: Record<string, any>) {
    super({
      message,
      code,
      severity: code === 'TENANT_SUSPENDED' ? 'HIGH' : 'MEDIUM',
      module: 'TENANT_RESOLVER',
      correlationId,
      metadata,
    });
  }
}

/**
 * Thrown when store provisioning fails during dynamic sandbox setup.
 */
export class ProvisioningError extends PlatformError {
  constructor(message: string, correlationId?: string, metadata?: Record<string, any>) {
    super({
      message,
      code: 'PROVISIONING_STEP_FAILED',
      severity: 'HIGH',
      module: 'PROVISIONING_ENGINE',
      correlationId,
      metadata,
    });
  }
}

/**
 * Thrown when plugins or packages mismatch versions or fail to load.
 */
export class PackageError extends PlatformError {
  constructor(message: string, correlationId?: string, metadata?: Record<string, any>) {
    super({
      message,
      code: 'DEPENDENCY_RESOLVE_FAILED',
      severity: 'HIGH',
      module: 'PACKAGE_RUNTIME',
      correlationId,
      metadata,
    });
  }
}

/**
 * Thrown on security rule violations, token forgery, or cross-tenant access attempts.
 */
export class SecurityError extends PlatformError {
  constructor(message: string, correlationId?: string, metadata?: Record<string, any>) {
    // Sanitize metadata to avoid leaking raw secret keys / tokens in telemetry logs
    const sanitizedMetadata = metadata ? { ...metadata } : {};
    if (sanitizedMetadata.token) delete sanitizedMetadata.token;
    if (sanitizedMetadata.secret) delete sanitizedMetadata.secret;
    if (sanitizedMetadata.password) delete sanitizedMetadata.password;

    super({
      message,
      code: 'ACCESS_DENIED',
      severity: 'FATAL',
      module: 'SECURITY',
      correlationId,
      metadata: sanitizedMetadata,
    });
  }
}
