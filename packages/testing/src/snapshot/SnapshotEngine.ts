export interface SnapshotDiff {
  path: string;
  actual: any;
  expected: any;
}

export interface SnapshotCompareResult {
  isMatch: boolean;
  diffs: SnapshotDiff[];
}

export class SnapshotEngine {
  public static serialize(data: any): string {
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    }, 2);
  }

  public static compare(actual: any, expected: any): SnapshotCompareResult {
    const diffs: SnapshotDiff[] = [];
    SnapshotEngine.deepDiff(actual, expected, '', diffs);
    return {
      isMatch: diffs.length === 0,
      diffs,
    };
  }

  private static deepDiff(actual: any, expected: any, path: string, diffs: SnapshotDiff[]): void {
    if (actual === expected) return;

    if (
      typeof actual !== 'object' ||
      typeof expected !== 'object' ||
      actual === null ||
      expected === null
    ) {
      diffs.push({ path: path || 'root', actual, expected });
      return;
    }

    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    const allKeys = new Set([...actualKeys, ...expectedKeys]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in actual)) {
        diffs.push({ path: currentPath, actual: undefined, expected: expected[key] });
      } else if (!(key in expected)) {
        diffs.push({ path: currentPath, actual: actual[key], expected: undefined });
      } else {
        SnapshotEngine.deepDiff(actual[key], expected[key], currentPath, diffs);
      }
    }
  }

  public static formatDiffReport(result: SnapshotCompareResult): string {
    if (result.isMatch) return 'Snapshots MATCH (0 differences)';
    const lines = [`Snapshot mismatch found (${result.diffs.length} differences):`];
    for (const diff of result.diffs) {
      lines.push(`  Path [${diff.path}]:`);
      lines.push(`    - Actual:   ${JSON.stringify(diff.actual)}`);
      lines.push(`    + Expected: ${JSON.stringify(diff.expected)}`);
    }
    return lines.join('\n');
  }
}
