export type VisualCLICommand = 'run' | 'diff' | 'report' | 'help';

export interface VisualCLIParseResult {
  command: VisualCLICommand;
  baseSnapshotPath?: string;
  currentSnapshotPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class VisualTestCLI {
  public static parseArgs(args: string[]): VisualCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const firstArg = args[0].toLowerCase();
    let command: VisualCLICommand = 'help';
    if (firstArg === 'run') command = 'run';
    else if (firstArg === 'diff') command = 'diff';
    else if (firstArg === 'report') command = 'report';

    let baseSnapshotPath: string | undefined;
    let currentSnapshotPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--base=')) {
        baseSnapshotPath = arg.substring('--base='.length);
      } else if (arg.startsWith('--current=')) {
        currentSnapshotPath = arg.substring('--current='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      baseSnapshotPath,
      currentSnapshotPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: visual-test <command> [options]',
      '',
      'Commands:',
      '  run [options]      Execute visual regression test suite',
      '  diff --base=<path> --current=<path>  Compare two snapshot files',
      '  report --out=<path> Generate Markdown/JSON test report',
      '',
      'Options:',
      '  --base=<path>     Path to baseline snapshot file',
      '  --current=<path>  Path to current snapshot file',
      '  --out=<path>      Output destination for report',
    ].join('\n');
  }
}
