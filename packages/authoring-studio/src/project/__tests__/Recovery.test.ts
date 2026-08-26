import { describe, it, expect } from 'vitest';
import {
  detectDirtyDocument,
  createRecoveryToken,
  buildSessionRecoveryReport,
  markRecoveryComplete,
} from '../ProjectRecovery';
import { createNewProject } from '../ProjectManager';
import { createAutosaveState, createAutosaveSnapshot } from '../ProjectAutosave';

describe('ProjectRecovery (Sprint S5, ETAP 5)', () => {
  it('detects clean document as not dirty', () => {
    const state = createNewProject({ projectId: 'p-r1', name: 'R1', authorId: 'u1', tenantId: 't1' });
    expect(detectDirtyDocument(state.document)).toBe(false);
  });

  it('detects dirty document', () => {
    const state = createNewProject({ projectId: 'p-r2', name: 'R2', authorId: 'u1', tenantId: 't1' });
    const dirty = { ...state.document, isDirty: true };
    expect(detectDirtyDocument(dirty)).toBe(true);
  });

  it('builds recovery report with no snapshot as non-recoverable', () => {
    const state = createNewProject({ projectId: 'p-r3', name: 'R3', authorId: 'u1', tenantId: 't1' });
    const report = buildSessionRecoveryReport(state.document, null);
    expect(report.canRecover).toBe(false);
    expect(report.recoveryToken).toBeNull();
  });

  it('builds recovery report with snapshot as recoverable when dirty', () => {
    const state = createNewProject({ projectId: 'p-r4', name: 'R4', authorId: 'u1', tenantId: 't1' });
    const dirtyDoc = { ...state.document, isDirty: true };
    const autosaveState = createAutosaveState();
    const { snapshot } = createAutosaveSnapshot(autosaveState, state.document);
    const report = buildSessionRecoveryReport(dirtyDoc, snapshot);
    expect(report.isDirty).toBe(true);
    expect(report.canRecover).toBe(true);
    expect(report.recoveryToken?.status).toBe('dirty');
  });

  it('marks recovery token as recovered', () => {
    const state = createNewProject({ projectId: 'p-r5', name: 'R5', authorId: 'u1', tenantId: 't1' });
    const dirtyDoc = { ...state.document, isDirty: true };
    const autosaveState = createAutosaveState();
    const { snapshot } = createAutosaveSnapshot(autosaveState, state.document);
    const token = createRecoveryToken('p-r5', snapshot);
    const recovered = markRecoveryComplete(token);
    expect(recovered.status).toBe('recovered');
  });
});
