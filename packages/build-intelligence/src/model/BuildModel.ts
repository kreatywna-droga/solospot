export type BuildSeverity = 'info' | 'warning' | 'error';
export type BuildIssueType =
  | 'tsconfig_missing'
  | 'strict_disabled'
  | 'declaration_disabled'
  | 'invalid_main'
  | 'missing_types';

export interface BuildConfiguration {
  tsconfigPath: string;
  target?: string;
  strict?: boolean;
  declaration?: boolean;
  moduleResolution?: string;
}

export interface BuildArtifact {
  packageName: string;
  mainPath: string;
  typesPath?: string;
  isDeclarationPresent: boolean;
}

export interface BuildMetric {
  metricName: string;
  value: number;
  targetValue: number;
}

export interface BuildIssue {
  id: string;
  issueType: BuildIssueType;
  severity: BuildSeverity;
  message: string;
  targetPath?: string;
}

export interface BuildAssessment {
  totalIssues: number;
  warningCount: number;
  errorCount: number;
}
