import { describe, it, expect } from 'vitest';
import {
  createRevisionHistoryState,
  commitRevision,
  getRevision,
} from '../RevisionHistory';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';

describe('RevisionHistory (Sprint S7)', () => {
  it('commits a revision and retrieves it', () => {
    let state = createRevisionHistoryState();
    const doc = createBuilderDocument({ id: 'd1', tenantId: 't1' });
    
    state = commitRevision(state, doc, 'author-1', 'Initial commit');
    
    expect(state.revisions).toHaveLength(1);
    
    const revId = state.revisions[0].revisionId;
    const rev = getRevision(state, revId);
    
    expect(rev?.commitMessage).toBe('Initial commit');
    expect(rev?.authorId).toBe('author-1');
  });
});
