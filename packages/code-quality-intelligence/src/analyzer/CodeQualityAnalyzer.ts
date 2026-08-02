import type {
  CodeQualityCategory,
  CodeQualityFileSnapshot,
  CodeQualityIssue,
  CodeQualityIssueType,
  CodeQualitySeverity,
} from '../model/CodeQualityModel';

// ---------------------------------------------------------------------------
// Quality Thresholds
// ---------------------------------------------------------------------------
const THRESHOLD_MAX_FILE_LINES        = 300; // max lines per file
const THRESHOLD_MAX_FUNCTION_LINES    = 50;  // max lines per function
const THRESHOLD_MAX_COMPLEXITY        = 10;  // max cyclomatic complexity per function
const THRESHOLD_MAX_PARAMETERS        = 4;   // max parameter count
const THRESHOLD_MIN_DUPLICATION_BLOCK = 5;   // min identical lines to count as duplicate

// Naming Regexes
const PASCAL_CASE_RE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE_RE  = /^[a-z][a-zA-Z0-9]*$/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: CodeQualityIssueType,
  category: CodeQualityCategory,
  severity: CodeQualitySeverity,
  filePath: string,
  message: string,
  opts: {
    lineNumber?: number;
    symbolName?: string;
    measuredValue?: number;
    threshold?: number;
    recommendation?: string;
  } = {}
): CodeQualityIssue {
  return {
    id: makeId(prefix),
    issueType,
    category,
    severity,
    filePath,
    message,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// CodeQualityAnalyzer — static, read-only code quality analyzer
// ---------------------------------------------------------------------------
export class CodeQualityAnalyzer {

  // ─── Parsing Helpers ────────────────────────────────----------------──────

  public static parseFiles(
    rawFiles: Array<{ filePath: string; content: string; packageName?: string }>
  ): CodeQualityFileSnapshot[] {
    return rawFiles.map((f) => ({
      filePath: f.filePath,
      content: f.content,
      lineCount: f.content.split('\n').length,
      packageName: f.packageName,
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  public static analyzeAll(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    return [
      ...CodeQualityAnalyzer.detectOversizedFiles(files),
      ...CodeQualityAnalyzer.detectHighComplexity(files),
      ...CodeQualityAnalyzer.detectLongFunctions(files),
      ...CodeQualityAnalyzer.detectDuplication(files),
      ...CodeQualityAnalyzer.detectNamingInconsistencies(files),
      ...CodeQualityAnalyzer.detectDeadCode(files),
      ...CodeQualityAnalyzer.detectDesignConventionBreaches(files),
    ];
  }

  // ─── File Length Analysis ─────────────────────────────────────────────────

  public static detectOversizedFiles(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    for (const file of files) {
      if (file.lineCount > THRESHOLD_MAX_FILE_LINES) {
        const sev: CodeQualitySeverity = file.lineCount > THRESHOLD_MAX_FILE_LINES * 2 ? 'error' : 'warning';
        issues.push(
          issue(
            'cq_file',
            'oversized_file',
            'file_length',
            sev,
            file.filePath,
            `File '${file.filePath}' is ${file.lineCount} lines long (threshold: ${THRESHOLD_MAX_FILE_LINES} lines).`,
            {
              measuredValue: file.lineCount,
              threshold: THRESHOLD_MAX_FILE_LINES,
              recommendation: `Split '${file.filePath}' into smaller sub-modules or focused helper files.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Complexity Analysis ──────────────────────────────────────────────────

  /**
   * Static estimate of cyclomatic complexity for functions in each file.
   * Counts decision keywords: if, else if, for, while, case, catch, &&, ||, ?.
   */
  public static detectHighComplexity(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    for (const file of files) {
      const functionBlocks = CodeQualityAnalyzer.extractFunctionBlocks(file.content);

      for (const fn of functionBlocks) {
        const complexity = CodeQualityAnalyzer.calculateCyclomaticComplexity(fn.body);
        if (complexity > THRESHOLD_MAX_COMPLEXITY) {
          const sev: CodeQualitySeverity = complexity > THRESHOLD_MAX_COMPLEXITY * 2 ? 'error' : 'warning';
          issues.push(
            issue(
              'cq_cplx',
              'high_cyclomatic_complexity',
              'complexity',
              sev,
              file.filePath,
              `Function '${fn.name}' has a cyclomatic complexity of ${complexity} (threshold: ${THRESHOLD_MAX_COMPLEXITY}).`,
              {
                lineNumber: fn.startLine,
                symbolName: fn.name,
                measuredValue: complexity,
                threshold: THRESHOLD_MAX_COMPLEXITY,
                recommendation: `Refactor '${fn.name}' by extracting sub-functions or using lookup tables instead of nested branch logic.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Function Length Analysis ─────────────────────────────────────────────

  public static detectLongFunctions(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    for (const file of files) {
      const functionBlocks = CodeQualityAnalyzer.extractFunctionBlocks(file.content);

      for (const fn of functionBlocks) {
        if (fn.lineCount > THRESHOLD_MAX_FUNCTION_LINES) {
          issues.push(
            issue(
              'cq_fnlen',
              'long_function',
              'function_length',
              'warning',
              file.filePath,
              `Function '${fn.name}' is ${fn.lineCount} lines long (threshold: ${THRESHOLD_MAX_FUNCTION_LINES} lines).`,
              {
                lineNumber: fn.startLine,
                symbolName: fn.name,
                measuredValue: fn.lineCount,
                threshold: THRESHOLD_MAX_FUNCTION_LINES,
                recommendation: `Decompose '${fn.name}' into smaller helper functions focused on single responsibilities.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Code Duplication Detection ───────────────────────────────────────────

  /**
   * Scan for duplicate sequences of non-trivial code lines (≥ 5 identical consecutive lines).
   */
  public static detectDuplication(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    const blockMap = new Map<string, Array<{ filePath: string; startLine: number }>>();

    for (const file of files) {
      const lines = file.content.split('\n').map((l) => l.trim());

      for (let i = 0; i <= lines.length - THRESHOLD_MIN_DUPLICATION_BLOCK; i++) {
        const slice = lines.slice(i, i + THRESHOLD_MIN_DUPLICATION_BLOCK);
        // Skip empty lines or trivial boilerplate (e.g. braces / imports)
        if (slice.every((l) => l.length < 5 || l.startsWith('import') || l.startsWith('export'))) {
          continue;
        }

        const key = slice.join('\n');
        const list = blockMap.get(key) ?? [];
        list.push({ filePath: file.filePath, startLine: i + 1 });
        blockMap.set(key, list);
      }
    }

    const reportedPairs = new Set<string>();

    for (const [, occurrences] of blockMap) {
      if (occurrences.length > 1) {
        const first = occurrences[0];
        const second = occurrences[1];
        const pairKey = `${first.filePath}:${first.startLine}<->${second.filePath}:${second.startLine}`;

        if (!reportedPairs.has(pairKey)) {
          reportedPairs.add(pairKey);
          issues.push(
            issue(
              'cq_dup',
              'code_duplication',
              'duplication',
              'warning',
              second.filePath,
              `Duplicated code block of ${THRESHOLD_MIN_DUPLICATION_BLOCK}+ lines found in '${second.filePath}' (line ${second.startLine}), matching '${first.filePath}' (line ${first.startLine}).`,
              {
                lineNumber: second.startLine,
                measuredValue: THRESHOLD_MIN_DUPLICATION_BLOCK,
                threshold: THRESHOLD_MIN_DUPLICATION_BLOCK,
                recommendation: `Extract the duplicate code block into a shared utility function or common module.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Naming Inconsistency Detection ──────────────────────────────────────

  public static detectNamingInconsistencies(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;

        // Class / Interface / Enum declaration -> PascalCase check
        const classMatch = /(?:class|interface|type|enum)\s+([A-Za-z0-9_]+)/g.exec(line);
        if (classMatch) {
          const name = classMatch[1];
          if (!PASCAL_CASE_RE.test(name)) {
            issues.push(
              issue(
                'cq_name',
                'naming_inconsistency',
                'naming_convention',
                'warning',
                file.filePath,
                `Type/Class name '${name}' at line ${lineNo} does not follow PascalCase convention.`,
                {
                  lineNumber: lineNo,
                  symbolName: name,
                  recommendation: `Rename '${name}' to PascalCase (e.g. MyType / MyClass).`,
                }
              )
            );
          }
        }

        // Function / Method declaration -> camelCase check
        const fnMatch = /function\s+([A-Za-z0-9_]+)/g.exec(line);
        if (fnMatch) {
          const name = fnMatch[1];
          if (!CAMEL_CASE_RE.test(name) && !PASCAL_CASE_RE.test(name)) {
            issues.push(
              issue(
                'cq_name',
                'naming_inconsistency',
                'naming_convention',
                'warning',
                file.filePath,
                `Function name '${name}' at line ${lineNo} does not follow camelCase convention.`,
                {
                  lineNumber: lineNo,
                  symbolName: name,
                  recommendation: `Rename '${name}' to camelCase.`,
                }
              )
            );
          }
        }
      }
    }

    return issues;
  }

  // ─── Dead Code Detection ──────────────────────────────────────────────────

  /**
   * Flag un-exported local functions that are never referenced within the file,
   * or large blocks of commented-out code.
   */
  public static detectDeadCode(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');
      let commentedLinesCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNo = i + 1;

        if (line.startsWith('//') && line.length > 20 && /[;{}()]/.test(line)) {
          commentedLinesCount++;
        }

        // Unused local function (not exported, function defined but name only appears once)
        const localFnMatch = /^function\s+([A-Za-z0-9_]+)/.exec(line);
        if (localFnMatch) {
          const fnName = localFnMatch[1];
          const occurrences = (file.content.match(new RegExp(`\\b${fnName}\\b`, 'g')) ?? []).length;
          if (occurrences === 1) {
            issues.push(
              issue(
                'cq_dead',
                'dead_code_detected',
                'dead_code',
                'info',
                file.filePath,
                `Local function '${fnName}' at line ${lineNo} is declared but never called within '${file.filePath}'.`,
                {
                  lineNumber: lineNo,
                  symbolName: fnName,
                  recommendation: `Remove unused function '${fnName}' or export it if intended for public use.`,
                }
              )
            );
          }
        }
      }

      if (commentedLinesCount >= 5) {
        issues.push(
          issue(
            'cq_dead',
            'dead_code_detected',
            'dead_code',
            'info',
            file.filePath,
            `File '${file.filePath}' contains ${commentedLinesCount} lines of commented-out code.`,
            {
              measuredValue: commentedLinesCount,
              recommendation: `Delete commented-out code blocks; use version control history to retrieve old code if needed.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Design Convention Breaches ───────────────────────────────────────────

  /**
   * Check for excessive parameters (> 4) and missing explicit return types on exported functions.
   */
  public static detectDesignConventionBreaches(files: CodeQualityFileSnapshot[]): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;

        const fnMatch = /(?:export\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/.exec(line);
        if (fnMatch) {
          const fnName = fnMatch[1];
          const paramStr = fnMatch[2].trim();
          const paramCount = paramStr.length > 0 ? paramStr.split(',').length : 0;

          if (paramCount > THRESHOLD_MAX_PARAMETERS) {
            issues.push(
              issue(
                'cq_param',
                'excessive_parameters',
                'design_convention',
                'warning',
                file.filePath,
                `Function '${fnName}' at line ${lineNo} accepts ${paramCount} parameters (threshold: ${THRESHOLD_MAX_PARAMETERS}).`,
                {
                  lineNumber: lineNo,
                  symbolName: fnName,
                  measuredValue: paramCount,
                  threshold: THRESHOLD_MAX_PARAMETERS,
                  recommendation: `Refactor '${fnName}' to accept an options object parameter instead of positional parameters.`,
                }
              )
            );
          }
        }
      }
    }

    return issues;
  }

  // ─── Maintainability Index Calculation ────────────────────────────────────

  /**
   * Calculate Maintainability Index score (0..100) based on average lines per file
   * and cyclomatic complexity across all scanned files.
   */
  public static calculateMaintainabilityIndex(
    files: CodeQualityFileSnapshot[],
    issues: CodeQualityIssue[]
  ): number {
    if (files.length === 0) return 100;

    const avgLines = files.reduce((s, f) => s + f.lineCount, 0) / files.length;
    const complexityIssues = issues.filter((i) => i.issueType === 'high_cyclomatic_complexity').length;
    const duplicationIssues  = issues.filter((i) => i.issueType === 'code_duplication').length;

    // Formula proxy: base 100 - penalties for average line count & issue density
    let mi = 100 - (avgLines / 15) - (complexityIssues * 3) - (duplicationIssues * 2);
    return Math.max(0, Math.min(100, Math.round(mi)));
  }

  // ─── Function Extraction Utility ──────────────────────────────────────────

  private static extractFunctionBlocks(content: string): Array<{
    name: string;
    startLine: number;
    lineCount: number;
    body: string;
  }> {
    const blocks: Array<{ name: string; startLine: number; lineCount: number; body: string }> = [];
    const lines = content.split('\n');

    let currentName: string | null = null;
    let startLine = 0;
    let bodyLines: string[] = [];
    let braceDepth = 0;
    let inFn = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inFn) {
        const match = /(?:function|class|method)\s+([A-Za-z0-9_]+)/.exec(line);
        if (match && line.includes('{')) {
          inFn = true;
          currentName = match[1];
          startLine = i + 1;
          bodyLines = [line];
          braceDepth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
        }
      } else {
        bodyLines.push(line);
        braceDepth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;

        if (braceDepth <= 0) {
          blocks.push({
            name: currentName ?? 'anonymous',
            startLine,
            lineCount: bodyLines.length,
            body: bodyLines.join('\n'),
          });
          inFn = false;
          currentName = null;
          bodyLines = [];
          braceDepth = 0;
        }
      }
    }

    return blocks;
  }

  private static calculateCyclomaticComplexity(code: string): number {
    // Base complexity is 1
    const matches = code.match(/\b(if|else\s+if|for|while|case|catch)\b|&&|\|\||\?/g);
    return 1 + (matches ? matches.length : 0);
  }
}
