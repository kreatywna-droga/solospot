export type DependencyCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type DependencyCLIFormat  = 'markdown' | 'json';

export interface DependencyCLIParseResult {
  command: DependencyCLICommand;
  targetPath?: string;
  outputPath?: string;
  format: DependencyCLIFormat;
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// DependencyCLI — argument parser (no FS access, no Runtime integration)
// ---------------------------------------------------------------------------
export class DependencyCLI {
  public static parseArgs(args: string[]): DependencyCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: DependencyCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: DependencyCLIFormat = 'markdown';
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
      'Usage: dependency-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse dependency cycles, version mismatches, unused/orphaned deps and graph depth',
      '  validate  Validate dependency graph limits and health metrics',
      '  report    Generate Dependency Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to scan (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
