export type RegistryCLICommand = 'validate' | 'graph' | 'report' | 'help';

export interface RegistryCLIParseResult {
  command: RegistryCLICommand;
  manifestPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class PackageRegistryCLI {
  public static parseArgs(args: string[]): RegistryCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: RegistryCLICommand = 'help';
    if (first === 'validate') command = 'validate';
    else if (first === 'graph') command = 'graph';
    else if (first === 'report') command = 'report';

    let manifestPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--manifest=')) {
        manifestPath = arg.substring('--manifest='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      manifestPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: package-registry <command> [options]',
      '',
      'Commands:',
      '  validate [path]   Validate package manifests format, SemVer, and IDs',
      '  graph [path]      Build dependency graph and detect circular dependencies',
      '  report [path]     Generate registry manifest report (Markdown/JSON)',
      '',
      'Options:',
      '  --manifest=<path> Path to manifest JSON file or workspace dir',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
