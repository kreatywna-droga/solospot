// Knowledge Model API
export type {
  NodeCategory,
  EdgeType,
  KnowledgeNode,
  KnowledgeEdge,
  GraphMetadata,
  KnowledgeGraph,
} from './model/KnowledgeModel';

// Graph Builder API
export { KnowledgeGraphBuilder } from './builder/KnowledgeGraphBuilder';

// Query Engine API
export { KnowledgeQueryEngine } from './query/KnowledgeQueryEngine';

// Report Generator API
export { KnowledgeReportGenerator } from './report/KnowledgeReportGenerator';
export type { MostConnectedNodeInfo, KnowledgeReportData } from './report/KnowledgeReportGenerator';

// CLI API
export { ProjectKnowledgeCLI } from './cli/ProjectKnowledgeCLI';
export type { KnowledgeCLICommand, KnowledgeCLIParseResult } from './cli/ProjectKnowledgeCLI';
