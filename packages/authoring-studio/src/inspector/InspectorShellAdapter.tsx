'use client'

/**
 * InspectorShellAdapter — Sprint 7 Recovery (P1)
 *
 * Bridge that renders the new Inspector 2.0 `InspectorShell` (Agent 3 UI)
 * within the existing legacy `InspectorPanel` flow, WITHOUT switching the
 * BuilderShell or removing the legacy InspectorPanel/fields/renderers.
 *
 * It reuses the legacy `InspectorSync` (selection → descriptor → schema +
 * props) and `handlePropChange` → dispatch (Builder Command Bus) so that the
 * exact same command path is preserved:
 *
 *   Builder → InspectorSync → schema + props
 *       ↓
 *   InspectorShell → DynamicPropertyPanel
 *       ↓  (resolves widget via PropertyRegistry only)
 *   onPropChange → dispatch( UPDATE_PROPS ) → Builder State → RuntimePreviewChannel
 *
 * This adapter is a thin presentation bridge. It contains NO business logic,
 * NO local field definitions, and NO switch/case. Widget resolution is
 * delegated exclusively to `DynamicPropertyPanel` via the PropertyRegistry.
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 REVIEW
 */

import * as React from 'react';
import { InspectorSync } from '../../../../src/components/builder/inspector/InspectorSync';
import { InspectorRuntime } from '../../../builder-core/src/InspectorRuntime';
import { InspectorShell } from './InspectorShell';
import { EmptyInspectorState } from './EmptyInspectorState';
import type { InspectorCategory } from '../../../builder-core/src/InspectorRuntime';
import type { Breakpoint } from './registry/types';

export interface InspectorShellAdapterProps {
  /** Section id of the currently selected section. */
  sectionId: string | null;
  /** Handler invoked on property change — must dispatch UPDATE_PROPS. */
  onPropChange: (key: string, value: unknown) => void;
}

/**
 * Renders the new InspectorShell for the selected section, fed by the
 * InspectorSync (schema + props) and the Builder command dispatch.
 *
 * Renders EmptyInspectorState when no section is selected (PM28 architectural directive).
 */
export const InspectorShellAdapter: React.FC<InspectorShellAdapterProps> = ({
  sectionId,
  onPropChange,
}) => {
  if (!sectionId) {
    return <EmptyInspectorState />;
  }

  return (
    <InspectorSync>
      {(data) => {
        if (!data.descriptor || !data.sectionId) {
          return <EmptyInspectorState />;
        }

const schema = data.descriptor.schema ?? [];
        const props = InspectorRuntime.applyDefaults(schema, data.props);
        const readonlyCategories = InspectorRuntime.organizeByCategory(schema);
        // Spread to a mutable array — InspectorShell expects InspectorCategory[].
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
  );
};

export default InspectorShellAdapter;
