export type RuleCategory = 'dependencies' | 'structure' | 'naming' | 'layers' | 'exports';
export type RuleSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ArchitectureRule {
  id: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  enabled: boolean;
}

export interface RuleViolation {
  ruleId: string;
  category: RuleCategory;
  severity: RuleSeverity;
  message: string;
  targetPath?: string;
}

export interface ArchitectureValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  violations: RuleViolation[];
  rulesEvaluatedCount: number;
}

export const DEFAULT_RULES: ArchitectureRule[] = [
  {
    id: 'ARCH-001',
    name: 'No Circular Dependencies',
    category: 'dependencies',
    severity: 'critical',
    description: 'Packages and modules must not contain circular import dependencies.',
    enabled: true,
  },
  {
    id: 'ARCH-002',
    name: 'Forbidden Cross-Layer Imports',
    category: 'layers',
    severity: 'error',
    description: 'Infrastructure packages must not import from UI components or builder app directly.',
    enabled: true,
  },
  {
    id: 'ARCH-003',
    name: 'Mandatory Package Files',
    category: 'structure',
    severity: 'warning',
    description: 'Every package in /packages/ must contain index.ts, package.json, and README.md.',
    enabled: true,
  },
  {
    id: 'ARCH-004',
    name: 'Public Export Integrity',
    category: 'exports',
    severity: 'warning',
    description: 'All public modules must be re-exported via src/index.ts.',
    enabled: true,
  },
];
