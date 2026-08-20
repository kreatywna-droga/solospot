import { HealthCheck, SystemHealthSummary } from './ObservabilityDomain';
import { HealthCheckEngine } from './HealthCheckEngine';

export interface SystemMemoryInfo {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
}

export interface EnvironmentInfo {
  runtime: string;
  version: string;
  platform: string;
  arch: string;
}

export interface SystemDiagnosticReport {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  summary?: SystemHealthSummary;
  uptimeSeconds: number;
  eventLoopLatencyMs: number;
  memory: SystemMemoryInfo;
  environment: EnvironmentInfo;
  checks: HealthCheck[];
}

export class SystemDiagnosticProbe {
  private healthEngine: HealthCheckEngine;

  constructor(healthEngine?: HealthCheckEngine) {
    this.healthEngine = healthEngine ?? new HealthCheckEngine();
  }

  public getMemorySnapshot(): SystemMemoryInfo {
    const mem = process.memoryUsage();
    const bytesToMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

    return {
      heapUsedMb: bytesToMb(mem.heapUsed),
      heapTotalMb: bytesToMb(mem.heapTotal),
      rssMb: bytesToMb(mem.rss),
      externalMb: bytesToMb(mem.external || 0),
    };
  }

  public getEnvironmentInfo(): EnvironmentInfo {
    const isBun = typeof process !== 'undefined' && 'versions' in process && !!(process.versions as Record<string, string>).bun;
    return {
      runtime: isBun ? 'Bun' : 'Node.js',
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  public async measureEventLoopLatency(): Promise<number> {
    const start = performance.now();
    return new Promise((resolve) => {
      setImmediate(() => {
        const latency = performance.now() - start;
        resolve(Math.round(latency * 100) / 100);
      });
    });
  }

  public async runDiagnostics(): Promise<SystemDiagnosticReport> {
    const eventLoopLatencyMs = await this.measureEventLoopLatency();
    const summary = await this.healthEngine.getOverallStatus();
    const checks = summary.checks;
    const memory = this.getMemorySnapshot();
    const environment = this.getEnvironmentInfo();
    const uptimeSeconds = Math.floor(process.uptime());

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
    const hasDegraded = checks.some((c) => c.status === 'degraded');

    if (hasUnhealthy || summary.status === 'unhealthy' || eventLoopLatencyMs > 500) {
      status = 'unhealthy';
    } else if (hasDegraded || summary.status === 'degraded' || eventLoopLatencyMs > 100) {
      status = 'degraded';
    }

    return {
      timestamp: new Date().toISOString(),
      status,
      summary,
      uptimeSeconds,
      eventLoopLatencyMs,
      memory,
      environment,
      checks,
    };
  }
}
