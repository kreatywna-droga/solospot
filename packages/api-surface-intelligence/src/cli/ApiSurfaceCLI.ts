// ---------------------------------------------------------------------------
// CLI types
// ---------------------------------------------------------------------------
export type ApiSurfaceCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type ApiSurfaceCLIFormat  = 'markdown' | 'json';

export interface ApiSurfaceCLIParseResult {
  command: ApiSurfaceCLICommand;
  /** --target=<path> */
  targetPath?: string;
  /** --out=<path> */
  outputPath?: string;
  /** --format=<markdown|json> */
  format: ApiSurfaceCLIFormat;
  /** Any remaining flags */
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// ApiSurfaceCLI — argument parser (no FS access, no Runtime integration)
// ---------------------------------------------------------------------------
export class ApiSurfaceCLI {
  public static parseArgs(args: string[]): ApiSurfaceCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: ApiSurfaceCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: ApiSurfaceCLIFormat = 'markdown';
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--target=')) {
        targetPath = arg.substring('--target='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--format=')) {
        const fmt = arg.substring('--format='.length).toLowerCase();
        format = fmt === 'json' ? 'json' : 'markdown';
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return { command, targetPath, outputPath, format, options };
  }

  public static getHelpText(): string {
    return [
      'Usage: api-surface <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse Public API export completeness, naming and contract compliance',
      '  validate  Validate API surface against contracts and classify issues',
      '  report    Generate API Surface Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to analyse (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
