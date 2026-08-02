export type ReleaseCLICommand = 'validate' | 'versions' | 'report' | 'help';

export interface ReleaseCLIParseResult {
  command: ReleaseCLICommand;
  versionArg?: string;
  changelogPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class ReleaseManagementCLI {
  public static parseArgs(args: string[]): ReleaseCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: ReleaseCLICommand = 'help';
    if (first === 'validate') command = 'validate';
    else if (first === 'versions') command = 'versions';
    else if (first === 'report') command = 'report';

    let versionArg: string | undefined;
    let changelogPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--version=')) {
        versionArg = arg.substring('--version='.length);
      } else if (arg.startsWith('--changelog=')) {
        changelogPath = arg.substring('--changelog='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      versionArg,
      changelogPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: release-management <command> [options]',
      '',
      'Commands:',
      '  validate --version=<ver>  Validate release readiness for a target version',
      '  versions                  Analyze package version alignment and SemVer',
      '  report --version=<ver>    Generate Release Readiness Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --version=<ver>    Target release version (e.g. 2.0.0)',
      '  --changelog=<path> Path to CHANGELOG.md file',
      '  --out=<path>       Output destination file for report',
    ].join('\n');
  }
}
