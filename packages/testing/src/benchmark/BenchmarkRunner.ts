export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  averageTimeMs: number;
  medianMs: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
}

export class BenchmarkRunner {
  public static run(name: string, fn: () => void, iterations: number = 100): BenchmarkResult {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
      fn();
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      times.push(end - start);
    }

    times.sort((a, b) => a - b);

    const totalTimeMs = times.reduce((acc, t) => acc + t, 0);
    const averageTimeMs = totalTimeMs / iterations;
    const minMs = times[0];
    const maxMs = times[times.length - 1];

    // Median
    let medianMs: number;
    const mid = Math.floor(times.length / 2);
    if (times.length % 2 === 0) {
      medianMs = (times[mid - 1] + times[mid]) / 2;
    } else {
      medianMs = times[mid];
    }

    // P95
    const p95Idx = Math.floor(times.length * 0.95);
    const p95Ms = times[Math.min(p95Idx, times.length - 1)];

    return {
      name,
      iterations,
      totalTimeMs,
      averageTimeMs,
      medianMs,
      p95Ms,
      minMs,
      maxMs,
    };
  }
}
