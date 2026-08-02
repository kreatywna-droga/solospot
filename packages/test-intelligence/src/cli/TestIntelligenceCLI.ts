export type TestCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface TestCLIParseResult {
  command: TestCLICommand;
  targetPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class TestIntelligenceCLI {
  public static parseArgs(args: string[]): TestCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: TestCLICommand = 'help';
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
      'Usage: test-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Analyze test suite completeness, assertions & source mapping',
      '  validate [path]   Validate static test coverage & detect empty/stub test files',
      '  report [path]     Generate Test Quality Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --target=<path>   Target source or test folder',
      '  --out=<path>      Output destination file for report',
    ].join('\n');
  }
}
