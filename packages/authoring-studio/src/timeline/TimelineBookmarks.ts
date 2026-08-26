/**
 * TimelineBookmarks.ts — PM40 Timeline Bookmarks Model (ETAP 5)
 *
 * DECISION-067: Bookmarks, Filtering oraz Foldery nie naruszają BuilderDocument SSOT.
 *
 * Pure data model for named timeline bookmarks, colors, and bookmark navigation.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface TimelineBookmark {
  readonly id: string;
  readonly name: string;
  readonly timeMs: number;
  readonly color?: string;
  readonly description?: string;
}

export interface BookmarksState {
  readonly bookmarks: ReadonlyArray<TimelineBookmark>;
}

export const INITIAL_BOOKMARKS_STATE: BookmarksState = {
  bookmarks: [],
};

export function createBookmarksState(
  partial: Partial<BookmarksState> = {}
): BookmarksState {
  return {
    ...INITIAL_BOOKMARKS_STATE,
    ...partial,
  };
}

/**
 * Adds or updates a bookmark immutably.
 */
export function addBookmark(
  state: BookmarksState,
  bookmark: TimelineBookmark
): BookmarksState {
  const filtered = state.bookmarks.filter((b) => b.id !== bookmark.id);
  const updated = [...filtered, bookmark].sort((a, b) => a.timeMs - b.timeMs);

  return {
    bookmarks: updated,
  };
}

/**
 * Removes a bookmark by ID immutably.
 */
export function removeBookmark(
  state: BookmarksState,
  bookmarkId: string
): BookmarksState {
  return {
    bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
  };
}

/**
 * Navigates to the next bookmark relative to current playhead time.
 */
export function getNextBookmarkTime(
  state: BookmarksState,
  currentTimeMs: number
): number | null {
  const next = state.bookmarks.find((b) => b.timeMs > currentTimeMs);
  return next ? next.timeMs : null;
}

/**
 * Navigates to the previous bookmark relative to current playhead time.
 */
export function getPreviousBookmarkTime(
  state: BookmarksState,
  currentTimeMs: number
): number | null {
  const prevs = state.bookmarks.filter((b) => b.timeMs < currentTimeMs);
  if (prevs.length === 0) return null;
  return prevs[prevs.length - 1].timeMs;
}
