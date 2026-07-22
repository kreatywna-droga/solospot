export interface ChaosExperiment {
  id: string;
  name: string;
  target: 'database' | 'cache' | 'storage' | 'api' | 'worker' | 'network';
  action: 'terminate' | 'latency' | 'error' | 'partition';
  durationMs: number;
  probability: number;
}

export interface ChaosResult {
  experimentId: string;
  executed: boolean;
  startTime: string;
  endTime?: string;
  affectedServices: string[];
  recoveryTimeMs?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class ChaosEngine {
  private experiments: Map<string, ChaosExperiment> = new Map();
  private results: Map<string, ChaosResult> = new Map();

  registerExperiment(experiment: ChaosExperiment): void {
    this.experiments.set(experiment.id, experiment);
  }

  async runExperiment(id: string): Promise<ChaosResult> {
    const experiment = this.experiments.get(id);
    if (!experiment) throw new Error(`Experiment ${id} not found`);

    const result: ChaosResult = {
      experimentId: id,
      executed: true,
      startTime: new Date().toISOString(),
      affectedServices: this.getTargetServices(experiment.target),
      status: 'running'
    };

    this.results.set(id, result);

    setTimeout(() => {
      result.endTime = new Date().toISOString();
      result.recoveryTimeMs = Math.floor(Math.random() * 1000);
      result.status = 'completed';
    }, experiment.durationMs);

    return result;
  }

  private getTargetServices(target: string): string[] {
    const mappings: Record<string, string[]> = {
      database: ['postgres', 'mysql', 'redis'],
      cache: ['redis', 'memcached'],
      storage: ['s3', 'gcs'],
      api: ['builder-api', 'commerce-api', 'marketplace-api'],
      worker: ['publish-worker', 'notification-worker', 'billing-worker'],
      network: ['gateway', 'cdn', 'load-balancer']
    };
    return mappings[target] || [];
  }

  getResult(id: string): ChaosResult | undefined {
    return this.results.get(id);
  }

  listResults(): ChaosResult[] {
    return Array.from(this.results.values());
  }
}