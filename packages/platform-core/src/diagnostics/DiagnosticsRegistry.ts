import { HealthCheck, HealthResult, HealthStatus, AggregatedHealthResult } from '../types';

/**
 * DiagnosticsRegistry is responsible for managing diagnostic checks of critical
 * system modules and aggregates their status into a single platform health profile.
 */
export class DiagnosticsRegistry {
  private readonly checks = new Map<string, HealthCheck>();

  /**
   * Registers a component health check.
   */
  public register(check: HealthCheck): void {
    if (this.checks.has(check.name)) {
      throw new Error(`Health check with name "${check.name}" is already registered.`);
    }
    this.checks.set(check.name, check);
  }

  /**
   * Returns all registered health checks.
   */
  public getChecks(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  /**
   * Evaluates status for all components and aggregates them into a final health score.
   * Enforces a Diagnostic Timeout Policy (default 1000ms) to prevent hanging checks.
   */
  public async evaluate(timeoutMs = 1000): Promise<AggregatedHealthResult> {
    const components: Record<string, HealthResult> = {};
    let overallStatus: HealthStatus = 'READY';

    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await this.checkWithTimeout(check, timeoutMs);
        components[name] = result;

        if (result.status === 'FAILED') {
          overallStatus = 'FAILED';
        } else if (result.status === 'DEGRADED' && overallStatus !== 'FAILED') {
          overallStatus = 'DEGRADED';
        }
      } catch (err: any) {
        // Exception safety: convert thrown error or timeout into a FAILED check
        const failedResult: HealthResult = {
          status: 'FAILED',
          message: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        };
        components[name] = failedResult;
        overallStatus = 'FAILED';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components,
    };
  }

  private checkWithTimeout(check: HealthCheck, timeoutMs: number): Promise<HealthResult> {
    let timerId: any;
    const timeoutPromise = new Promise<HealthResult>((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(`Health check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const executionPromise = Promise.resolve(check.check()).then((result) => {
      clearTimeout(timerId);
      return result;
    });

    return Promise.race([executionPromise, timeoutPromise]);
  }
}
