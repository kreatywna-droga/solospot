/**
 * G1-224: Critical Path Performance Audit
 *
 * Audits critical path performance including latency, throughput,
 * and error rates. Identifies bottlenecks and validates SLO compliance.
 */

export interface CriticalPathMetric {
  readonly pathId: string;
  readonly pathName: string;
  readonly stages: string[];
  readonly avgLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly throughputPerSecond: number;
  readonly errorRate: number;
}

export interface Bottleneck {
  readonly pathId: string;
  readonly pathName: string;
  readonly slowestStage: string;
  readonly stageLatencyMs: number;
}

export interface PerformanceImprovement {
  readonly pathId: string;
  readonly pathName: string;
  readonly currentLatencyMs: number;
  readonly targetLatencyMs: number;
  readonly suggestions: string[];
}

export class CriticalPathPerformanceAuditor {
  private paths: Map<string, CriticalPathMetric> = new Map();

  registerCriticalPath(metric: CriticalPathMetric): void {
    this.paths.set(metric.pathId, metric);
  }

  identifyBottlenecks(paths: CriticalPathMetric[]): Bottleneck[] {
    return paths.map((path) => {
      const stageLatency = path.avgLatencyMs / Math.max(path.stages.length, 1);
      return {
        pathId: path.pathId,
        pathName: path.pathName,
        slowestStage: path.stages[0] ?? 'unknown',
        stageLatencyMs: Math.round(stageLatency * 100) / 100,
      };
    }).sort((a, b) => b.stageLatencyMs - a.stageLatencyMs);
  }

  validateSloCompliance(path: CriticalPathMetric, targetLatencyMs: number): {
    pathId: string;
    compliant: boolean;
    currentLatencyMs: number;
    targetLatencyMs: number;
    marginMs: number;
  } {
    const compliant = path.avgLatencyMs <= targetLatencyMs;
    return {
      pathId: path.pathId,
      compliant,
      currentLatencyMs: path.avgLatencyMs,
      targetLatencyMs,
      marginMs: Math.round((targetLatencyMs - path.avgLatencyMs) * 100) / 100,
    };
  }

  getPathsBelowSlo(paths: CriticalPathMetric[], targetLatencyMs: number): CriticalPathMetric[] {
    return paths.filter((p) => p.avgLatencyMs > targetLatencyMs);
  }

  suggestPerformanceImprovements(paths: CriticalPathMetric[]): PerformanceImprovement[] {
    return paths.map((path) => {
      const targetLatencyMs = path.avgLatencyMs * 0.7;
      const suggestions: string[] = [];

      if (path.p95LatencyMs > path.avgLatencyMs * 2) {
        suggestions.push('Reduce tail latency by optimizing hot paths');
      }
      if (path.errorRate > 0.01) {
        suggestions.push('Improve error handling to reduce error rate');
      }
      if (path.throughputPerSecond < 100) {
        suggestions.push('Scale horizontally to increase throughput');
      }
      if (path.stages.length > 5) {
        suggestions.push('Consider parallelizing sequential stages');
      }
      if (suggestions.length === 0) {
        suggestions.push('Performance is within acceptable bounds');
      }

      return {
        pathId: path.pathId,
        pathName: path.pathName,
        currentLatencyMs: path.avgLatencyMs,
        targetLatencyMs: Math.round(targetLatencyMs * 100) / 100,
        suggestions,
      };
    });
  }

  calculatePerformanceScore(paths: CriticalPathMetric[]): number {
    if (paths.length === 0) return 100;

    let totalScore = 0;
    for (const path of paths) {
      let pathScore = 100;
      if (path.avgLatencyMs > 1000) pathScore -= 30;
      else if (path.avgLatencyMs > 500) pathScore -= 15;
      if (path.errorRate > 0.05) pathScore -= 30;
      else if (path.errorRate > 0.01) pathScore -= 15;
      if (path.p99LatencyMs > path.avgLatencyMs * 3) pathScore -= 20;
      totalScore += Math.max(pathScore, 0);
    }

    return Math.round((totalScore / paths.length) * 100) / 100;
  }

  generatePerformanceReport(): {
    totalPaths: number;
    averageLatencyMs: number;
    averageP95Ms: number;
    averageP99Ms: number;
    averageThroughput: number;
    averageErrorRate: number;
    performanceScore: number;
    bottlenecks: Bottleneck[];
  } {
    const all = Array.from(this.paths.values());
    const avgLatency = all.length > 0
      ? all.reduce((sum, p) => sum + p.avgLatencyMs, 0) / all.length
      : 0;
    const avgP95 = all.length > 0
      ? all.reduce((sum, p) => sum + p.p95LatencyMs, 0) / all.length
      : 0;
    const avgP99 = all.length > 0
      ? all.reduce((sum, p) => sum + p.p99LatencyMs, 0) / all.length
      : 0;
    const avgThroughput = all.length > 0
      ? all.reduce((sum, p) => sum + p.throughputPerSecond, 0) / all.length
      : 0;
    const avgErrorRate = all.length > 0
      ? all.reduce((sum, p) => sum + p.errorRate, 0) / all.length
      : 0;

    return {
      totalPaths: all.length,
      averageLatencyMs: Math.round(avgLatency * 100) / 100,
      averageP95Ms: Math.round(avgP95 * 100) / 100,
      averageP99Ms: Math.round(avgP99 * 100) / 100,
      averageThroughput: Math.round(avgThroughput * 100) / 100,
      averageErrorRate: Math.round(avgErrorRate * 10000) / 10000,
      performanceScore: this.calculatePerformanceScore(all),
      bottlenecks: this.identifyBottlenecks(all),
    };
  }
}
