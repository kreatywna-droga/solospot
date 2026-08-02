import { describe, it, expect } from 'vitest';
import {
  KnowledgeGraphBuilder,
  KnowledgeQueryEngine,
  KnowledgeReportGenerator,
  ProjectKnowledgeCLI,
} from './index';

describe('Project Knowledge Graph Platform Unit Tests', () => {
  it('should build knowledge graph connecting packages, modules and symbols', () => {
    const builder = new KnowledgeGraphBuilder();
    builder.addPackage('pkg-core', '@web-factor/builder-core');
    builder.addModule('mod-canvas', 'CanvasState.ts', 'src/CanvasState.ts', 'pkg-core');
    builder.addSymbol('sym-reducer', 'reduceCanvasState', 'function', 'mod-canvas');

    const graph = builder.getGraph();
    expect(graph.metadata.totalNodes).toBe(3);
    expect(graph.metadata.totalEdges).toBe(2);
  });

  it('should query dependencies, references and shortest path between nodes', () => {
    const builder = new KnowledgeGraphBuilder();
    builder.addPackage('pkg-a', 'Package A');
    builder.addPackage('pkg-b', 'Package B');
    builder.addPackage('pkg-c', 'Package C');
    builder.addEdge('pkg-a', 'pkg-b', 'depends_on');
    builder.addEdge('pkg-b', 'pkg-c', 'depends_on');

    const graph = builder.getGraph();
    const query = new KnowledgeQueryEngine(graph);

    const depsA = query.findDependencies('pkg-a');
    expect(depsA.length).toBe(1);
    expect(depsA[0].id).toBe('pkg-b');

    const refsB = query.findReferences('pkg-b');
    expect(refsB.length).toBe(1);
    expect(refsB[0].id).toBe('pkg-a');

    const path = query.findPath('pkg-a', 'pkg-c');
    expect(path).toEqual(['pkg-a', 'pkg-b', 'pkg-c']);
  });

  it('should detect orphan nodes and generate reports', () => {
    const builder = new KnowledgeGraphBuilder();
    builder.addPackage('pkg-active', 'Active');
    builder.addPackage('pkg-target', 'Target');
    builder.addPackage('pkg-orphan', 'Orphan');
    builder.addEdge('pkg-active', 'pkg-target', 'depends_on');

    const graph = builder.getGraph();
    const query = new KnowledgeQueryEngine(graph);
    const orphans = query.findOrphanNodes();

    expect(orphans.length).toBe(1);
    expect(orphans[0].id).toBe('pkg-orphan');

    const report = KnowledgeReportGenerator.generateReport(graph);
    expect(report.totalNodes).toBe(3);
    expect(report.orphanNodesCount).toBe(1);

    const md = KnowledgeReportGenerator.toMarkdown(report);
    expect(md).toContain('# Project Knowledge Graph Analysis Report');

    const json = KnowledgeReportGenerator.toJSON(report);
    expect(json).toContain('"totalNodes": 3');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = ProjectKnowledgeCLI.parseArgs(['query', '--node=pkg-core']);
    expect(parseRes.command).toBe('query');
    expect(parseRes.nodeId).toBe('pkg-core');

    const help = ProjectKnowledgeCLI.getHelpText();
    expect(help).toContain('Usage: project-knowledge <command>');
  });
});
