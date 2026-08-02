import * as React from 'react';
import { InspectorAccordion } from './InspectorAccordion';
import { DynamicPropertyPanel } from './panels/DynamicPropertyPanel';
import { InspectorCategory } from '@web-factor/builder-core/src/InspectorRuntime';
import { BuilderContext } from '@web-factor/builder-core/src/BuilderContext';

export interface InspectorShellProps {
  sectionId: string;
  sectionName: string;
  sectionType: string;
  categories: InspectorCategory[];
  currentProps: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
}

export const InspectorShell: React.FC<InspectorShellProps> = ({
  sectionId,
  sectionName,
  sectionType,
  categories,
  currentProps,
  onPropChange
}) => {
  const [activeBreakpoint, setActiveBreakpoint] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <div className="inspector-shell">
      <div className="inspector-header">
        <div className="inspector-title">
          <h3>{sectionName}</h3>
          <span className="section-type">Type: {sectionType}</span>
        </div>
        
        <div className="breakpoint-switcher">
          <button 
            className={activeBreakpoint === 'desktop' ? 'active' : ''} 
            onClick={() => setActiveBreakpoint('desktop')}
          >
            Desktop
          </button>
          <button 
            className={activeBreakpoint === 'tablet' ? 'active' : ''} 
            onClick={() => setActiveBreakpoint('tablet')}
          >
            Tablet
          </button>
          <button 
            className={activeBreakpoint === 'mobile' ? 'active' : ''} 
            onClick={() => setActiveBreakpoint('mobile')}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="inspector-body">
        {categories.map(category => (
          <InspectorAccordion key={category.id} title={category.label}>
            {category.groups.map(group => (
              <DynamicPropertyPanel 
                key={group.id} 
                group={group} 
                currentProps={currentProps}
                onPropChange={onPropChange}
                breakpoint={activeBreakpoint}
              />
            ))}
          </InspectorAccordion>
        ))}
      </div>
    </div>
  );
};
