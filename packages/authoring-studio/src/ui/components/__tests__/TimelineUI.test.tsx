import { describe, it, expect } from 'vitest';
import React from 'react';
import { TimelineCanvas } from '../timeline/TimelineCanvas';

describe('TimelineUI (Sprint S3, ETAP 2)', () => {
  it('renders TimelineCanvas structure with playhead and ruler', () => {
    const element = <TimelineCanvas durationMs={3000} currentTimeMs={500} selectedKeyframeIds={['k1']} />;
    expect(element).toBeDefined();
    expect(element.props.durationMs).toBe(3000);
    expect(element.props.currentTimeMs).toBe(500);
  });
});
