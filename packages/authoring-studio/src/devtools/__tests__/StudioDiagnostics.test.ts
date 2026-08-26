import { describe, it, expect } from 'vitest';
import { createStudioDiagnosticsState } from '../StudioDiagnostics';
import { inspectRuntimeState } from '../RuntimeInspector';
import { createStateSnapshotView } from '../StateSnapshotViewer';
import { createEventTraceLog, appendEventTrace } from '../EventTraceViewer';
import { buildStudioDependencyGraphView } from '../DependencyGraphViewer';

describe('StudioDiagnostics & DevTools (Sprint S1, ETAP 1)', () => {
  it('creates diagnostic state and computes overall health', () => {
    const diagState = createStudioDiagnosticsState([
      { id: 'd1', code: 'W001', message: 'Low memory warning', severity: 'warning', component: 'inspector', timestamp: Date.now() },
    ]);
    expect(diagState.overallHealth).toBe('healthy');
    expect(diagState.diagnostics).toHaveLength(1);
  });

  it('inspects runtime state descriptors without side-effects', () => {
    const runtimeView = inspectRuntimeState('tl-1', 'playing', 1200);
    expect(runtimeView.activeTimelineId).toBe('tl-1');
    expect(runtimeView.transportMode).toBe('playing');
  });

  it('creates state snapshot view descriptors', () => {
    const snapView = createStateSnapshotView('Timeline', 'tl-1', 2, { name: 'Intro' });
    expect(snapView.snapshotId).toBe('snap-view-tl-1-v2');
  });

  it('records event traces immutably', () => {
    let traceLog = createEventTraceLog();
    traceLog = appendEventTrace(traceLog, 'KEYFRAME_MOVED', 'timeline', { keyframeId: 'k1' });
    expect(traceLog.traces).toHaveLength(1);
  });

  it('builds studio dependency graph view', () => {
    const graph = buildStudioDependencyGraphView();
    expect(graph.nodes.length).toBeGreaterThan(10);
    expect(graph.edges.length).toBeGreaterThan(5);
  });
});
