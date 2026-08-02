// ---------------------------------------------------------------------------
// CLI command union
// ---------------------------------------------------------------------------
export type RepositoryCLICommand = 'analyze' | 'validate' | 'report' | 'help';

// ---------------------------------------------------------------------------
// Output format
// ---------------------------------------------------------------------------
export type RepositoryCLIFormat = 'markdown' | 'json';

// ---------------------------------------------------------------------------
// Parse result
// ---------------------------------------------------------------------------
export interface RepositoryCLIParseResult {
  command: RepositoryCLICommand;
  /** --target=<path> */
  targetPath?: string;
  /** --out=<path> */
  outputPath?: string;
  /** --format=<markdown|json> */
  format: RepositoryCLIFormat;
  /** Any remaining flags */
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// RepositoryIntelligenceCLI — argument parser (no execution, no FS access)
// ---------------------------------------------------------------------------
export class RepositoryIntelligenceCLI {
  public static parseArgs(args: string[]): RepositoryCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: RepositoryCLICommand = 'help';
    if (first === 'analyze')  command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: RepositoryCLIFormat = 'markdown';
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--target=')) {
        targetPath = arg.substring('--target='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--format=')) {
        const fmt = arg.substring('--format='.length).toLowerCase();
        if (fmt === 'json') format = 'json';
        else format = 'markdown';
      } else if (arg.startsWith('--')) {
        // Generic boolean flag
        options[arg.substring(2)] = true;
      }
    }

    return { command, targetPath, outputPath, format, options };
  }

  public static getHelpText(): string {
    return [
      'Usage: repository-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse directory structure, depth, empty dirs and duplicate structures',
      '  validate  Validate monorepo conventions and classify structural issues',
      '  report    Generate Repository Health Score and export report',
      '',
      'Options:',
      '  --target=<path>             Root path to analyse (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the report',
    ].join('\n');
  }
}
