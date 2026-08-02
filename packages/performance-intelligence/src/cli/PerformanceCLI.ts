export type PerformanceCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type PerformanceCLIFormat  = 'markdown' | 'json';

export interface PerformanceCLIParseResult {
  command: PerformanceCLICommand;
  targetPath?: string;
  outputPath?: string;
  format: PerformanceCLIFormat;
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// PerformanceCLI — argument parser (no FS access, no Runtime integration)
// ---------------------------------------------------------------------------
export class PerformanceCLI {
  public static parseArgs(args: string[]): PerformanceCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: PerformanceCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: PerformanceCLIFormat = 'markdown';
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
      'Usage: performance-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse module dependencies, import depth, hotspots and complexity',
      '  validate  Validate performance thresholds and classify risk issues',
      '  report    Generate Performance Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to analyse (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
