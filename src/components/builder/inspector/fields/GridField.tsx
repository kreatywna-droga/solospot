'use client'

/**
 * GridField — C16.38 Grid Property Editor (Sprint 5B.1)
 *
 * Custom field renderers for CSS Grid properties.
 * Registered as types 'grid-tracks', 'grid-track', 'grid-span' in PropertyRegistry.
 *
 * Features:
 *   - GridTemplateColumns / GridTemplateRows — visual track list editor
 *   - GridAutoColumns / GridAutoRows — single track editor
 *   - GridAutoFlow — select (row, column, row-dense, column-dense)
 *   - GridColumn / GridRow — span value editor (line, span modes)
 *   - GridArea — text input for named area
 *   - Grid alignment — select (start, end, center, stretch)
 *   - Gap — number input (shared with Flex via existing schema)
 *
 * Architecture:
 *   GridField → onChange(key, structured value)
 *     → dispatch(UPDATE_PROPS) via InspectorPanel
 *
 * DESIGN DECISIONS:
 *   - No business logic (validation, CSS mapping) — all in GridTypes.ts
 *   - Operates on structural types (TrackBreadcrumb, GridSpanValue), not CSS strings
 *   - Uses existing dispatch mechanism (UPDATE_PROPS)
 *   - Zero changes to PropertyField.tsx (registry-based dispatch)
 *   - Responsive-ready: all values are JSON-serializable objects
 */

import { useCallback, useMemo } from 'react'
import { Columns, Rows, Grid3x3, GripHorizontal } from 'lucide-react'
import type { FieldRendererProps } from '../../../../../packages/builder-core/src/PropertyRegistry'
import type {
  TrackBreadcrumb,
  TrackList,
  GridUnit,
  GridAutoFlow,
  GridSpanValue,
  GridSelfAlignment,
} from '../../../../../packages/builder-core/src/GridTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRACK_KEYWORDS = ['auto', 'min-content', 'max-content'] as const

const GRID_UNITS: Array<{ label: string; value: GridUnit }> = [
  { label: 'fr', value: 'fr' },
  { label: 'px', value: 'px' },
  { label: '%', value: '%' },
  { label: 'vw', value: 'vw' },
  { label: 'vh', value: 'vh' },
  { label: 'rem', value: 'rem' },
  { label: 'em', value: 'em' },
  { label: 'auto', value: 'auto' },
  { label: 'min-content', value: 'min-content' },
  { label: 'max-content', value: 'max-content' },
]

const AUTO_FLOW_OPTIONS: Array<{ label: string; value: GridAutoFlow }> = [
  { label: 'Row', value: 'row' },
  { label: 'Column', value: 'column' },
  { label: 'Row Dense', value: 'row-dense' },
  { label: 'Column Dense', value: 'column-dense' },
]

const ITEM_ALIGNMENT_OPTIONS: Array<{ label: string; value: GridSelfAlignment }> = [
  { label: 'Start', value: 'start' },
  { label: 'End', value: 'end' },
  { label: 'Center', value: 'center' },
  { label: 'Stretch', value: 'stretch' },
]

