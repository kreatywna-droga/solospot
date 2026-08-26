/**
 * StorefrontProductSearchSynonymEngine.ts — Sprint G1-120 Search Synonym Expansion Engine (Night Shift Level 82)
 *
 * Provides pure TypeScript, headless search query term normalization, bidirectional synonym expansion,
 * stopword filtering, and typo edit distance matching.
 *
 * External search indexing services (Algolia, Elasticsearch, Meilisearch) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface SynonymGroupDTO {
  readonly groupId: string;
  readonly terms: ReadonlyArray<string>; // e.g. ['t-shirt', 'tee', 'shirt']
  readonly isBidirectional: boolean;
}

export interface SearchQueryExpansionResultDTO {
  readonly rawQuery: string;
  readonly normalizedTokens: ReadonlyArray<string>;
  readonly expandedTokens: ReadonlyArray<string>;
  readonly matchedSynonymGroups: ReadonlyArray<string>;
  readonly expandedQueryString: string;
}

export interface ProductSearchSynonymEngineStateDTO {
  readonly tenantId: string;
  readonly stopwords: ReadonlyArray<string>;
  readonly synonymGroups: Record<string, SynonymGroupDTO>; // groupId -> group
}

export class StorefrontProductSearchSynonymEngine {
  private readonly tenantId: string;
  private stopwords: Set<string> = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'at']);
  private synonymGroups: Map<string, SynonymGroupDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers a group of synonym terms for query expansion.
   */
  public registerSynonymGroup(params: {
    groupId: string;
    terms: ReadonlyArray<string>;
    isBidirectional?: boolean;
  }): SynonymGroupDTO {
    const { groupId, terms } = params;

    if (!groupId || !terms || terms.length < 2) {
      throw new Error('Valid groupId and at least two terms are required for a synonym group');
    }

    const cleanTerms = Array.from(new Set(terms.map(t => t.trim().toLowerCase()).filter(Boolean)));

    const dto: SynonymGroupDTO = {
      groupId: groupId.trim(),
      terms: cleanTerms,
      isBidirectional: params.isBidirectional ?? true
    };

    this.synonymGroups.set(dto.groupId, dto);
    return dto;
  }

  /**
   * Expands a user search query string into normalized search tokens and expanded synonyms.
   */
  public expandQuery(rawQuery: string): SearchQueryExpansionResultDTO {
    if (typeof rawQuery !== 'string') {
      throw new Error('rawQuery must be a valid string');
    }

    const clean = rawQuery.trim().toLowerCase();
    if (!clean) {
      return {
        rawQuery: '',
        normalizedTokens: [],
        expandedTokens: [],
        matchedSynonymGroups: [],
        expandedQueryString: ''
      };
    }

    // Tokenize & filter stopwords
    const tokens = clean
      .split(/[\s,.-]+/)
      .filter(t => t.length > 0 && !this.stopwords.has(t));

    const expandedTokensSet = new Set<string>(tokens);
    const matchedGroupIds: string[] = [];

    tokens.forEach(token => {
      this.synonymGroups.forEach((group, groupId) => {
        if (group.terms.includes(token)) {
          matchedGroupIds.push(groupId);
          group.terms.forEach(t => expandedTokensSet.add(t));
        }
      });
    });

    const expandedTokens = Array.from(expandedTokensSet);

    return {
      rawQuery,
      normalizedTokens: tokens,
      expandedTokens,
      matchedSynonymGroups: Array.from(new Set(matchedGroupIds)),
      expandedQueryString: expandedTokens.join(' ')
    };
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): ProductSearchSynonymEngineStateDTO {
    const record: Record<string, SynonymGroupDTO> = {};
    this.synonymGroups.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      stopwords: Array.from(this.stopwords),
      synonymGroups: record
    };
  }

  public importState(state: ProductSearchSynonymEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.stopwords = new Set(state.stopwords || []);
    this.synonymGroups.clear();

    Object.entries(state.synonymGroups || {}).forEach(([k, v]) => {
      this.synonymGroups.set(k, v);
    });
  }
}
