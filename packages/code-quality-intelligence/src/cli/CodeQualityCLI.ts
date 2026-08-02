export type CodeQualityCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type CodeQualityCLIFormat  = 'markdown' | 'json';

export interface CodeQualityCLIParseResult {
  command: CodeQualityCLICommand;
  targetPath?: string;
  outputPath?: string;
  format: CodeQualityCLIFormat;
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// CodeQualityCLI — argument parser (no FS access, no Runtime integration)
// ---------------------------------------------------------------------------
export class CodeQualityCLI {
  public static parseArgs(args: string[]): CodeQualityCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: CodeQualityCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: CodeQualityCLIFormat = 'markdown';
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--target=')) {
        targetPath = arg.substring('--target='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--format=')) {
        format = arg.substring('--format='.length).toLowerCase() === 'json' ? 'json' : 'markdown';
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return { command, targetPath, outputPath, format, options };
  }

  public static getHelpText(): string {
    return [
      'Usage: code-quality-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse complexity, duplication, function/file length, naming and dead code',
      '  validate  Validate quality thresholds and Maintainability Index',
      '  report    Generate Code Quality Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to scan (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
