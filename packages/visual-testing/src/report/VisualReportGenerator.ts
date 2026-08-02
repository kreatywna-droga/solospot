import { VisualDiffResult } from '../diff/VisualDiffEngine';

export interface VisualTestExecutionReport {
  timestamp: string;
  totalSnapshotsTested: number;
  passedCount: number;
  failedCount: number;
  criticalCount: number;
  results: VisualDiffResult[];
}

export class VisualReportGenerator {
  public static generateSummary(results: VisualDiffResult[]): VisualTestExecutionReport {
    let passed = 0;
    let failed = 0;
    let critical = 0;

    for (const res of results) {
      if (res.overallSeverity === 'none') {
        passed++;
      } else {
        failed++;
        if (res.overallSeverity === 'critical') {
          critical++;
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalSnapshotsTested: results.length,
      passedCount: passed,
      failedCount: failed,
      criticalCount: critical,
      results,
    };
  }

  public static toMarkdown(results: VisualDiffResult[]): string {
    const summary = VisualReportGenerator.generateSummary(results);
    const lines: string[] = [];

    lines.push('# Visual Regression Test Report');
    lines.push('');
    lines.push(`- **Executed At:** \`${summary.timestamp}\``);
    lines.push(`- **Total Snapshots:** ${summary.totalSnapshotsTested}`);
    lines.push(`- **Passed (No diffs):** ${summary.passedCount} ✅`);
    lines.push(`- **Failed (Has diffs):** ${summary.failedCount} ❌`);
    lines.push(`- **Critical Failures:** ${summary.criticalCount} ⚠️`);
    lines.push('');

    lines.push('## Test Results Breakdown');
    lines.push('');
    lines.push('| Snapshot Name | DOM Matched | Diff % | Overall Severity | Status |');
    lines.push('|---------------|-------------|--------|------------------|--------|');

    for (const res of results) {
      const status = res.overallSeverity === 'none' ? 'PASS ✅' : 'FAIL ❌';
      lines.push(
        `| \`${res.snapshotName}\` | ${res.domMatched ? 'Yes' : 'No ❌'} | ${res.diffPercentage}% | **${res.overallSeverity.toUpperCase()}** | ${status} |`
      );
    }
    lines.push('');

    return lines.join('\n');
  }

  public static toJSON(results: VisualDiffResult[]): string {
    const summary = VisualReportGenerator.generateSummary(results);
    return JSON.stringify(summary, null, 2);
  }
}
