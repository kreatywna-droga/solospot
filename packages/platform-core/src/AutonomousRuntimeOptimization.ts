/**
 * G1-215: Autonomous Runtime Optimization
 *
 * Profiles component performance, identifies bottlenecks, suggests
 * optimizations, and tracks performance trends over time.
 */

export interface RuntimePerformanceProfile {
  readonly profileId: string;
  readonly component: string;
  readonly avgExecutionTimeMs: number;
  readonly memoryUsageBytes: number;
  readonly callFrequency: number;
  readonly optimizationPotential: number;
}

export interface OptimizationSuggestion {
  readonly component: string;
  readonly issue: string;
  readonly suggestion: string;
  readonly estimatedImprovement: number;
}

export type PerformanceTrend = 'IMPROVING' | 'STABLE' | 'DEGRADING';

export interface PerformanceSnapshot {
  readonly component: string;
  readonly timestamp: number;
  readonly executionTimeMs: number;
  readonly memoryBytes: number;
}

export class AutonomousRuntimeOptimizer {
  private profiles: Map<string, RuntimePerformanceProfile> = new Map();
  private snapshots: PerformanceSnapshot[] = [];

  profileComponent(
    componentId: string,
    executionTimeMs: number,
    memoryBytes: number,
  ): RuntimePerformanceProfile {
    const existing = this.profiles.get(componentId);
    const callFrequency = existing ? existing.callFrequency + 1 : 1;
    const avgExecutionTimeMs = existing
      ? (existing.avgExecutionTimeMs * existing.callFrequency + executionTimeMs) / callFrequency
      : executionTimeMs;
    const memoryUsageBytes = existing
      ? Math.max(existing.memoryUsageBytes, memoryBytes)
      : memoryBytes;
    const optimizationPotential = this.calculateOptimizationPotential(
      avgExecutionTimeMs,
      memoryUsageBytes,
    );

    const profile: RuntimePerformanceProfile = {
      profileId: `prof-${componentId}-${callFrequency}`,
      component: componentId,
      avgExecutionTimeMs,
      memoryUsageBytes,
      callFrequency,
      optimizationPotential,
    };
    this.profiles.set(componentId, profile);
    this.snapshots.push({
      component: componentId,
      timestamp: Date.now(),
      executionTimeMs,
      memoryBytes,
    });
    return profile;
  }

  private calculateOptimizationPotential(
    executionTimeMs: number,
    memoryBytes: number,
  ): number {
    const timeScore = Math.min(1, executionTimeMs / 1000);
    const memoryScore = Math.min(1, memoryBytes / (1024 * 1024));
    return (timeScore * 0.6 + memoryScore * 0.4) * 100;
  }

  identifyBottlenecks(
    profiles: RuntimePerformanceProfile[],
    threshold: number = 70,
  ): RuntimePerformanceProfile[] {
    return [...profiles]
      .filter((p) => p.optimizationPotential >= threshold)
      .sort((a, b) => b.optimizationPotential - a.optimizationPotential);
  }

  suggestOptimizations(profiles: RuntimePerformanceProfile[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    for (const profile of profiles) {
      if (profile.avgExecutionTimeMs > 500) {
        suggestions.push({
          component: profile.component,
          issue: 'High execution time',
          suggestion: 'Consider memoization, lazy loading, or algorithm optimization.',
          estimatedImprovement: Math.min(50, profile.avgExecutionTimeMs * 0.3),
        });
      }
      if (profile.memoryUsageBytes > 512 * 1024) {
        suggestions.push({
          component: profile.component,
          issue: 'High memory usage',
          suggestion: 'Review data structures, implement virtual scrolling, or use streaming.',
          estimatedImprovement: Math.min(40, (profile.memoryUsageBytes / (1024 * 1024)) * 10),
        });
      }
      if (profile.callFrequency > 100 && profile.avgExecutionTimeMs > 100) {
        suggestions.push({
          component: profile.component,
          issue: 'Frequent expensive calls',
          suggestion: 'Add throttling, debouncing, or request batching.',
          estimatedImprovement: Math.min(60, profile.callFrequency * 0.1),
        });
      }
      if (profile.optimizationPotential >= 70) {
        const existing = suggestions.find((s) => s.component === profile.component);
        if (!existing) {
          suggestions.push({
            component: profile.component,
            issue: 'High optimization potential',
            suggestion: 'Profile further and apply targeted optimizations.',
            estimatedImprovement: profile.optimizationPotential * 0.2,
          });
        }
      }
    }
    return suggestions.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  calculateOptimizationImpact(profile: RuntimePerformanceProfile): {
    currentScore: number;
    potentialScore: number;
    improvementPercent: number;
  } {
    const currentScore =
      profile.avgExecutionTimeMs * 0.6 + (profile.memoryUsageBytes / 1024) * 0.4;
    const potentialScore = currentScore * (1 - profile.optimizationPotential / 100);
    const improvementPercent =
      currentScore > 0 ? ((currentScore - potentialScore) / currentScore) * 100 : 0;
    return { currentScore, potentialScore, improvementPercent };
  }

  getPerformanceTrend(componentId: string): PerformanceTrend {
    const componentSnapshots = this.snapshots.filter(
      (s) => s.component === componentId,
    );
    if (componentSnapshots.length < 2) return 'STABLE';

    const firstHalf = componentSnapshots.slice(
      0,
      Math.floor(componentSnapshots.length / 2),
    );
    const secondHalf = componentSnapshots.slice(
      Math.floor(componentSnapshots.length / 2),
    );

    const avgFirst =
      firstHalf.reduce((s, snap) => s + snap.executionTimeMs, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((s, snap) => s + snap.executionTimeMs, 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;
    if (diff < -10) return 'IMPROVING';
    if (diff > 10) return 'DEGRADING';
    return 'STABLE';
  }

  getAllProfiles(): RuntimePerformanceProfile[] {
    return [...this.profiles.values()];
  }

  generateOptimizationReport(): {
    totalProfiles: number;
    bottleneckCount: number;
    suggestions: OptimizationSuggestion[];
    bottlenecks: RuntimePerformanceProfile[];
    trends: Record<string, PerformanceTrend>;
  } {
    const allProfiles = this.getAllProfiles();
    const bottlenecks = this.identifyBottlenecks(allProfiles);
    const suggestions = this.suggestOptimizations(allProfiles);

    const trends: Record<string, PerformanceTrend> = {};
    for (const profile of allProfiles) {
      trends[profile.component] = this.getPerformanceTrend(profile.component);
    }

    return {
      totalProfiles: allProfiles.length,
      bottleneckCount: bottlenecks.length,
      suggestions,
      bottlenecks,
      trends,
    };
  }
}
