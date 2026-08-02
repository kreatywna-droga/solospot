import { DependencyGraph, DependencyIssue } from '../model/PkgDepModel';
import { PackageDependencyAnalyzer } from '../analyzer/PackageDependencyAnalyzer';

export class DependencyValidator {
  public static validateGraph(graph: DependencyGraph): DependencyIssue[] {
    const issues: DependencyIssue[] = [];

    // Check cycles
    const cycles = PackageDependencyAnalyzer.detectCycles(graph);
    for (const c of cycles) {
      issues.push({
        id: `cyc_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'cycle',
        severity: 'critical',
        message: `Circular dependency detected: ${c.cyclePath.join(' ➔ ')}`,
      });
    }

    // Check high coupling (> 5 dependencies)
    const highCoupled = PackageDependencyAnalyzer.detectHighCoupling(graph, 5);
    for (const pkg of highCoupled) {
      issues.push({
        id: `cpl_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'high_coupling',
        severity: 'warning',
        message: `Package '${pkg}' exhibits high coupling (>5 direct dependencies).`,
        packageName: pkg,
      });
    }

    return issues;
  }
}
