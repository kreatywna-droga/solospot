import React from 'react';

export interface AnimationInspectorProps {
  timelineId?: string;
  easingCurve?: string;
}

export const AnimationInspector: React.FC<AnimationInspectorProps> = ({
  timelineId = 'tl-default',
  easingCurve = 'cubic-bezier(0.4, 0, 0.2, 1)',
}) => {
  return (
    <div data-testid="animation-inspector" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h4>Animation Panel (PM35 API)</h4>
      <div>
        <span style={{ opacity: 0.7 }}>Timeline: </span>
        <span>{timelineId}</span>
      </div>
      <div>
        <span style={{ opacity: 0.7 }}>Easing Curve: </span>
        <code style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 4px' }}>{easingCurve}</code>
      </div>
    </div>
  );
};
