export type QualityCategory = 'complexity' | 'length' | 'duplication' | 'maintainability' | 'exports';
export type QualitySeverity = 'info' | 'warning' | 'error';

export interface QualityMetric {
  name: string;
  value: number;
  threshold: number;
  isExceeded: boolean;
}

export interface QualityIssue {
  id: string;
  category: QualityCategory;
  severity: QualitySeverity;
  message: string;
  filePath?: string;
  line?: number;
}

export interface FileQualityReport {
  filePath: string;
  linesCount: number;
  maxFunctionLines: number;
  estimatedComplexity: number;
  issues: QualityIssue[];
}

export interface ProjectQualityReport {
  timestamp: string;
  qualityScore: number;
  totalFiles: number;
  totalLines: number;
  issues: QualityIssue[];
}
