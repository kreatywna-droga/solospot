import { describe, it, expect } from 'vitest';
import {
  createReviewThread,
  resolveReviewThread,
} from '../ReviewThreads';

describe('ReviewWorkflow (PM44, ETAP 4)', () => {
  it('manages review threads and thread resolutions', () => {
    let thread = createReviewThread('proj-store-1', {
      commentId: 'c-1',
      authorUserId: 'user-rev-1',
      text: 'Please adjust fade-in duration.',
      createdAt: 1000,
    });

    expect(thread.isResolved).toBe(false);
    expect(thread.comments).toHaveLength(1);

    thread = resolveReviewThread(thread);
    expect(thread.isResolved).toBe(true);
  });
});
