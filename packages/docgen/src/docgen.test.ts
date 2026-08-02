import { describe, it, expect } from 'vitest';
import {
  ApiExtractor,
  MarkdownGenerator,
  DependencyAnalyzer,
  DocgenCLI,
} from './index';

describe('Docgen Package Unit Tests', () => {
  it('should extract interfaces, types, enums and functions from TypeScript source', () => {
    const sampleCode = `
      export interface UserConfig {
        name: string;
        age?: number;
      }
      export type ThemeMode = 'light' | 'dark';
      export enum LogLevel { DEBUG, INFO }
      export class Logger {}
      export function formatUser(id: string) {}
    `;

    const moduleInfo = ApiExtractor.extractFromSource(sampleCode, 'TestModule');
    expect(moduleInfo.moduleName).toBe('TestModule');
    expect(moduleInfo.interfaces.length).toBe(1);
    expect(moduleInfo.interfaces[0].name).toBe('UserConfig');
    expect(moduleInfo.interfaces[0].properties.length).toBe(2);
    expect(moduleInfo.types.length).toBe(1);
    expect(moduleInfo.enums.length).toBe(1);
    expect(moduleInfo.classes.length).toBe(1);
    expect(moduleInfo.functions.length).toBe(1);
  });

  it('should generate Markdown documentation from extracted module', () => {
    const moduleInfo = ApiExtractor.extractFromSource(`
      export interface ButtonProps {
        label: string;
      }
    `, 'UIComponents');

    const markdown = MarkdownGenerator.generateModuleMarkdown(moduleInfo);
    expect(markdown).toContain('# API Documentation — UIComponents');
    expect(markdown).toContain('### `ButtonProps`');
    expect(markdown).toContain('| `label` | `string` | No |');
  });

  it('should extract imports and detect circular dependencies', () => {
    const source = `
      import { Logger } from './logger';
      import { colors } from '@web-factor/design-tokens';
    `;

    const imports = DependencyAnalyzer.extractImports(source);
    expect(imports).toEqual(['./logger', '@web-factor/design-tokens']);

    // Circular dependency check
    const graph = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ]);

    const report = DependencyAnalyzer.generateReport(graph);
    expect(report.totalModules).toBe(3);
    expect(report.circularDependencies.length).toBeGreaterThan(0);
    expect(report.circularDependencies[0].cycle).toContain('A');
  });

  it('should parse CLI arguments correctly', () => {
    const genResult = DocgenCLI.parseArgs(['generate', '--target=src/index.ts', '--out=docs/API.md']);
    expect(genResult.command).toBe('generate');
    expect(genResult.targetPath).toBe('src/index.ts');
    expect(genResult.outputFile).toBe('docs/API.md');

    const helpText = DocgenCLI.getHelpText();
    expect(helpText).toContain('Usage: docgen <command>');
  });
});
