import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsolePlatformLogger } from './Logger';

describe('ConsolePlatformLogger', () => {
  let logger: ConsolePlatformLogger;
  let logSpy: any;
  let warnSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    logger = new ConsolePlatformLogger();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Should correctly format and print INFO logs to console.log', () => {
    logger.info({
      message: 'Store resolved',
      correlationId: 'req_123',
      tenantId: 'tenant_abc',
      module: 'RESOLVER',
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const printed = JSON.parse(logSpy.mock.calls[0][0]);
    
    expect(printed.level).toBe('INFO');
    expect(printed.message).toBe('Store resolved');
    expect(printed.correlationId).toBe('req_123');
    expect(printed.tenantId).toBe('tenant_abc');
    expect(printed.module).toBe('RESOLVER');
    expect(printed.timestamp).toBeDefined();
  });

  it('Should correctly print WARN logs to console.warn', () => {
    logger.warn({
      message: 'Cache miss',
      correlationId: 'req_456',
      tenantId: 'tenant_xyz',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const printed = JSON.parse(warnSpy.mock.calls[0][0]);

    expect(printed.level).toBe('WARN');
    expect(printed.message).toBe('Cache miss');
    expect(printed.correlationId).toBe('req_456');
    expect(printed.tenantId).toBe('tenant_xyz');
  });

  it('Should correctly print ERROR logs and include serializable error stack', () => {
    const errorObj = new Error('Database disconnected');
    logger.error({
      message: 'Failed database call',
      correlationId: 'req_789',
      tenantId: 'tenant_err',
      error: errorObj,
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const printed = JSON.parse(errorSpy.mock.calls[0][0]);

    expect(printed.level).toBe('ERROR');
    expect(printed.message).toBe('Failed database call');
    expect(printed.correlationId).toBe('req_789');
    expect(printed.tenantId).toBe('tenant_err');
    expect(printed.error.name).toBe('Error');
    expect(printed.error.message).toBe('Database disconnected');
    expect(printed.error.stack).toBeDefined();
  });

  it('Should not leak cross-tenant information and isolate properties', () => {
    logger.info({
      message: 'Data check',
      tenantId: 'tenant_A',
    });

    const printed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(printed.tenantId).toBe('tenant_A');
    expect(printed.tenantId).not.toBe('tenant_B');
  });

  it('Should publish System.LogCreated event if EventBus is configured', async () => {
    const mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    logger.setEventBus(mockEventBus);

    logger.info({
      message: 'Bootstrap done',
      correlationId: 'req_boot',
      tenantId: 'system',
    });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event = mockEventBus.publish.mock.calls[0][0];
    expect(event.eventType).toBe('System.LogCreated');
    expect(event.correlationId).toBe('req_boot');
    expect(event.tenantId).toBe('system');
    expect(event.payload.message).toBe('Bootstrap done');
  });

  it('Should log to console and not throw if EventBus publish fails (Failure Isolation)', () => {
    const mockEventBus = {
      publish: vi.fn().mockRejectedValue(new Error('EventBus crash')),
    };

    logger.setEventBus(mockEventBus);

    // This should execute completely without throwing an exception
    expect(() => {
      logger.info({
        message: 'Resilient log',
        correlationId: 'req_resilient',
      });
    }).not.toThrow();

    // Verify stdout still has the message
    expect(logSpy).toHaveBeenCalledTimes(1);
    const printed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(printed.message).toBe('Resilient log');
  });
});
