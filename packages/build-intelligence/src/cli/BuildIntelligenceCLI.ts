export type BuildCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface BuildCLIParseResult {
  command: BuildCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class BuildIntelligenceCLI {
  public static parseArgs(args: string[]): BuildCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: BuildCLICommand = 'help';
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

    return { command, targetPath, outputPath, options };
  }

  public static getHelpText(): string {
    return [
      'Usage: build-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Analyze TypeScript, bundler configs and package.json consistency',
      '  validate [path]   Validate build config compliance and classify issues',
      '  report [path]     Generate Build Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target package or workspace root',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
