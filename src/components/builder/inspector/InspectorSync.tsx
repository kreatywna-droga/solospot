'use client'

/**
 * InspectorSync — C16.4 Inspector Panel Sync
 *
 * Reacts to selection changes and updates the Inspector panel
 * with the correct component schema and props.
 *
 * Architecture:
 *   SelectionChanged → InspectorSync → load schema → render fields
 *
 * InspectorSync:
 *   - Reads the selected section from the builder document
 *   - Looks up the ComponentDescriptor from the registry
 *   - Returns the schema + props for the PropsPanel to render
 *
 * This component is a thin controller that bridges selection
 * state with the inspector. It does NOT render the fields itself —
 * that's PropsPanel's job.
 */

import { useEffect, useState, useCallback } from 'react'
import { useBuilder, useSelectedSection } from '../state/BuilderProvider'
import type { ComponentDescriptor } from '../../../../packages/builder-core/src'

// ---------------------------------------------------------------------------
// InspectorSync
// ---------------------------------------------------------------------------

export interface InspectorData {
  /** The selected section node */
  sectionId: string | null
  /** The component descriptor from registry */
  descriptor: ComponentDescriptor | null
  /** Current props merged with defaults */
  props: Record<string, unknown>
  /** Whether the data is loading */
  loading: boolean
  /** Error message if any */
  error: string | null
}

interface InspectorSyncProps {
  /** Render prop — receives inspector data */
  children: (data: InspectorData) => React.ReactNode
}

export function InspectorSync({ children }: InspectorSyncProps) {
  const { ctx, canvas } = useBuilder()
  const selectedNode = useSelectedSection()
  const [data, setData] = useState<InspectorData>({
    sectionId: null,
    descriptor: null,
    props: {},
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!selectedNode || !canvas.selectedSectionId) {
      setData({
        sectionId: null,
        descriptor: null,
        props: {},
        loading: false,
        error: null,
      })
      return
    }

    setData(prev => ({ ...prev, loading: true, sectionId: canvas.selectedSectionId }))

    try {
      const descriptor = ctx.registry.get(selectedNode.type)

      if (!descriptor) {
        setData({
          sectionId: canvas.selectedSectionId,
          descriptor: null,
          props: selectedNode.props,
          loading: false,
          error: `Unknown component type: "${selectedNode.type}". Register it in ComponentRegistry.`,
        })
        return
      }

      setData({
        sectionId: canvas.selectedSectionId,
        descriptor,
        props: { ...descriptor.defaultProps, ...selectedNode.props },
        loading: false,
        error: null,
      })
    } catch (err) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error loading inspector data',
      }))
    }
  }, [selectedNode, canvas.selectedSectionId, ctx.registry])

  return <>{children(data)}</>
}

