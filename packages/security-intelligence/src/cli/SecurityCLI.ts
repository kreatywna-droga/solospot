export type SecurityCLICommand = 'analyze' | 'validate' | 'report' | 'help';
export type SecurityCLIFormat  = 'markdown' | 'json';

export interface SecurityCLIParseResult {
  command: SecurityCLICommand;
  targetPath?: string;
  outputPath?: string;
  format: SecurityCLIFormat;
  options: Record<string, string | boolean>;
}

// ---------------------------------------------------------------------------
// SecurityCLI — argument parser (no FS access, no Runtime integration)
// ---------------------------------------------------------------------------
export class SecurityCLI {
  public static parseArgs(args: string[]): SecurityCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', format: 'markdown', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: SecurityCLICommand = 'help';
    if (first === 'analyze')       command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report')   command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    let format: SecurityCLIFormat = 'markdown';
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
      'Usage: security-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze   Scan source code, secrets, unsafe patterns, dependencies and config risks',
      '  validate  Validate security policy compliance and classify threat findings',
      '  report    Generate Security Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>             Root path to scan (default: current directory)',
      '  --format=<markdown|json>    Output format (default: markdown)',
      '  --out=<path>                Destination file for the generated report',
    ].join('\n');
  }
}
