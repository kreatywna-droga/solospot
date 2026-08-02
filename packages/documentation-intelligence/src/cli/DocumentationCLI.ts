export type DocumentationCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type DocumentationCLIFormat  = 'markdown' | 'json';

export interface DocumentationCLIParseResult {
  command: DocumentationCLICommand;
  targetPath?: string;
  outputPath?: string;
  format: DocumentationCLIFormat;
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// DocumentationCLI — argument parser (no FS access, no Runtime integration)
// ---------------------------------------------------------------------------
export class DocumentationCLI {
  public static parseArgs(args: string[]): DocumentationCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: DocumentationCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: DocumentationCLIFormat = 'markdown';
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
      'Usage: documentation-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse documentation completeness, ADR coverage, orphaned docs, and quality',
      '  validate  Validate documentation standards and coverage metrics',
      '  report    Generate Documentation Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to analyse (default: docs directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
