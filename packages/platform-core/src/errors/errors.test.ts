import { describe, it, expect, vi } from 'vitest';
import {
  PlatformError,
  ConfigurationError,
  RuntimeError,
  TenantResolutionError,
  SecurityError,
} from './PlatformError';
import { ConsolePlatformLogger } from '../logger/Logger';

describe('Platform Error Engine', () => {
  it('Should correctly instantiate base PlatformError and preserve metadata fields', () => {
    const error = new PlatformError({
      message: 'Failed check',
      code: 'TEST_ERROR',
      severity: 'HIGH',
      module: 'TEST_MODULE',
      correlationId: 'corr_123',
      causationId: 'cause_456',
      tenantId: 'tenant_abc',
      metadata: { detail: 'something' },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PlatformError');
    expect(error.message).toBe('Failed check');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.severity).toBe('HIGH');
    expect(error.module).toBe('TEST_MODULE');
    expect(error.correlationId).toBe('corr_123');
    expect(error.causationId).toBe('cause_456');
    expect(error.tenantId).toBe('tenant_abc');
    expect(error.metadata).toEqual({ detail: 'something' });
  });

  it('Should recursively freeze metadata object to prevent runtime modifications', () => {
    const error = new PlatformError({
      message: 'Failure',
      code: 'TEST_ERR',
      severity: 'LOW',
      module: 'TEST',
      metadata: { nested: { value: 'immutable' } },
    });

    expect(Object.isFrozen(error.metadata)).toBe(true);
    expect(Object.isFrozen(error.metadata?.nested)).toBe(true);

    expect(() => {
      error.metadata!.nested.value = 'mutated';
    }).toThrow();
  });

  it('Should correctly serialize class to JSON structure including trace stack', () => {
    const error = new RuntimeError('Execution failed', 'req_999', { line: 42 });
    const json = error.toJSON();

    expect(json.name).toBe('RuntimeError');
    expect(json.code).toBe('RUNTIME_EXECUTION_FAILED');
    expect(json.severity).toBe('HIGH');
    expect(json.module).toBe('RUNTIME');
    expect(json.correlationId).toBe('req_999');
    expect(json.metadata).toEqual({ line: 42 });
    expect(json.stack).toBeDefined();
  });

  it('Should map correct severity profiles to specific subclasses', () => {
    const configErr = new ConfigurationError('Invalid configuration');
    expect(configErr.severity).toBe('FATAL');

    const resolutionErr = new TenantResolutionError('Tenant not found', 'TENANT_NOT_FOUND');
    expect(resolutionErr.severity).toBe('MEDIUM');

    const suspendedErr = new TenantResolutionError('Tenant suspended', 'TENANT_SUSPENDED');
    expect(suspendedErr.severity).toBe('HIGH');
  });

  it('Should sanitize SecurityError metadata to prevent leakage of credentials', () => {
    const error = new SecurityError('Access denied', 'req_sec', {
      token: 'jwt_secret_token_123',
      secret: 'my_private_key',
      password: 'plain_password',
      safeField: 'harmless_info',
    });

    expect(error.metadata?.token).toBeUndefined();
    expect(error.metadata?.secret).toBeUndefined();
    expect(error.metadata?.password).toBeUndefined();
    expect(error.metadata?.safeField).toBe('harmless_info');
  });

  it('Should integrate with PlatformLogger and EventBus to emit error telemetry events', async () => {
    const mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    const logger = new ConsolePlatformLogger();
    logger.setEventBus(mockEventBus);
    
    // Zapobieganie wypisywaniu logu na konsolę podczas testu
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new RuntimeError('Database disconnected', 'req_integration');

    // Symulacja standardowej logiki globalnego catchera
    try {
      throw error;
    } catch (thrown) {
      const err = thrown as RuntimeError;
      logger.error({
        message: err.message,
        correlationId: err.correlationId,
        module: err.module,
        error: err,
      });
    }

    // Weryfikacja wysłania eventu telemetrycznego przez logger
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event = mockEventBus.publish.mock.calls[0][0];
    expect(event.eventType).toBe('System.LogCreated');
    expect(event.correlationId).toBe('req_integration');
    expect(event.payload.level).toBe('ERROR');
    expect(event.payload.errorMessage).toBe('Database disconnected');
    
    vi.restoreAllMocks();
  });
});
