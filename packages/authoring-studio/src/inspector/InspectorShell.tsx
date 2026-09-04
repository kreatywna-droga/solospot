import * as React from 'react';
import { InspectorAccordion } from './InspectorAccordion';
import { DynamicPropertyPanel } from './panels/DynamicPropertyPanel';
import type { InspectorCategory } from '../../../builder-core/src/InspectorRuntime';

export interface InspectorShellProps {
  sectionId: string;
  sectionName: string;
  sectionType: string;
  categories: InspectorCategory[];
  currentProps: Record<string, unknown>;
  onPropChange: (key: string, value: unknown) => void;
}

/**
 * InspectorShell — Sprint 7.1 UI
 *
 * Breakpoint switching removed — viewport is controlled from the top toolbar only.
 * Uses 'desktop' as the fixed breakpoint for this panel.
 */
export const InspectorShell: React.FC<InspectorShellProps> = ({
  sectionId,
  sectionName,
  sectionType,
  categories,
  currentProps,
  onPropChange
}) => {
  return (
    <div className="inspector-shell flex flex-col h-full">
      <div className="inspector-header px-4 py-3 border-b border-white/10 flex-shrink-0">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">{sectionName}</h3>
        <span className="section-type text-[11px] text-slate-600 font-mono truncate block">
          {sectionType}
        </span>
      </div>

      <div className="inspector-body flex-1 overflow-y-auto">
        {categories.map(category => (
          <InspectorAccordion key={category.id} title={category.label}>
            {category.groups.map(group => (
              <DynamicPropertyPanel
                key={group.id}
                group={group}
                currentProps={currentProps}
                onPropChange={onPropChange}
                breakpoint="desktop"
              />
            ))}
          </InspectorAccordion>
        ))}
      </div>
    </div>
  );
};
