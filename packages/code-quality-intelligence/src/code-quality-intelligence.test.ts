import { describe, it, expect } from 'vitest';
import {
  CodeQualityAnalyzer,
  CodeQualityValidator,
  CodeQualityReportGenerator,
  CodeQualityCLI,
} from './index';
import type { CodeQualityFileSnapshot } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeFile(
  filePath: string,
  content: string,
  packageName = 'builder'
): CodeQualityFileSnapshot {
  return {
    filePath,
    content,
    lineCount: content.split('\n').length,
    packageName,
  };
}

// ===========================================================================
// 1. CodeQualityAnalyzer — parseFiles
// ===========================================================================
describe('CodeQualityAnalyzer — parseFiles', () => {
  it('converts raw inputs to CodeQualityFileSnapshot objects', () => {
    const files = CodeQualityAnalyzer.parseFiles([
      { filePath: 'src/utils.ts', content: 'export const add = (a, b) => a + b;' },
    ]);
    expect(files).toHaveLength(1);
    expect(files[0].filePath).toBe('src/utils.ts');
    expect(files[0].lineCount).toBe(1);
  });
});

// ===========================================================================
// 2. CodeQualityAnalyzer — detectOversizedFiles
// ===========================================================================
describe('CodeQualityAnalyzer — detectOversizedFiles', () => {
  it('flags files exceeding 300 lines', () => {
    const content = Array(350).fill('const x = 1;').join('\n');
    const file = makeFile('src/big.ts', content);
    const issues = CodeQualityAnalyzer.detectOversizedFiles([file]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('oversized_file');
    expect(issues[0].measuredValue).toBe(350);
    expect(issues[0].severity).toBe('warning');
  });

  it('assigns error severity for files exceeding 600 lines', () => {
    const content = Array(650).fill('const x = 1;').join('\n');
    const file = makeFile('src/huge.ts', content);
    const issues = CodeQualityAnalyzer.detectOversizedFiles([file]);
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues for small files', () => {
    const file = makeFile('src/small.ts', 'const x = 1;');
    expect(CodeQualityAnalyzer.detectOversizedFiles([file])).toHaveLength(0);
  });
});

// ===========================================================================
// 3. CodeQualityAnalyzer — detectHighComplexity (complexity evaluation)
// ===========================================================================
describe('CodeQualityAnalyzer — detectHighComplexity', () => {
  it('flags functions exceeding cyclomatic complexity threshold of 10', () => {
    const fnBody = `
      function complexFn(a, b, c) {
        if (a) console.log(1);
        if (b) console.log(2);
        if (c) console.log(3);
        if (a && b) console.log(4);
        if (b || c) console.log(5);
        for (let i=0; i<10; i++) { if (i > 5) break; }
        switch(a) { case 1: break; case 2: break; default: break; }
        try { if (c) throw new Error(); } catch(e) { if (a) return; }
      }
    `;
    const file = makeFile('src/complex.ts', fnBody);
    const issues = CodeQualityAnalyzer.detectHighComplexity([file]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('high_cyclomatic_complexity');
    expect(issues[0].symbolName).toBe('complexFn');
    expect(issues[0].measuredValue).toBeGreaterThan(10);
  });

  it('returns no complexity issues for simple functions', () => {
    const file = makeFile('src/simple.ts', 'function simple() { return 42; }');
    expect(CodeQualityAnalyzer.detectHighComplexity([file])).toHaveLength(0);
  });
});

// ===========================================================================
// 4. CodeQualityAnalyzer — detectDuplication (duplication detection)
// ===========================================================================
describe('CodeQualityAnalyzer — detectDuplication', () => {
  it('flags identical code blocks of 5+ lines across files', () => {
    const duplicateBlock = [
      'const a = calculateAlphaValue(10, 20);',
      'const b = calculateBetaValue(30, 40);',
      'const result = a + b * 100;',
      'console.log("Processing block result:", result);',
      'return formatResultString(result);',
    ].join('\n');

    const file1 = makeFile('src/file1.ts', `function process1() {\n${duplicateBlock}\n}`);
    const file2 = makeFile('src/file2.ts', `function process2() {\n${duplicateBlock}\n}`);

    const issues = CodeQualityAnalyzer.detectDuplication([file1, file2]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.issueType === 'code_duplication')).toBe(true);
  });

  it('ignores short or trivial boilerplate lines', () => {
    const file1 = makeFile('src/file1.ts', '{\n}\n{\n}\n{\n}');
    const file2 = makeFile('src/file2.ts', '{\n}\n{\n}\n{\n}');
    expect(CodeQualityAnalyzer.detectDuplication([file1, file2])).toHaveLength(0);
  });
});

// ===========================================================================
// 5. CodeQualityAnalyzer — detectNamingInconsistencies & detectDeadCode
// ===========================================================================
describe('CodeQualityAnalyzer — detectNamingInconsistencies & detectDeadCode', () => {
  it('flags non-PascalCase interface names', () => {
    const file = makeFile('src/types.ts', 'interface my_bad_interface { id: string; }');
    const issues = CodeQualityAnalyzer.detectNamingInconsistencies([file]);
    expect(issues).toHaveLength(1);
    expect(issues[0].symbolName).toBe('my_bad_interface');
  });

  it('flags unused local functions (dead code)', () => {
    const file = makeFile('src/unused.ts', 'function unusedPrivateHelper() { return 1; }');
    const issues = CodeQualityAnalyzer.detectDeadCode([file]);
    expect(issues.some((i) => i.issueType === 'dead_code_detected')).toBe(true);
    expect(issues.some((i) => i.symbolName === 'unusedPrivateHelper')).toBe(true);
  });

  it('flags large commented-out code blocks', () => {
    const content = [
      '// const oldFunction = () => {',
      '//   console.log("old logic");',
      '//   return false;',
      '// };',
      '// const anotherOldLine = true;',
    ].join('\n');
    const file = makeFile('src/commented.ts', content);
    const issues = CodeQualityAnalyzer.detectDeadCode([file]);
    expect(issues.some((i) => i.issueType === 'dead_code_detected')).toBe(true);
  });
});

// ===========================================================================
// 6. CodeQualityAnalyzer — detectDesignConventionBreaches
// ===========================================================================
describe('CodeQualityAnalyzer — detectDesignConventionBreaches', () => {
  it('flags functions with more than 4 positional parameters', () => {
    const file = makeFile('src/params.ts', 'function badParams(a, b, c, d, e) { return a; }');
    const issues = CodeQualityAnalyzer.detectDesignConventionBreaches([file]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('excessive_parameters');
    expect(issues[0].measuredValue).toBe(5);
  });

  it('returns no issues for functions with <= 4 parameters', () => {
    const file = makeFile('src/params.ts', 'function goodParams(a, b, c, d) { return a; }');
    expect(CodeQualityAnalyzer.detectDesignConventionBreaches([file])).toHaveLength(0);
  });
});

// ===========================================================================
// 7. CodeQualityValidator — assessIssues & calculateMaintainabilityIndex
// ===========================================================================
describe('CodeQualityValidator — assessIssues', () => {
  it('returns zero counts for clean files', () => {
    const assessment = CodeQualityValidator.assessIssues([], []);
    expect(assessment.totalIssues).toBe(0);
    expect(assessment.maintainabilityIndex).toBe(100);
  });

  it('correctly aggregates issues by category and type', () => {
    const file = makeFile('src/params.ts', 'function badParams(a, b, c, d, e) { return a; }');
    const issues = CodeQualityAnalyzer.detectDesignConventionBreaches([file]);
    const assessment = CodeQualityValidator.assessIssues(issues, [file]);

    expect(assessment.totalIssues).toBe(1);
    expect(assessment.byCategory['design_convention']).toBeDefined();
    expect(assessment.byType['excessive_parameters']).toBeDefined();
  });
});

// ===========================================================================
// 8. CodeQualityValidator — validateLimits & prioritiseRecommendations
// ===========================================================================
describe('CodeQualityValidator — validateLimits & prioritiseRecommendations', () => {
  it('passes all metrics for a clean project', () => {
    const metrics = CodeQualityValidator.validateLimits([], []);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails maintainabilityIndex metric when MI drops below 70', () => {
    const files = [makeFile('src/big.ts', Array(400).fill('const x=1;').join('\n'))];
    const complexityIssues = [
      { id: '1', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '2', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '3', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '4', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '5', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '6', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '7', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
      { id: '8', issueType: 'high_cyclomatic_complexity' as const, category: 'complexity' as const, severity: 'warning' as const, message: '', filePath: 'src/big.ts' },
    ];
    const metrics = CodeQualityValidator.validateLimits(complexityIssues, files);
    expect(metrics.find((m) => m.metricName === 'maintainabilityIndex')?.passing).toBe(false);
  });

  it('prioritises complexity recommendations at priority 1', () => {
    const issue = {
      id: '1',
      issueType: 'high_cyclomatic_complexity' as const,
      category: 'complexity' as const,
      severity: 'warning' as const,
      message: 'high complexity',
      filePath: 'src/complex.ts',
    };
    const recs = CodeQualityValidator.prioritiseRecommendations([issue]);
    expect(recs[0].priority).toBe(1);
    expect(recs[0].category).toBe('complexity');
    expect(recs[0].estimatedImpact).toBe('high');
  });
});

// ===========================================================================
// 9. CodeQualityReportGenerator
// ===========================================================================
describe('CodeQualityReportGenerator — calculateScore & deriveGrade', () => {
  it('returns 100 and A+ for clean assessment', () => {
    const assessment = CodeQualityValidator.assessIssues([], []);
    const score = CodeQualityReportGenerator.calculateScore(assessment);
    expect(score).toBe(100);
    expect(CodeQualityReportGenerator.deriveGrade(score)).toBe('A+');
  });

  it('derives correct grades based on score', () => {
    expect(CodeQualityReportGenerator.deriveGrade(97)).toBe('A+');
    expect(CodeQualityReportGenerator.deriveGrade(90)).toBe('A');
    expect(CodeQualityReportGenerator.deriveGrade(80)).toBe('B');
    expect(CodeQualityReportGenerator.deriveGrade(65)).toBe('C');
    expect(CodeQualityReportGenerator.deriveGrade(50)).toBe('D');
    expect(CodeQualityReportGenerator.deriveGrade(40)).toBe('F');
  });
});

describe('CodeQualityReportGenerator — generateReport & exports', () => {
  it('generates a full CodeQualityReport', () => {
    const file = makeFile('src/clean.ts', 'const a = 1;');
    const assessment = CodeQualityValidator.assessIssues([], [file]);
    const report = CodeQualityReportGenerator.generateReport(assessment, [], [file]);

    expect(report.codeQualityHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.scannedFileCount).toBe(1);
    expect(report.totalLinesOfCode).toBe(1);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exports valid Markdown', () => {
    const assessment = CodeQualityValidator.assessIssues([], []);
    const report = CodeQualityReportGenerator.generateReport(assessment, [], []);
    const md = CodeQualityReportGenerator.toMarkdown(report);
    expect(md).toContain('# Code Quality Intelligence Health Report');
    expect(md).toContain('Maintainability Index');
  });

  it('exports valid JSON', () => {
    const assessment = CodeQualityValidator.assessIssues([], []);
    const report = CodeQualityReportGenerator.generateReport(assessment, [], []);
    const json = CodeQualityReportGenerator.toJSON(report);
    expect(json).toContain('"codeQualityHealthScore"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 10. CodeQualityCLI
// ===========================================================================
describe('CodeQualityCLI', () => {
  it('defaults to help with no args', () => {
    expect(CodeQualityCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(CodeQualityCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(CodeQualityCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(CodeQualityCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses options --target, --out, --format', () => {
    const res = CodeQualityCLI.parseArgs(['report', '--target=src', '--format=json', '--out=q.json']);
    expect(res.targetPath).toBe('src');
    expect(res.format).toBe('json');
    expect(res.outputPath).toBe('q.json');
  });

  it('help text contains commands and options', () => {
    const help = CodeQualityCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 11. analyzeAll — integration smoke test
// ===========================================================================
describe('CodeQualityAnalyzer — analyzeAll integration', () => {
  it('returns no warnings for clean, formatted TypeScript code', () => {
    const file = makeFile(
      'src/clean.ts',
      'export function calculateTotal(price: number, taxRate: number): number {\n  return price * (1 + taxRate);\n}\n'
    );
    const issues = CodeQualityAnalyzer.analyzeAll([file]);
    expect(issues).toHaveLength(0);
  });

  it('returns combined issues across multiple passes for messy code', () => {
    const duplicateBlock = [
      'const val1 = processFirstItem(100);',
      'const val2 = processSecondItem(200);',
      'const combined = val1 + val2;',
      'console.log("Combined result:", combined);',
      'return combined;',
    ].join('\n');

    const file1 = makeFile('src/bad1.ts', `function bad_name_fn(a, b, c, d, e) {\n${duplicateBlock}\n}`);
    const file2 = makeFile('src/bad2.ts', `function another_fn() {\n${duplicateBlock}\n}`);

    const issues = CodeQualityAnalyzer.analyzeAll([file1, file2]);
    const types = new Set(issues.map((i) => i.issueType));
    expect(types.size).toBeGreaterThan(1);
  });
});
