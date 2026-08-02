export type SandboxCLICommand = 'validate' | 'permissions' | 'report' | 'help';

export interface SandboxCLIParseResult {
  command: SandboxCLICommand;
  pluginId?: string;
  requestPath?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class PluginSandboxCLI {
  public static parseArgs(args: string[]): SandboxCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: SandboxCLICommand = 'help';
    if (first === 'validate') command = 'validate';
    else if (first === 'permissions') command = 'permissions';
    else if (first === 'report') command = 'report';

    let pluginId: string | undefined;
    let requestPath: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--plugin=')) {
        pluginId = arg.substring('--plugin='.length);
      } else if (arg.startsWith('--request=')) {
        requestPath = arg.substring('--request='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      pluginId,
      requestPath,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: plugin-sandbox <command> [options]',
      '',
      'Commands:',
      '  validate --request=<path>    Validate plugin permission request and policies',
      '  permissions --plugin=<id>    List active permission grants for a plugin',
      '  report --request=<path>      Generate sandbox security analysis report (Markdown/JSON)',
      '',
      'Options:',
      '  --plugin=<id>      Target plugin identifier',
      '  --request=<path>   Path to permission request JSON file',
      '  --out=<path>       Output destination file for report',
    ].join('\n');
  }
}
