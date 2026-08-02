export type SecCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface SecCLIParseResult {
  command: SecCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class PlatformSecurityCLI {
  public static parseArgs(args: string[]): SecCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: SecCLICommand = 'help';
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
      'Usage: platform-security <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Analyze code exposure, postMessage wildcards & dynamic eval',
      '  validate [path]   Validate security findings against SecurityPolicy standards',
      '  report [path]     Generate Platform Security Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target source folder or file path',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
