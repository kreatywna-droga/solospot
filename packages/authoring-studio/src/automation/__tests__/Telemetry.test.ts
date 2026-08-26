import { describe, it, expect } from 'vitest';
import {
  createTelemetryStoreState,
  recordTelemetryMetric,
  createDiagnosticsSnapshot,
} from '../Telemetry';

describe('Telemetry (PM45, ETAP 7 & DECISION-094)', () => {
  it('collects telemetry metrics passively (DECISION-094)', () => {
    let state = createTelemetryStoreState();
    state = recordTelemetryMetric(state, 'timeline_render_duration', 16, 'ms');
    state = recordTelemetryMetric(state, 'asset_import_count', 1, 'count');

    expect(state.metrics).toHaveLength(2);

    const snapshot = createDiagnosticsSnapshot(state, '1.0.0');
    expect(snapshot.activeMetricCount).toBe(2);
    expect(snapshot.studioVersion).toBe('1.0.0');
  });
});
