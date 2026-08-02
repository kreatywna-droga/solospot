export type ObsCLICommand = 'analyze' | 'validate' | 'report' | 'help';

export interface ObsCLIParseResult {
  command: ObsCLICommand;
  telemetryPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class RuntimeObservabilityCLI {
  public static parseArgs(args: string[]): ObsCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: ObsCLICommand = 'help';
    if (first === 'analyze') command = 'analyze';
    else if (first === 'validate') command = 'validate';
    else if (first === 'report') command = 'report';

    let telemetryPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--telemetry=')) {
        telemetryPath = arg.substring('--telemetry='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      telemetryPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: runtime-observability <command> [options]',
      '',
      'Commands:',
      '  analyze --telemetry=<path>  Analyze runtime execution spans, latency & event queues',
      '  validate --telemetry=<path> Validate performance thresholds and trace consistency',
      '  report --telemetry=<path>   Generate Runtime Health Score report (Markdown/JSON)',
      '',
      'Options:',
      '  --telemetry=<path> Target telemetry JSON dump file',
      '  --out=<path>       Output destination file for report',
    ].join('\n');
  }
}
