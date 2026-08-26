import * as React from 'react';
import { InspectorAccordion } from './InspectorAccordion';
import { DynamicPropertyPanel } from './panels/DynamicPropertyPanel';
import { BreakpointSwitcher } from './breakpoint/BreakpointSwitcher';
import { BreakpointIndicator } from './breakpoint/BreakpointIndicator';
import type { InspectorCategory } from '../../../builder-core/src/InspectorRuntime';
import type { Breakpoint } from './registry/types';

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
 * Breakpoint UI enhanced with BreakpointSwitcher + BreakpointIndicator.
 * UI-only changes. No responsive inheritance logic (Agent 1 scope).
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 */
export const InspectorShell: React.FC<InspectorShellProps> = ({
  sectionId,
  sectionName,
  sectionType,
  categories,
  currentProps,
  onPropChange
}) => {
  const [activeBreakpoint, setActiveBreakpoint] = React.useState<Breakpoint>('desktop');

  return (
    <div className="inspector-shell flex flex-col h-full">
      <div className="inspector-header px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="inspector-title min-w-0">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">{sectionName}</h3>
          <span className="section-type text-[11px] text-slate-600 font-mono truncate block">
            Type: {sectionType}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <BreakpointIndicator breakpoint={activeBreakpoint} />
          <BreakpointSwitcher
            active={activeBreakpoint}
            onChange={setActiveBreakpoint}
          />
        </div>
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
                breakpoint={activeBreakpoint}
              />
            ))}
          </InspectorAccordion>
        ))}
      </div>
    </div>
  );
};

