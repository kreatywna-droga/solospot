import { PlatformLogger, LoggerPayload } from '../types';

/**
 * Concrete implementation of the PlatformLogger interface.
 * Logs structured JSON to stdout/stderr and integrates lazily with PlatformEventBus.
 */
export class ConsolePlatformLogger implements PlatformLogger {
  private eventBus: any | null = null;
  private isPublishing = false; // Guard to prevent infinite logging recursion loops

  /**
   * Inject EventBus instance lazily after both modules are initialized.
   */
  public setEventBus(eventBus: any): void {
    this.eventBus = eventBus;
  }

  public info(payload: LoggerPayload): void {
    const formatted = this.formatLog('INFO', payload);
    console.log(formatted);
    this.emitLogEvent('INFO', payload);
  }

  public warn(payload: LoggerPayload): void {
    const formatted = this.formatLog('WARN', payload);
    console.warn(formatted);
    this.emitLogEvent('WARN', payload);
  }

  public error(payload: LoggerPayload & { readonly error?: Error }): void {
    const formatted = this.formatLog('ERROR', payload, payload.error);
    console.error(formatted);
    this.emitLogEvent('ERROR', payload, payload.error);
  }

  public fatal(payload: LoggerPayload & { readonly error?: Error }): void {
    const formatted = this.formatLog('FATAL', payload, payload.error);
    console.error(formatted);
    this.emitLogEvent('FATAL', payload, payload.error);
  }

  /**
   * Formats the log payload into a standardized JSON structure.
   */
  private formatLog(
    level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
    payload: LoggerPayload,
    error?: Error
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message: payload.message,
      correlationId: payload.correlationId,
      causationId: payload.causationId,
      tenantId: payload.tenantId,
      module: payload.module,
      eventType: payload.eventType,
      metadata: payload.metadata || {},
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    });
  }

  /**
   * Publishes the telemetry event to the platform EventBus.
   */
  private emitLogEvent(
    level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
    payload: LoggerPayload,
    error?: Error
  ): void {
    if (!this.eventBus || this.isPublishing) {
      return;
    }

    // Do not emit log events for telemetry events themselves to prevent infinite cycles
    if (payload.eventType === 'System.LogCreated') {
      return;
    }

    this.isPublishing = true;

    try {
      this.eventBus.publish({
        eventId: `evt_log_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'System.LogCreated',
        timestamp: new Date().toISOString(),
        correlationId: payload.correlationId,
        causationId: payload.causationId,
        tenantId: payload.tenantId,
        payload: {
          level,
          message: payload.message,
          module: payload.module,
          metadata: payload.metadata,
          errorName: error?.name,
          errorMessage: error?.message,
        },
      }).catch((err: any) => {
        // Safe fallback write to stderr to avoid crashing the logging pipeline
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: 'Failed to publish System.LogCreated event',
            module: 'LOGGER',
            error: {
              message: err instanceof Error ? err.message : String(err),
            },
          })
        );
      });
    } catch (err: any) {
      // Catch synchronous errors during publish
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Synchronous error occurred during event publishing',
          module: 'LOGGER',
          error: {
            message: err instanceof Error ? err.message : String(err),
          },
        })
      );
    } finally {
      this.isPublishing = false;
    }
  }
}
