import { describe, it, expect } from 'vitest';
import {
  createBookmarksState,
  addBookmark,
  removeBookmark,
  getNextBookmarkTime,
  getPreviousBookmarkTime,
} from '../TimelineBookmarks';

describe('Bookmarks (PM40, ETAP 5 & DECISION-067)', () => {
  it('adds and sorts bookmarks immutably by timeMs (DECISION-067)', () => {
    let state = createBookmarksState();

    state = addBookmark(state, { id: 'bm-2', name: 'Outro', timeMs: 1200 });
    state = addBookmark(state, { id: 'bm-1', name: 'Intro', timeMs: 300 });

    expect(state.bookmarks).toHaveLength(2);
    expect(state.bookmarks[0].name).toBe('Intro');
    expect(state.bookmarks[1].name).toBe('Outro');
  });

  it('removes bookmark by ID', () => {
    let state = createBookmarksState();
    state = addBookmark(state, { id: 'bm-1', name: 'Intro', timeMs: 300 });
    state = addBookmark(state, { id: 'bm-2', name: 'Outro', timeMs: 1200 });

    state = removeBookmark(state, 'bm-1');
    expect(state.bookmarks).toHaveLength(1);
    expect(state.bookmarks[0].id).toBe('bm-2');
  });

  it('navigates to next and previous bookmark relative to current playhead time', () => {
    let state = createBookmarksState();
    state = addBookmark(state, { id: 'bm-1', name: 'Verse', timeMs: 500 });
    state = addBookmark(state, { id: 'bm-2', name: 'Chorus', timeMs: 1000 });

    expect(getNextBookmarkTime(state, 200)).toBe(500);
    expect(getNextBookmarkTime(state, 600)).toBe(1000);
    expect(getNextBookmarkTime(state, 1100)).toBeNull();

    expect(getPreviousBookmarkTime(state, 1200)).toBe(1000);
    expect(getPreviousBookmarkTime(state, 800)).toBe(500);
    expect(getPreviousBookmarkTime(state, 400)).toBeNull();
  });
});
