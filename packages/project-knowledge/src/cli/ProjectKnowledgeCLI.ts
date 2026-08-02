export type KnowledgeCLICommand = 'build' | 'query' | 'report' | 'help';

export interface KnowledgeCLIParseResult {
  command: KnowledgeCLICommand;
  nodeId?: string;
  outputPath?: string;
  options: Record<string, string | boolean>;
}

export class ProjectKnowledgeCLI {
  public static parseArgs(args: string[]): KnowledgeCLIParseResult {
    if (args.length === 0) {
      return { command: 'help', options: {} };
    }

    const first = args[0].toLowerCase();
    let command: KnowledgeCLICommand = 'help';
    if (first === 'build') command = 'build';
    else if (first === 'query') command = 'query';
    else if (first === 'report') command = 'report';

    let nodeId: string | undefined;
    let outputPath: string | undefined;
    const options: Record<string, string | boolean> = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--node=')) {
        nodeId = arg.substring('--node='.length);
      } else if (arg.startsWith('--out=')) {
        outputPath = arg.substring('--out='.length);
      } else if (arg.startsWith('--')) {
        options[arg.substring(2)] = true;
      }
    }

    return {
      command,
      nodeId,
      outputPath,
      options,
    };
  }

  public static getHelpText(): string {
    return [
      'Usage: project-knowledge <command> [options]',
      '',
      'Commands:',
      '  build             Build project knowledge graph from source contracts',
      '  query --node=<id> Query dependencies or references for a given node',
      '  report            Generate knowledge graph statistics report (Markdown/JSON)',
      '',
      'Options:',
      '  --node=<id>        Target node identifier for queries',
      '  --out=<path>       Output destination file for report',
    ].join('\n');
  }
}
