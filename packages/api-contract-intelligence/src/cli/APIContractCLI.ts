export type ContractCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface ContractCLIParseResult {
  command: ContractCLICommand;
  baseContractPath?: string;
  candidateContractPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class APIContractCLI {
  public static parseArgs(args: string[]): ContractCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: ContractCLICommand = 'help';
    if (first === 'analyze') command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report') command = 'report';

    let baseContractPath: string | undefined;
    let candidateContractPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--base=')) {
        baseContractPath = arg.substring('--base='.length);
      } else if (arg.startsWith('--candidate=')) {
        candidateContractPath = arg.substring('--candidate='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      baseContractPath,
      candidateContractPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: api-contract-intelligence <command> [options]',
      '',
      'Commands:',
      '  analyze [path]    Analyze API contract interfaces and methods',
      '  validate --base=<path> --candidate=<path> Validate backward compatibility',
      '  report --base=<path> --candidate=<path>  Generate Compatibility Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --base=<path>      Base API contract JSON file',
      '  --candidate=<path> Candidate API contract JSON file',
      '  --out=<path>       Output destination file for report',
    ].join('\n');
  }
}
