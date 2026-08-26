import React from 'react';

export interface PlaybackToolbarProps {
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  onSeekStart?: () => void;
}

export const PlaybackToolbar: React.FC<PlaybackToolbarProps> = ({
  isPlaying = false,
  onPlayToggle,
  onSeekStart,
}) => {
  return (
    <div data-testid="playback-toolbar" style={{ display: 'flex', gap: '8px', padding: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <button onClick={onSeekStart}>⏮ Seek 0</button>
      <button onClick={onPlayToggle}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
    </div>
  );
};
