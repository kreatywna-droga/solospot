export type GovCLICommand = 'validate' | 'policies' | 'report' | 'help';

export interface GovCLIParseResult {
  command: GovCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class MonorepoGovernanceCLI {
  public static parseArgs(args: string[]): GovCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: GovCLICommand = 'help';
    if (first === 'validate') command = 'validate';
    else if (first === 'policies') command = 'policies';
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
      'Usage: monorepo-governance <command> [options]',
      '',
      'Commands:',
      '  validate [path]   Validate workspace package compliance with governance policies',
      '  policies          List active monorepo package policies and rules',
      '  report [path]     Generate Governance Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target workspace or package path',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
