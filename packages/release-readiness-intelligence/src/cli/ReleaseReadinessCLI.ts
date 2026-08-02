export type ReleaseReadinessCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type ReleaseReadinessCLIFormat  = 'markdown' | 'json';

export interface ReleaseReadinessCLIParseResult {
  command: ReleaseReadinessCLICommand;
  targetPath?: string;
  outputPath?: string;
  format: ReleaseReadinessCLIFormat;
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// ReleaseReadinessCLI — argument parser (no FS access, no Runtime/CI-CD integration)
// ---------------------------------------------------------------------------
export class ReleaseReadinessCLI {
  public static parseArgs(args: string[]): ReleaseReadinessCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: ReleaseReadinessCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: ReleaseReadinessCLIFormat = 'markdown';
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
      'Usage: release-readiness <command> [options]',
      '',
      'Commands:',
      '  analyze   Analyse Quality Gates, Intelligence report summaries, and Architecture Freeze readiness',
      '  validate  Validate mandatory release gates and derive Ready / Conditionally Ready / Not Ready status',
      '  report    Generate Release Readiness Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to scan (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
