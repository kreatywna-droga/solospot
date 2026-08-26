/**
 * TimelineFiltering.ts — PM40 Track Filtering & Visibility State (ETAP 7)
 *
 * DECISION-067: Bookmarks, Filtering oraz Foldery nie naruszają BuilderDocument SSOT.
 *
 * Pure data model for search filtering, track visibility, track locking, and solo mode.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface TrackFilterConfig {
  readonly searchQuery: string;
  readonly propertyFilter?: string | null;
  readonly hiddenTrackIds: ReadonlyArray<string>;
  readonly lockedTrackIds: ReadonlyArray<string>;
  readonly soloTrackIds: ReadonlyArray<string>;
}

export const INITIAL_TRACK_FILTER_CONFIG: TrackFilterConfig = {
  searchQuery: '',
  propertyFilter: null,
  hiddenTrackIds: [],
  lockedTrackIds: [],
  soloTrackIds: [],
};

export function createTrackFilterConfig(
  partial: Partial<TrackFilterConfig> = {}
): TrackFilterConfig {
  return {
    ...INITIAL_TRACK_FILTER_CONFIG,
    ...partial,
  };
}

/**
 * Toggles track hidden status immutably.
 */
export function toggleTrackVisibility(
  config: TrackFilterConfig,
  trackId: string
): TrackFilterConfig {
  const isHidden = config.hiddenTrackIds.includes(trackId);
  const hiddenTrackIds = isHidden
    ? config.hiddenTrackIds.filter((id) => id !== trackId)
    : [...config.hiddenTrackIds, trackId];

  return {
    ...config,
    hiddenTrackIds,
  };
}

/**
 * Toggles track locked status immutably.
 */
export function toggleTrackLock(
  config: TrackFilterConfig,
  trackId: string
): TrackFilterConfig {
  const isLocked = config.lockedTrackIds.includes(trackId);
  const lockedTrackIds = isLocked
    ? config.lockedTrackIds.filter((id) => id !== trackId)
    : [...config.lockedTrackIds, trackId];

  return {
    ...config,
    lockedTrackIds,
  };
}

/**
 * Toggles track solo status immutably.
 */
export function toggleTrackSolo(
  config: TrackFilterConfig,
  trackId: string
): TrackFilterConfig {
  const isSolo = config.soloTrackIds.includes(trackId);
  const soloTrackIds = isSolo
    ? config.soloTrackIds.filter((id) => id !== trackId)
    : [...config.soloTrackIds, trackId];

  return {
    ...config,
    soloTrackIds,
  };
}

/**
 * Evaluates whether a track passes active search, visibility, property, and solo filters.
 */
export function isTrackVisible(
  trackId: string,
  propertyKey: string,
  config: TrackFilterConfig
): boolean {
  // Check hidden list
  if (config.hiddenTrackIds.includes(trackId)) {
    return false;
  }

  // Check solo list (if any track is soloed, non-solo tracks are hidden)
  if (config.soloTrackIds.length > 0 && !config.soloTrackIds.includes(trackId)) {
    return false;
  }

  // Check search query
  if (config.searchQuery.trim().length > 0) {
    const query = config.searchQuery.toLowerCase();
    const matchProp = propertyKey.toLowerCase().includes(query);
    const matchId = trackId.toLowerCase().includes(query);
    if (!matchProp && !matchId) return false;
  }

  // Check property filter
  if (config.propertyFilter && config.propertyFilter !== propertyKey) {
    return false;
  }

  return true;
}
