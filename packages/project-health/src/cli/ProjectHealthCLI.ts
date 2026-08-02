export type HealthCLICommand = 'analyze' | 'metrics' | 'report' | 'help';

export interface HealthCLIParseResult {
  command: HealthCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class ProjectHealthCLI {
  public static parseArgs(args: string[]): HealthCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: HealthCLICommand = 'help';
    if (first === 'analyze') command = 'analyze';
    else if (first === 'metrics') command = 'metrics';
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
      'Usage: project-health <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Perform full quality & architecture health analysis',
      '  metrics [path]    Collect lines of code, export, and module size metrics',
      '  report [path]     Generate Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target source directory or package path',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
