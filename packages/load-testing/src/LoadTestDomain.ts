export interface LoadTestScenario {
  name: string;
  description: string;
  tenantCount: number;
  operationsPerTenant: number;
  rampUpSeconds: number;
  durationSeconds: number;
}

export interface LoadTestResult {
  scenario: string;
  totalOperations: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  startTime: string;
  endTime: string;
}

export interface LoadTestConfig {
  scenarios: LoadTestScenario[];
  concurrentWorkers: number;
  timeoutMs: number;
}