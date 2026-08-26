import { describe, it, expect } from 'vitest';
import {
  createTrackFilterConfig,
  toggleTrackVisibility,
  toggleTrackLock,
  toggleTrackSolo,
  isTrackVisible,
} from '../TimelineFiltering';

describe('TimelineFiltering (PM40, ETAP 7 & DECISION-067)', () => {
  it('toggles track visibility, lock, and solo states immutably (DECISION-067)', () => {
    let config = createTrackFilterConfig();

    config = toggleTrackVisibility(config, 'tr-opacity');
    expect(config.hiddenTrackIds).toContain('tr-opacity');

    config = toggleTrackLock(config, 'tr-opacity');
    expect(config.lockedTrackIds).toContain('tr-opacity');

    config = toggleTrackSolo(config, 'tr-scale');
    expect(config.soloTrackIds).toContain('tr-scale');
  });

  it('evaluates track visibility under active search and solo filters', () => {
    let config = createTrackFilterConfig({ searchQuery: 'opac' });

    // Matching property 'opacity' passes search
    expect(isTrackVisible('tr-1', 'opacity', config)).toBe(true);
    // Non-matching property 'scale' fails search
    expect(isTrackVisible('tr-2', 'scale', config)).toBe(false);

    // Solo mode active on tr-1
    config = createTrackFilterConfig({ soloTrackIds: ['tr-1'] });
    expect(isTrackVisible('tr-1', 'opacity', config)).toBe(true);
    expect(isTrackVisible('tr-2', 'scale', config)).toBe(false);

    // Hidden track fails visibility regardless of solo
    config = toggleTrackVisibility(config, 'tr-1');
    expect(isTrackVisible('tr-1', 'opacity', config)).toBe(false);
  });
});
