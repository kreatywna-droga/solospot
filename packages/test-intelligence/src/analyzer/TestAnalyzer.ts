import { TestArtifact, TestSuite, TestCoverage, TestIssue } from '../model/TestModel';

export class TestAnalyzer {
  public static analyzeTestFile(filePath: string, codeContent: string): TestArtifact {
    const testSuites: TestSuite[] = [];
    const suiteRegex = /(describe|it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    let match: RegExpExecArray | null;
    let testCount = 0;

    while ((match = suiteRegex.exec(codeContent)) !== null) {
      testCount++;
      testSuites.push({
        name: match[2],
        testCount: 1,
        hasAssertions: codeContent.includes('expect(') || codeContent.includes('assert'),
      });
    }

    const isEmpty = testCount === 0 || !codeContent.includes('expect(');

    return {
      filePath,
      testSuites,
      isEmpty,
    };
  }

  public static calculateStaticCoverage(sourceFilePaths: string[], testFilePaths: string[]): TestCoverage {
    const totalSourceFiles = sourceFilePaths.filter(f => !f.endsWith('.test.ts') && !f.endsWith('.spec.ts')).length;
    let testedSourceFiles = 0;

    for (const src of sourceFilePaths) {
      if (src.endsWith('.test.ts') || src.endsWith('.spec.ts')) continue;
      const baseName = src.split('/').pop()?.replace(/\.(ts|tsx)$/, '') || '';
      const hasTest = testFilePaths.some(t => t.includes(`${baseName}.test.`) || t.includes(`${baseName}.spec.`));
      if (hasTest) {
        testedSourceFiles++;
      }
    }

    const coveragePercentage = totalSourceFiles > 0 ? Math.round((testedSourceFiles / totalSourceFiles) * 100) : 100;

    return {
      totalSourceFiles,
      testedSourceFiles,
      coveragePercentage,
    };
  }
}
