import * as React from 'react';
import { DynamicPropertyPanel } from './DynamicPropertyPanel';
import { InspectorGroup } from '@web-factor/builder-core/src/InspectorRuntime';

export const TypographyPanel: React.FC<{
  group: InspectorGroup;
  currentProps: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
}> = (props) => {
  return (
    <div className="typography-panel">
      {/* Custom typography logic could go here */}
      <DynamicPropertyPanel {...props} />
    </div>
  );
};
