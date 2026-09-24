/**
 * index.ts — HACP Web Design Intelligence Knowledge Layer (public API)
 *
 * Knowledge ≠ Execution. Consumers: SitePlanPlanner, LLMSitePlanner prompt,
 * E2E verification. Never imports BuilderDocument, HacpBridge, or request tools.
 */

export * from './types';
export {
  getKnowledgeRegistry,
  getEntriesByDomain,
  getEntryById,
} from './registry';
export type { KnowledgeRegistry } from './registry';
export {
  buildDecisionContext,
  extractBriefSignals,
  summarizeDecisionContext,
} from './retrieval';
