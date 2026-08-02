import * as React from 'react';
import { DynamicPropertyPanel } from './DynamicPropertyPanel';
import { InspectorGroup } from '@web-factor/builder-core/src/InspectorRuntime';

export const LayoutPanel: React.FC<{
  group: InspectorGroup;
  currentProps: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
}> = (props) => {
  return (
    <div className="layout-panel">
      {/* You can add custom layout specific rendering here, else fallback to dynamic rendering */}
      <DynamicPropertyPanel {...props} />
    </div>
  );
};