const CONTENT_ALIGNMENT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Start', value: 'start' },
  { label: 'End', value: 'end' },
  { label: 'Center', value: 'center' },
  { label: 'Stretch', value: 'stretch' },
  { label: 'Space Around', value: 'space-around' },
  { label: 'Space Between', value: 'space-between' },
  { label: 'Space Evenly', value: 'space-evenly' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a default fixed track with given value and unit.
 */
function createFixedTrack(value: number, unit: GridUnit): TrackBreadcrumb {
  return { type: 'fixed', size: { value, unit } }
}

/**
 * Create a default 1fr track.
 */
function createDefaultTrack(): TrackBreadcrumb {
  return createFixedTrack(1, 'fr')
}

/**
 * Render a labeled select dropdown.
 */
function renderSelect(
  label: string,
  icon: React.ReactNode,
  options: Array<{ label: string; value: string }>,
  currentValue: string,
  onChange: (value: string) => void
) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>
      <select
        value={currentValue}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2
                   text-sm text-white font-mono
                   focus:outline-none focus:border-violet-500/50 transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GridTrackListEditor — for gridTemplateColumns / gridTemplateRows
// ---------------------------------------------------------------------------

interface GridTrackListEditorProps {
  value: TrackList | undefined
  onChange: (value: TrackList | undefined) => void
  label: string
  icon: React.ReactNode
  description?: string
}

function GridTrackListEditor({ value, onChange, label, icon, description }: GridTrackListEditorProps) {
  const tracks = value ?? []
  const isEmpty = tracks.length === 0

  const addTrack = useCallback(() => {
    onChange([...tracks, createDefaultTrack()])
  }, [tracks, onChange])

  const removeTrack = useCallback((index: number) => {
    const next = tracks.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : undefined)
  }, [tracks, onChange])

  const updateTrack = useCallback((index: number, track: TrackBreadcrumb) => {
    const next = [...tracks]
    next[index] = track
    onChange(next)
  }, [tracks, onChange])

  const clearTracks = useCallback(() => {
    onChange(undefined)
  }, [onChange])

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>

      {isEmpty && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-600 italic">Auto — no tracks defined</span>
          <button
            onClick={addTrack}
            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Add track
          </button>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {tracks.map((track, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600 font-mono w-4">{i + 1}.</span>
              <TrackBreadcrumbEditor
                value={track}
                onChange={t => updateTrack(i, t)}
              />
              <button
                onClick={() => removeTrack(i)}
                className="text-slate-600 hover:text-red-400 transition-colors px-1"
                title="Remove track"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={addTrack}
            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Add track
          </button>
          <button
            onClick={clearTracks}
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {description && (
        <p className="text-[10px] text-slate-600 mt-1">{description}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TrackBreadcrumbEditor — single track editor (fixed, keyword, minmax, repeat)
// ---------------------------------------------------------------------------

interface TrackBreadcrumbEditorProps {
  value: TrackBreadcrumb
  onChange: (value: TrackBreadcrumb) => void
}

function TrackBreadcrumbEditor({ value, onChange }: TrackBreadcrumbEditorProps) {
  const trackType = value.type

  const setType = useCallback((type: string) => {
    switch (type) {
      case 'fixed':
        onChange(createDefaultTrack())
        break
      case 'keyword':
        onChange({ type: 'keyword', value: 'auto' })
        break
      case 'minmax':
        onChange({
          type: 'minmax',
          min: createDefaultTrack(),
          max: createDefaultTrack(),
        })
        break
      case 'repeat':
        onChange({
          type: 'repeat',
          count: 3,
          track: createDefaultTrack(),
        })
        break
    }
  }, [onChange])

  // Fixed track editor
  if (trackType === 'fixed') {
    return (
      <div className="flex items-center gap-1 flex-1">
        <select
          value={trackType}
          onChange={e => setType(e.target.value)}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono focus:outline-none focus:border-violet-500/50"
        >
          <option value="fixed">Fixed</option>
          <option value="keyword">Keyword</option>
          <option value="minmax">MinMax</option>
          <option value="repeat">Repeat</option>
        </select>
        <input
          type="number"
          value={value.size.value}
          min={0}
          max={9999}
          step={1}
          onChange={e => onChange({
            ...value,
            size: { ...value.size, value: e.target.value === '' ? 0 : parseFloat(e.target.value) },
          })}
          className="w-14 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono text-right focus:outline-none focus:border-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <select
          value={value.size.unit}
          onChange={e => onChange({
            ...value,
            size: { ...value.size, unit: e.target.value as GridUnit },
          })}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono focus:outline-none focus:border-violet-500/50"
        >
          {GRID_UNITS.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>
    )
  }

  // Keyword track editor
  if (trackType === 'keyword') {
    return (
      <div className="flex items-center gap-1 flex-1">
        <select
          value={trackType}
          onChange={e => setType(e.target.value)}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono focus:outline-none focus:border-violet-500/50"
        >
          <option value="fixed">Fixed</option>
          <option value="keyword">Keyword</option>
          <option value="minmax">MinMax</option>
          <option value="repeat">Repeat</option>
        </select>
        <select
          value={value.value}
          onChange={e => onChange({ type: 'keyword', value: e.target.value as any })}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono flex-1 focus:outline-none focus:border-violet-500/50"
        >
          {TRACK_KEYWORDS.map(kw => (
            <option key={kw} value={kw}>{kw}</option>
          ))}
        </select>
      </div>
    )
  }

  // Minmax track editor
  if (trackType === 'minmax') {
    return (
      <div className="flex items-center gap-1 flex-1">
        <select
          value={trackType}
          onChange={e => setType(e.target.value)}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono focus:outline-none focus:border-violet-500/50"
        >
          <option value="fixed">Fixed</option>
          <option value="keyword">Keyword</option>
          <option value="minmax">MinMax</option>
          <option value="repeat">Repeat</option>
        </select>
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[9px] text-slate-600 font-mono">min</span>
          <TrackBreadcrumbEditor value={value.min} onChange={min => onChange({ ...value, min })} />
          <span className="text-[9px] text-slate-600 font-mono">max</span>
          <TrackBreadcrumbEditor value={value.max} onChange={max => onChange({ ...value, max })} />
          <span className="text-[9px] text-slate-600 font-mono">)</span>
        </div>
      </div>
    )
  }

  // Repeat track editor
  if (trackType === 'repeat') {
    return (
      <div className="flex items-center gap-1 flex-1">
        <select
          value={trackType}
          onChange={e => setType(e.target.value)}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono focus:outline-none focus:border-violet-500/50"
        >
          <option value="fixed">Fixed</option>
          <option value="keyword">Keyword</option>
          <option value="minmax">MinMax</option>
          <option value="repeat">Repeat</option>
        </select>
        <span className="text-[9px] text-slate-600 font-mono">repeat(</span>
        <input
          type="number"
          value={value.count}
          min={1}
          max={100}
          step={1}
          onChange={e => onChange({
            ...value,
            count: parseInt(e.target.value) || 1,
          })}
          className="w-8 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1 py-1 font-mono text-center focus:outline-none focus:border-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[9px] text-slate-600 font-mono">,</span>
        <TrackBreadcrumbEditor value={value.track} onChange={track => onChange({ ...value, track })} />
        <span className="text-[9px] text-slate-600 font-mono">)</span>
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// GridSpanEditor — for gridColumn / gridRow
// ---------------------------------------------------------------------------

interface GridSpanEditorProps {
  value: GridSpanValue | undefined
  onChange: (value: GridSpanValue | undefined) => void
  label: string
  icon: React.ReactNode
}

function GridSpanEditor({ value, onChange, label, icon }: GridSpanEditorProps) {
  const span = value

  const setMode = useCallback((mode: string) => {
    switch (mode) {
      case 'line':
        onChange({ type: 'line', start: 1, end: 3 })
        break
      case 'span':
        onChange({ type: 'span', start: 1, span: 2 })
        break
      case 'span-only':
        onChange({ type: 'span-only', span: 2 })
        break
      case 'none':
        onChange(undefined)
        break
    }
  }, [onChange])

  const clearSpan = useCallback(() => {
    onChange(undefined)
  }, [onChange])

  if (!span) {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {icon}
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 italic">Auto</span>
          <button
            onClick={() => setMode('line')}
            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Set
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>

      <div className="flex items-center gap-1.5">
        <select
          value={span.type}
          onChange={e => setMode(e.target.value)}
          className="bg-[#0a0a14] border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono focus:outline-none focus:border-violet-500/50"
        >
          <option value="line">Line</option>
          <option value="span">Span</option>
          <option value="span-only">Span Only</option>
        </select>

        {span.type === 'line' && (
          <>
            <input
              type="number"
              value={span.start}
              min={-100}
              max={100}
              onChange={e => onChange({ type: 'line', start: parseInt(e.target.value) || 1, end: span.end })}
              className="w-10 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono text-center focus:outline-none focus:border-violet-500/50 [appearance:textfield]"
            />
            {span.end !== undefined && (
              <>
                <span className="text-[9px] text-slate-600 font-mono">/</span>
                <input
                  type="number"
                  value={span.end}
                  min={-100}
                  max={100}
                  onChange={e => onChange({ type: 'line', start: span.start, end: parseInt(e.target.value) || undefined })}
                  className="w-10 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono text-center focus:outline-none focus:border-violet-500/50 [appearance:textfield]"
                />
              </>
            )}
            {span.end === undefined && (
              <button
                onClick={() => onChange({ type: 'line', start: span.start, end: 3 })}
                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                + end
              </button>
            )}
          </>
        )}

        {span.type === 'span' && (
          <>
            <input
              type="number"
              value={span.start}
              min={-100}
              max={100}
              onChange={e => onChange({ type: 'span', start: parseInt(e.target.value) || 1, span: span.span })}
              className="w-10 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono text-center focus:outline-none focus:border-violet-500/50 [appearance:textfield]"
            />
            <span className="text-[9px] text-slate-600 font-mono">/ span</span>
            <input
              type="number"
              value={span.span}
              min={1}
              max={100}
              onChange={e => onChange({ type: 'span', start: span.start, span: parseInt(e.target.value) || 1 })}
              className="w-10 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono text-center focus:outline-none focus:border-violet-500/50 [appearance:textfield]"
            />
          </>
        )}

        {span.type === 'span-only' && (
          <>
            <span className="text-[9px] text-slate-600 font-mono">span</span>
            <input
              type="number"
              value={span.span}
              min={1}
              max={100}
              onChange={e => onChange({ type: 'span-only', span: parseInt(e.target.value) || 1 })}
              className="w-10 bg-white/5 border border-white/10 rounded text-[10px] text-white px-1.5 py-1 font-mono text-center focus:outline-none focus:border-violet-500/50 [appearance:textfield]"
            />
          </>
        )}

        <button
          onClick={clearSpan}
          className="text-slate-600 hover:text-red-400 transition-colors px-1"
          title="Clear"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GridField — main dispatcher component
// ---------------------------------------------------------------------------

export function GridField({ schema, value, onChange, error }: FieldRendererProps) {
  const key = schema.key.toLowerCase()

  // Determine which editor to render based on schema key
  const controlType = useMemo(() => {
    if (key === 'gridtemplatecolumns' || key === 'gridtemplaterows') return 'grid-tracks'
    if (key === 'gridautocolumns' || key === 'gridautorows') return 'grid-track'
    if (key === 'gridcolumn' || key === 'gridrow') return 'grid-span'
    if (key === 'gridarea') return 'grid-area'
    if (key === 'gridautoflow') return 'auto-flow'
    if (key === 'justifycontent' || key === 'aligncontent') return 'content-alignment'
    if (key === 'justifyitems' || key === 'alignitems' || key === 'justifyself' || key === 'alignself') return 'item-alignment'
    if (key === 'gap' || key === 'rowgap' || key === 'columngap') return 'gap'
    return 'unknown'
  }, [key])

  // --- Grid Tracks (columns/rows) ---
  if (controlType === 'grid-tracks') {
    const isColumns = key === 'gridtemplatecolumns'
    return (
      <div>
        <GridTrackListEditor
          value={value as TrackList | undefined}
          onChange={v => onChange(schema.key, v)}
          label={schema.label}
          icon={isColumns ? <Columns className="w-3 h-3" /> : <Rows className="w-3 h-3" />}
          description={isColumns ? 'Define column tracks' : 'Define row tracks'}
        />
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // --- Single Track (auto columns/rows) ---
  if (controlType === 'grid-track') {
    const track = (value as TrackBreadcrumb) ?? { type: 'fixed', size: { value: 1, unit: 'fr' } }
    const isColumns = key === 'gridautocolumns'
    return (
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {isColumns ? <Columns className="w-3 h-3" /> : <Rows className="w-3 h-3" />}
          {schema.label}
        </label>
        <TrackBreadcrumbEditor
          value={track}
          onChange={v => onChange(schema.key, v)}
        />
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // --- Grid Span (column/row placement) ---
  if (controlType === 'grid-span') {
    const isColumns = key === 'gridcolumn'
    return (
      <GridSpanEditor
        value={value as GridSpanValue | undefined}
        onChange={v => onChange(schema.key, v)}
        label={schema.label}
        icon={isColumns ? <Columns className="w-3 h-3" /> : <Rows className="w-3 h-3" />}
      />
    )
  }

  // --- Grid Area (text input) ---
  if (controlType === 'grid-area') {
    const strVal = typeof value === 'string' ? value : ''
    return (
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <Grid3x3 className="w-3 h-3" />
          {schema.label}
        </label>
        <input
          type="text"
          value={strVal}
          onChange={e => onChange(schema.key, e.target.value || undefined)}
          placeholder="e.g. header, main, sidebar"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
        <p className="text-[10px] text-slate-600 mt-0.5">Named grid area for item placement</p>
      </div>
    )
  }

  // --- Auto Flow (select) ---
  if (controlType === 'auto-flow') {
    const strVal = typeof value === 'string' ? value : 'row'
    return (
      <div>
        {renderSelect(
          schema.label,
          <Grid3x3 className="w-3 h-3" />,
          AUTO_FLOW_OPTIONS,
          strVal,
          v => onChange(schema.key, v)
        )}
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // --- Content Alignment (justify-content, align-content) ---
  if (controlType === 'content-alignment') {
    const strVal = typeof value === 'string' ? value : 'start'
    return (
      <div>
        {renderSelect(
          schema.label,
          <GripHorizontal className="w-3 h-3" />,
          CONTENT_ALIGNMENT_OPTIONS,
          strVal,
          v => onChange(schema.key, v)
        )}
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // --- Item Alignment (justify-items, align-items, justify-self, align-self) ---
  if (controlType === 'item-alignment') {
    const strVal = typeof value === 'string' ? value : 'stretch'
    return (
      <div>
        {renderSelect(
          schema.label,
          <GripHorizontal className="w-3 h-3" />,
          ITEM_ALIGNMENT_OPTIONS,
          strVal,
          v => onChange(schema.key, v)
        )}
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // --- Gap (number input) — shared with FlexField ---
  if (controlType === 'gap') {
    const numVal = typeof value === 'number' ? value : 0
    return (
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <GripHorizontal className="w-3 h-3" />
          {schema.label}
        </label>
        <div className="flex gap-1.5 items-center">
          <input
            type="number"
            value={numVal}
            min={0}
            max={200}
            step={1}
            onChange={e => onChange(schema.key, e.target.value === '' ? 0 : parseFloat(e.target.value))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
          />
          <span className="text-[11px] text-slate-600 font-mono w-6">px</span>
        </div>
        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // --- Unknown field type ---
  return (
    <div className="text-xs text-red-400/60 italic p-2 bg-red-500/5 rounded-lg">
      Unknown grid field: <span className="font-mono">{schema.key}</span> ({schema.type})
    </div>
  )
}
