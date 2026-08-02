export type DXCategory = 'api_consistency' | 'ergonomics' | 'naming' | 'exports' | 'documentation';
export type DXSeverity = 'info' | 'warning' | 'error';

export interface DeveloperExperienceMetric {
  name: string;
  score: number;
  description: string;
}

export interface DXIssue {
  id: string;
  category: DXCategory;
  severity: DXSeverity;
  message: string;
  targetPath?: string;
}

export interface DXAssessment {
  totalIssues: number;
  warningCount: number;
  errorCount: number;
}

export interface DXRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
