import { HealthCheck, SystemHealthSummary, TraceContext } from './ObservabilityDomain';

export class HealthCheckEngine {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();

  registerCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }

  async runAllChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    for (const [name, check] of this.checks.entries()) {
      try {
        const start = Date.now();
        const result = await check();
        result.latencyMs = Date.now() - start;
        results.push(result);
      } catch (error) {
        results.push({
          component: name,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return results;
  }

  async runCheck(name: string): Promise<HealthCheck | undefined> {
    const check = this.checks.get(name);
    if (!check) return undefined;

    const start = Date.now();
    const result = await check();
    result.latencyMs = Date.now() - start;
    return result;
  }

  async getOverallStatus(): Promise<SystemHealthSummary> {
    const checks = await this.runAllChecks();
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const check of checks) {
      if (check.status === 'healthy') healthyCount++;
      else if (check.status === 'degraded') degradedCount++;
      else unhealthyCount++;
    }


    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0 || checks.length === 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    }

    return {
      status,
      totalChecks: checks.length,
      healthyCount,
      degradedCount,
      unhealthyCount,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}