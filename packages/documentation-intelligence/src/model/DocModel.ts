export interface DocumentationSection {
  heading: string;
  level: number;
  lineStart: number;
}

export interface DocumentationReference {
  sourcePath: string;
  targetPath: string;
  linkText: string;
  isValid: boolean;
}

export interface DocumentationMetadata {
  title?: string;
  status?: string;
  epic?: string;
  dependencies?: string[];
}

export interface DocumentationArtifact {
  id: string;
  title: string;
  path: string;
  sections: DocumentationSection[];
  references: DocumentationReference[];
  metadata?: DocumentationMetadata;
}

export interface DocumentationCoverage {
  totalModules: number;
  documentedModulesCount: number;
  coveragePercentage: number;
}

export type IssueType = 'missing_doc' | 'invalid_link' | 'orphan_doc' | 'structure_error';
export type IssueSeverity = 'info' | 'warning' | 'error';

export interface DocumentationIssue {
  id: string;
  issueType: IssueType;
  severity: IssueSeverity;
  message: string;
  path?: string;
}
