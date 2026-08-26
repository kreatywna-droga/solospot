/**
 * AdvancedSearch.ts — Sprint S6 Advanced Search Domain
 *
 * Indexing and querying logic for the Global Search capability.
 * Searches across BuilderDocument SSOT (nodes) and other assets.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';

export type SearchResultType = 'node' | 'panel' | 'action' | 'asset';

export interface SearchResult {
  readonly id: string;
  readonly title: string;
  readonly type: SearchResultType;
  readonly description?: string;
  readonly score: number;
}

export interface SearchQuery {
  readonly term: string;
  readonly limit?: number;
  readonly typeFilter?: ReadonlyArray<SearchResultType>;
}

export function performAdvancedSearch(
  document: BuilderDocument,
  query: SearchQuery
): ReadonlyArray<SearchResult> {
  const term = query.term.toLowerCase().trim();
  if (!term) return [];

  const results: SearchResult[] = [];

  // Simple string match scoring (mocking the indexing logic)
  const scoreMatch = (target: string) => {
    const t = target.toLowerCase();
    if (t === term) return 100;
    if (t.startsWith(term)) return 80;
    if (t.includes(term)) return 50;
    return 0;
  };

  // Search through BuilderDocument nodes (SSOT)
  if (!query.typeFilter || query.typeFilter.includes('node')) {
    const traverse = (node: SectionNode) => {
      const title = node.label ?? `${node.type} Node`;
      const score = scoreMatch(title);
      if (score > 0) {
        results.push({
          id: node.id,
          title,
          type: 'node',
          description: `Type: ${node.type}`,
          score,
        });
      }
      for (const child of node.children ?? []) {
        traverse(child);
      }
    };

    for (const page of document.pages ?? []) {
      for (const section of page.sections ?? []) {
        traverse(section);
      }
    }
  }

  // Sort by score descending and apply limit
  const limit = query.limit ?? 10;
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
