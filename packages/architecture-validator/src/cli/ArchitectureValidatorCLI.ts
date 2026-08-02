export type ArchCLICommand = 'validate' | 'rules' | 'report' | 'help';

export interface ArchCLIParseResult {
  command: ArchCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class ArchitectureValidatorCLI {
  public static parseArgs(args: string[]): ArchCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: ArchCLICommand = 'help';
    if (first === 'validate') command = 'validate';
    else if (first === 'rules') command = 'rules';
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
      'Usage: architecture-validator <command> [options]',
      '',
      'Commands:',
      '  validate [path]   Validate monorepo architecture compliance and layer rules',
      '  rules             List all active architecture rules and severities',
      '  report [path]     Generate Architecture Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target package or workspace path',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
