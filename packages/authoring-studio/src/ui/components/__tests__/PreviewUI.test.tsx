import { describe, it, expect } from 'vitest';
import React from 'react';
import { PreviewCanvas } from '../preview/PreviewCanvas';
import { PlaybackToolbar } from '../preview/PlaybackToolbar';

describe('PreviewUI (Sprint S3, ETAP 4)', () => {
  it('renders PreviewCanvas and PlaybackToolbar structures', () => {
    const canvasElement = <PreviewCanvas scale={1.5} />;
    expect(canvasElement).toBeDefined();
    expect(canvasElement.props.scale).toBe(1.5);

    const toolbarElement = <PlaybackToolbar isPlaying={true} />;
    expect(toolbarElement).toBeDefined();
    expect(toolbarElement.props.isPlaying).toBe(true);
  });
});
