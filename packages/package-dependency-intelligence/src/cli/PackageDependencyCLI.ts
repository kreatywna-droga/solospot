export type PkgDepCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface PkgDepCLIParseResult {
  command: PkgDepCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class PackageDependencyCLI {
  public static parseArgs(args: string[]): PkgDepCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: PkgDepCLICommand = 'help';
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
      'Usage: package-dependency <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Analyze package dependency graph, coupling & orphans',
      '  validate [path]   Validate dependency policy compliance & detect cycles',
      '  report [path]     Generate Dependency Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target workspace or package folder',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
