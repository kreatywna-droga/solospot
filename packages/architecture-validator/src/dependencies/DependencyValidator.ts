import { RuleViolation } from '../rules/ArchitectureRules';

export class DependencyValidator {
  public static validateLayerImports(packageName: string, importPaths: string[]): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Rule: packages in /packages/ must NOT import from src/components/builder or src/lib/runtime directly
    const isInfrastructurePackage = packageName.startsWith('@web-factor/') || packageName.startsWith('packages/');

    if (isInfrastructurePackage) {
      for (const imp of importPaths) {
        if (imp.includes('src/components/builder') || imp.includes('src/lib/runtime')) {
          violations.push({
            ruleId: 'ARCH-002',
            category: 'layers',
            severity: 'error',
            message: `Package '${packageName}' violates layer architecture by importing from '${imp}'.`,
            targetPath: packageName,
          });
        }
      }
    }

    return violations;
  }

  public static checkCycles(graphMap: Map<string, string[]>): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = graphMap.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          violations.push({
            ruleId: 'ARCH-001',
            category: 'dependencies',
            severity: 'critical',
            message: `Circular dependency detected: ${[...path, neighbor].join(' ➔ ')}`,
            targetPath: node,
          });
        }
      }

      recStack.delete(node);
    };

    for (const key of graphMap.keys()) {
      if (!visited.has(key)) {
        dfs(key, []);
      }
    }

    return violations;
  }
}
