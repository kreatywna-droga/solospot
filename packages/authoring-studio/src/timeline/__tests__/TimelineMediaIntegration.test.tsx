import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { TimelineMediaTracks } from '../../ui/components/timeline/TimelineMediaTracks';
import { MediaPreviewAdapter } from '../../rendering/MediaPreviewAdapter';
import { AudioTimelineEngine } from '../AudioTimelineEngine';
import { VideoTimelineEngine } from '../VideoTimelineEngine';

describe('TimelineMediaIntegration & Preview Adapter (S16 ETAP 6 & 7)', () => {
  const mockAudio = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Song.mp3', 0, 3000);
  const mockVideo = VideoTimelineEngine.createVideoClip('c2', 'v1', 'Intro.mp4', 1000, 4000);

  const mockTracks = [
    { id: 't1', name: 'Audio Track', mediaType: 'audio' as const, clips: [mockAudio], muted: false, solo: false, locked: false, visible: true, heightPx: 48 },
    { id: 't2', name: 'Video Track', mediaType: 'video' as const, clips: [mockVideo], muted: false, solo: false, locked: false, visible: true, heightPx: 48 },
  ];

  it('adapts media frame to existing rendering engine playback without secondary engine', () => {
    const frame = MediaPreviewAdapter.adaptMediaFrame([mockAudio, mockVideo], 2000);

    expect(frame.playheadTimeMs).toBe(2000);
    expect(frame.activeAudioStreams.length).toBe(1);
    expect(frame.activeVideoFrames.length).toBe(1);
  });

  it('renders TimelineMediaTracks UI with waveform overlays and trim handles', () => {
    render(<TimelineMediaTracks tracks={mockTracks} playheadTimeMs={2000} />);

    expect(screen.getByTestId('timeline-media-tracks')).toBeDefined();
    expect(screen.getByTestId('track-t1')).toBeDefined();
    expect(screen.getByTestId('clip-c1')).toBeDefined();
    expect(screen.getByTestId('trim-left-c1')).toBeDefined();
  });
});
