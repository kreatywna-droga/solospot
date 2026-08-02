export type CLICommand = 'generate' | 'analyze' | 'validate' | 'help';

export interface CLIParseResult {
  command: CLICommand;
  targetPath?: string;
  outputFile?: string;
  options: Record<string, string | boolean>;
}

export class DocgenCLI {
  public static parseArgs(args: string[]): CLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const commandArg = args[0].toLowerCase();
    let command: CLICommand = 'help';
    if (commandArg === 'generate') command = 'generate';
    else if (commandArg === 'analyze') command = 'analyze';
    else if (commandArg === 'validate') command = 'validate';

    let targetPath: string | undefined;
    let outputFile: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--target=')) {
        targetPath = arg.substring('--target='.length);
      } else if (arg.startsWith('--out=')) {
        outputFile = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        const flagName = arg.substring(2);
        options[flagName] = true;
      } else if (!targetPath) {
        targetPath = arg;
      }
    }

    return {
      command,
      targetPath,
      outputFile,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: docgen <command> [options]',
      '',
      'Commands:',
      '  generate [path]   Extract API and generate Markdown documentation',
      '  analyze [path]    Analyze package dependencies and circular imports',
      '  validate [path]   Validate TypeScript export completeness and docs',
      '',
      'Options:',
      '  --target=<path>   Target source directory or file',
      '  --out=<file>      Output markdown destination file',
    ].join('\n');
  }
}
