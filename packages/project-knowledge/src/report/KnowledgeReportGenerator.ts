import { KnowledgeGraph } from '../model/KnowledgeModel';
import { KnowledgeQueryEngine } from '../query/KnowledgeQueryEngine';

export interface MostConnectedNodeInfo {
  id: string;
  label: string;
  category: string;
  connectionCount: number;
}

export interface KnowledgeReportData {
  timestamp: string;
  totalNodes: number;
  totalEdges: number;
  orphanNodesCount: number;
  mostConnectedNodes: MostConnectedNodeInfo[];
}

export class KnowledgeReportGenerator {
  public static generateReport(graph: KnowledgeGraph): KnowledgeReportData {
    const queryEngine = new KnowledgeQueryEngine(graph);
    const orphans = queryEngine.findOrphanNodes();

    const connectionCounts = new Map<string, number>();
    for (const id of graph.nodes.keys()) {
      connectionCounts.set(id, 0);
    }

    for (const edge of graph.edges) {
      connectionCounts.set(edge.sourceId, (connectionCounts.get(edge.sourceId) || 0) + 1);
      connectionCounts.set(edge.targetId, (connectionCounts.get(edge.targetId) || 0) + 1);
    }

    const sortedNodes = [...graph.nodes.values()]
      .map(n => ({
        id: n.id,
        label: n.label,
        category: n.category,
        connectionCount: connectionCounts.get(n.id) || 0,
      }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 10);

    return {
      timestamp: new Date().toISOString(),
      totalNodes: graph.metadata.totalNodes,
      totalEdges: graph.metadata.totalEdges,
      orphanNodesCount: orphans.length,
      mostConnectedNodes: sortedNodes,
    };
  }

  public static toMarkdown(data: KnowledgeReportData): string {
    const lines: string[] = [];

    lines.push('# Project Knowledge Graph Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Total Knowledge Nodes:** ${data.totalNodes}`);
    lines.push(`- **Total Relationships (Edges):** ${data.totalEdges}`);
    lines.push(`- **Orphaned Nodes Detected:** ${data.orphanNodesCount}`);
    lines.push('');

    lines.push('## Top Connected Modules & Packages');
    lines.push('');
    lines.push('| Node ID | Label | Category | Connections |');
    lines.push('|---------|-------|----------|-------------|');

    for (const node of data.mostConnectedNodes) {
      lines.push(`| \`${node.id}\` | ${node.label} | \`${node.category}\` | **${node.connectionCount}** |`);
    }
    lines.push('');

    return lines.join('\n');
  }

  public static toJSON(data: KnowledgeReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
