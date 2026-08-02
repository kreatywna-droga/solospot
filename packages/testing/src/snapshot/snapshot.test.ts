import { describe, it, expect } from 'vitest';
import { SnapshotEngine } from './SnapshotEngine';

describe('Snapshot Testing Foundation', () => {
  it('should serialize objects to formatted JSON string', () => {
    const data = { a: 1, fn: () => {} };
    const serialized = SnapshotEngine.serialize(data);
    expect(serialized).toContain('"a": 1');
    expect(serialized).toContain('"fn": "[Function]"');
  });

  it('should detect matching snapshots', () => {
    const a = { x: 10, y: { z: 'hello' } };
    const b = { x: 10, y: { z: 'hello' } };
    const res = SnapshotEngine.compare(a, b);

    expect(res.isMatch).toBe(true);
    expect(res.diffs.length).toBe(0);
  });

  it('should detect mismatched snapshots and format diff report', () => {
    const a = { x: 10, y: { z: 'hello' } };
    const b = { x: 10, y: { z: 'world' } };
    const res = SnapshotEngine.compare(a, b);

    expect(res.isMatch).toBe(false);
    expect(res.diffs.length).toBe(1);
    expect(res.diffs[0].path).toBe('y.z');

    const report = SnapshotEngine.formatDiffReport(res);
    expect(report).toContain('Snapshot mismatch found');
    expect(report).toContain('Path [y.z]');
  });
});
