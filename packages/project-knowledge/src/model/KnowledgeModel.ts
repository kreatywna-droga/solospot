export type NodeCategory = 'package' | 'module' | 'export' | 'interface' | 'class' | 'function';
export type EdgeType = 'depends_on' | 'exports' | 'contains' | 'implements' | 'uses';

export interface KnowledgeNode {
  id: string;
  label: string;
  category: NodeCategory;
  filePath?: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
  sourceId: string;
  targetId: string;
  type: EdgeType;
  metadata?: Record<string, any>;
}

export interface GraphMetadata {
  generatedAt: string;
  totalNodes: number;
  totalEdges: number;
  repositoryRoot?: string;
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
  metadata: GraphMetadata;
}
