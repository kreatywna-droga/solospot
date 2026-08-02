export interface PerformanceMetric {
  name: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private metricsHistory: PerformanceMetric[] = [];
  private currentFPS: number = 60;
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private isMonitoringFPS: boolean = false;
  private animFrameId: number | null = null;
  private maxHistorySize: number = 500;

  public mark(name: string): void {
    const time = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.marks.set(name, time);
  }

  public measureBetween(startMark: string, endMark: string, metricName?: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);

    if (startTime === undefined || endTime === undefined) {
      return 0;
    }

    const duration = endTime - startTime;
    const name = metricName || `${startMark}_to_${endMark}`;
    this.recordMetric(name, duration);
    return duration;
  }

  public measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      return fn();
    } finally {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const duration = end - start;
      this.recordMetric(name, duration, metadata);
    }
  }

  public async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      return await fn();
    } finally {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const duration = end - start;
      this.recordMetric(name, duration, metadata);
    }
  }

  public recordMetric(name: string, durationMs: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      durationMs,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.metricsHistory.push(metric);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  public recordFrame(nowTime?: number): void {
    const now = nowTime || (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      if (delta > 0) {
        const fps = 1000 / delta;
        this.frameTimes.push(fps);
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }
        const sum = this.frameTimes.reduce((acc, val) => acc + val, 0);
        this.currentFPS = Math.round(sum / this.frameTimes.length);
      }
    }
    this.lastFrameTime = now;
  }

  public startFPSMonitoring(): void {
    if (this.isMonitoringFPS) return;
    this.isMonitoringFPS = true;
    this.lastFrameTime = 0;
    this.frameTimes = [];

    if (typeof requestAnimationFrame !== 'undefined') {
      const loop = () => {
        if (!this.isMonitoringFPS) return;
        this.recordFrame();
        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  public stopFPSMonitoring(): void {
    this.isMonitoringFPS = false;
    if (this.animFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getFPS(): number {
    return this.currentFPS;
  }

  public getMemoryUsage(): MemoryInfo | null {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize || 0,
        totalJSHeapSize: mem.totalJSHeapSize || 0,
        jsHeapSizeLimit: mem.jsHeapSizeLimit || 0,
      };
    }
    return null;
  }

  public getMetrics(nameFilter?: string): PerformanceMetric[] {
    if (!nameFilter) return [...this.metricsHistory];
    return this.metricsHistory.filter(m => m.name === nameFilter);
  }

  public getAverageDuration(name: string): number {
    const filtered = this.getMetrics(name);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.durationMs, 0);
    return sum / filtered.length;
  }

  public clearMetrics(): void {
    this.metricsHistory = [];
    this.marks.clear();
  }
}
