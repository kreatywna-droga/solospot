export type DXCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface DXCLIParseResult {
  command: DXCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class DeveloperExperienceCLI {
  public static parseArgs(args: string[]): DXCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: DXCLICommand = 'help';
    if (first === 'analyze') command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report') command = 'report';

    let targetPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--target=')) {
        targetPath = arg.substring('--target='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      targetPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: developer-experience <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Analyze Public API consistency, ergonomics & naming conventions',
      '  validate [path]   Validate export completeness and DX policy compliance',
      '  report [path]     Generate Developer Experience Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target package or workspace folder',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
