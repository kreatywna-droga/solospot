'use client';

/**
 * PhaseThreeInspector — Phase 3 Master Inspector
 *
 * Multi-tab inspector that combines:
 *   - Design / Layout / Spacing / Typography / Advanced → NodeStyles via SET_NODE_STYLES
 *   - Content → ComponentRegistry schema-driven props via InspectorShell
 *
 * Architecture (DECISION-043, DECISION-044, DECISION-045):
 *   - Reads selected node styles from BuilderDocument (SSOT) via useSelectedSection()
 *   - Dispatches SET_NODE_STYLES for style changes (passed in as onStyleChange)
 *   - Dispatches UPDATE_PROPS for content/prop changes (passed in as onPropChange)
 *   - Inspector NEVER invokes PlaybackController
 *   - Inspector edits configuration ONLY
 *
 * @phase Phase 3 — Inspector + Layout Engine
 */

import * as React from 'react';
import { FileText } from 'lucide-react';
import { useBuilder, useSelectedSection } from '../state/BuilderProvider';
import { DesignInspector } from '../../../../packages/authoring-studio/src/inspector/DesignInspector';
import { InspectorSync } from './InspectorSync';
import { InspectorShell } from '../../../../packages/authoring-studio/src/inspector/InspectorShell';
import { EmptyInspectorState } from '../../../../packages/authoring-studio/src/inspector/EmptyInspectorState';
import { InspectorRuntime } from '../../../../packages/builder-core/src/InspectorRuntime';
import type { InspectorCategory } from '../../../../packages/builder-core/src/InspectorRuntime';
import type { NodeStyles } from '../../../../packages/builder-core/src/BuilderDocument';

// ---------------------------------------------------------------------------
// PhaseThreeInspector
// ---------------------------------------------------------------------------

export interface PhaseThreeInspectorProps {
  sectionId: string | null;
  onPropChange: (key: string, value: unknown) => void;
  onStyleChange: (patch: Partial<NodeStyles>) => void;
}

type MasterTab = 'design' | 'content';

export const PhaseThreeInspector: React.FC<PhaseThreeInspectorProps> = ({
  sectionId,
  onPropChange,
  onStyleChange,
}) => {
  const [masterTab, setMasterTab] = React.useState<MasterTab>('design');
  const selectedNode = useSelectedSection();

  if (!sectionId || !selectedNode) {
    return <EmptyInspectorState />;
  }

  const currentStyles: NodeStyles = selectedNode.styles ?? {};
  const nodeLabel = selectedNode.label ?? selectedNode.type;
  const nodeType = selectedNode.type;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Master Tab Bar: Design | Content */}
      <div className="flex border-b border-white/10 flex-shrink-0 bg-[#07070f]">
        <button
          onClick={() => setMasterTab('design')}
          className={`flex-1 py-2.5 text-[11px] font-semibold tracking-wide border-b-2 transition-colors ${
            masterTab === 'design'
              ? 'text-white border-violet-500'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Design
        </button>
        <button
          onClick={() => setMasterTab('content')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold tracking-wide border-b-2 transition-colors ${
            masterTab === 'content'
              ? 'text-white border-violet-500'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Content
        </button>
      </div>

      {/* Design tab — DesignInspector with 5 sub-tabs */}
      {masterTab === 'design' && (
        <div className="flex-1 overflow-hidden">
          <DesignInspector
            styles={currentStyles}
            onStyleChange={onStyleChange}
            nodeLabel={nodeLabel}
            nodeType={nodeType}
          />
        </div>
      )}

      {/* Content tab — schema-driven props via InspectorSync */}
      {masterTab === 'content' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <InspectorSync>
            {(data) => {
              if (!data.descriptor || !data.sectionId) {
                return (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-[11px] text-slate-600 text-center">
                      No content schema for this element.
                    </p>
                  </div>
                );
              }

              const schema = data.descriptor.schema ?? [];
              const props = InspectorRuntime.applyDefaults(schema, data.props);
              const readonlyCategories = InspectorRuntime.organizeByCategory(schema);
              const categories: InspectorCategory[] = [...readonlyCategories];

              return (
                <InspectorShell
                  sectionId={data.sectionId}
                  sectionName={data.descriptor.label ?? data.sectionId}
                  sectionType={data.descriptor.type}
                  categories={categories}
                  currentProps={props}
                  onPropChange={onPropChange}
                />
              );
            }}
          </InspectorSync>
        </div>
      )}
    </div>
  );
};

export default PhaseThreeInspector;
