import { KnowledgeNode, KnowledgeEdge, KnowledgeGraph, NodeCategory, EdgeType } from '../model/KnowledgeModel';

export class KnowledgeGraphBuilder {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: KnowledgeEdge[] = [];

  public addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
  }

  public addEdge(sourceId: string, targetId: string, type: EdgeType, metadata?: Record<string, any>): void {
    this.edges.push({
      sourceId,
      targetId,
      type,
      metadata,
    });
  }

  public addPackage(id: string, label: string, metadata?: Record<string, any>): void {
    this.addNode({ id, label, category: 'package', metadata });
  }

  public addModule(id: string, label: string, filePath: string, parentPackageId?: string): void {
    this.addNode({ id, label, category: 'module', filePath });
    if (parentPackageId) {
      this.addEdge(parentPackageId, id, 'contains');
    }
  }

  public addSymbol(id: string, label: string, category: NodeCategory, parentModuleId: string): void {
    this.addNode({ id, label, category });
    this.addEdge(parentModuleId, id, 'exports');
  }

  public getGraph(): KnowledgeGraph {
    return {
      nodes: new Map(this.nodes),
      edges: [...this.edges],
      metadata: {
        generatedAt: new Date().toISOString(),
        totalNodes: this.nodes.size,
        totalEdges: this.edges.length,
      },
    };
  }

  public clear(): void {
    this.nodes.clear();
    this.edges = [];
  }
}
