import { DocumentationArtifact, DocumentationIssue } from '../model/DocModel';

export class CoverageValidator {
  public static validateReferences(artifacts: DocumentationArtifact[], existingFilePaths: Set<string>): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];

    for (const art of artifacts) {
      for (const ref of art.references) {
        // Only validate local relative / file links
        if (!ref.targetPath.startsWith('http://') && !ref.targetPath.startsWith('https://')) {
          const cleanPath = ref.targetPath.replace(/^file:\/\/\/?/, '').split('#')[0];
          if (cleanPath && !existingFilePaths.has(cleanPath)) {
            issues.push({
              id: `issue_link_${Math.random().toString(36).substring(2, 6)}`,
              issueType: 'invalid_link',
              severity: 'warning',
              message: `Broken reference link '[${ref.linkText}](${ref.targetPath})' in '${art.path}'.`,
              path: art.path,
            });
          }
        }
      }
    }

    return issues;
  }

  public static validatePackageReadmes(packagePaths: string[], docFilePaths: string[]): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];

    for (const pkg of packagePaths) {
      const hasReadme = docFilePaths.some(d => d.startsWith(pkg) && d.endsWith('README.md'));
      if (!hasReadme) {
        issues.push({
          id: `issue_missing_readme_${Math.random().toString(36).substring(2, 6)}`,
          issueType: 'missing_doc',
          severity: 'error',
          message: `Package '${pkg}' is missing mandatory README.md documentation.`,
          path: pkg,
        });
      }
    }

    return issues;
  }
}
