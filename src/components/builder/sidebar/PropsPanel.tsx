'use client'

/**
 * PropsPanel — C6.2-E
 *
 * Dynamic props editor — auto-generated from ComponentRegistry schema.
 *
 * Architecture:
 *   ComponentRegistry.get(section.type).schema
 *       ↓
 *   PropSchema[] (type: string | color | image | select | number | boolean | text | array)
 *       ↓
 *   Field renderer per type
 *       ↓
 *   dispatch({ type: 'UPDATE_PROPS', ... })
 *
 * No per-component editor files needed. The schema drives everything.
 */

import { useCallback, useMemo, useState } from 'react'
import { Image } from 'lucide-react'
import { X, Lock, Eye, EyeOff, Trash2, Copy } from 'lucide-react'
import { useBuilder, useSelectedSection } from '../state/BuilderProvider'
import { PropSchema } from '../../../../packages/builder-core/src/ComponentRegistry'
import { VIEWPORT_PRESETS, ViewportLabel } from '../../../../packages/builder-core/src/CanvasState'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { ResponsiveEngine, ResponsiveValue } from '../../../../packages/builder-core/src/ResponsiveEngine'
import { AssetPicker } from '../../media/AssetPicker'
import { MediaDocument } from '../../../../packages/asset-manager-core/src/AssetTypes'

// ---------------------------------------------------------------------------
// Individual field renderers
// ---------------------------------------------------------------------------

interface FieldProps {
  schema: PropSchema
  value: unknown
  onChange: (key: string, value: unknown) => void
}

function StringField({ schema, value, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
        {schema.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(schema.key, e.target.value)}
        placeholder={(schema as { placeholder?: string }).placeholder ?? schema.label}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600
                   focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
      />
      {schema.description && (
        <p className="text-[11px] text-slate-600 mt-1">{schema.description}</p>
      )}
    </div>
  )
}

function TextField({ schema, value, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(schema.key, e.target.value)}
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                   focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
      />
    </div>
  )
}

function NumberField({ schema, value, onChange }: FieldProps) {
  const s = schema as { min?: number; max?: number; step?: number; unit?: string }
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label} {s.unit && <span className="text-slate-600 normal-case font-normal">({s.unit})</span>}
      </label>
      <input
        type="number"
        value={typeof value === 'number' ? value : ''}
        min={s.min}
        max={s.max}
        step={s.step ?? 1}
        onChange={e => onChange(schema.key, parseFloat(e.target.value))}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                   focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
      />
    </div>
  )
}

function BooleanField({ schema, value, onChange }: FieldProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {schema.label}
      </label>
      <button
        onClick={() => onChange(schema.key, !value)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0
          ${value ? 'bg-violet-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
          ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function ColorField({ schema, value, onChange }: FieldProps) {
  const colorVal = typeof value === 'string' ? value : '#6366f1'
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={colorVal}
          onChange={e => onChange(schema.key, e.target.value)}
          className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
        />
        <input
          type="text"
          value={colorVal}
          onChange={e => onChange(schema.key, e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono
                     focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
      </div>
    </div>
  )
}

function ImageField({ schema, value, onChange }: FieldProps) {
  const [showPicker, setShowPicker] = useState(false)
  const assetRef = typeof value === 'object' && value !== null && 'id' in value ? value as { id: string; type: string } : null
  const displayUrl = assetRef ? `asset://${assetRef.id}` : (typeof value === 'string' ? value : '')
  
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      {assetRef && (
        <div className="mb-2 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center">
          <div className="text-4xl opacity-60">🖼️</div>
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-[10px] text-slate-400 font-mono truncate">asset://{assetRef.id}</p>
          </div>
        </div>
      )}
      {!assetRef && displayUrl && (
        <div className="mb-2 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt={schema.label} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={displayUrl}
          readOnly
          placeholder="Brak wybranego assetu"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none"
        />
        <button
          onClick={() => setShowPicker(true)}
          className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          title="Wybierz z biblioteki"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>
      <AssetPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(asset) => {
          const ref = { id: asset.id, type: asset.type }
          onChange(schema.key, ref)
          setShowPicker(false)
        }}
        document={{} as MediaDocument}
      />
    </div>
  )
}

function SelectField({ schema, value, onChange }: FieldProps) {
  const s = schema as { options?: Array<{ label: string; value: unknown }> }
  const options = s.options ?? []
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {schema.label}
      </label>
      <select
        value={String(value ?? '')}
        onChange={e => {
          const opt = options.find(o => String(o.value) === e.target.value)
          onChange(schema.key, opt?.value ?? e.target.value)
        }}
        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                   focus:outline-none focus:border-violet-500/50 transition-all"
      >
        {options.map(opt => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field dispatcher
// ---------------------------------------------------------------------------

function PropField({ schema, value, onChange }: FieldProps) {
  if (schema.hidden) return null

  switch (schema.type) {
    case 'string':  return <StringField  schema={schema} value={value} onChange={onChange} />
    case 'text':    return <TextField    schema={schema} value={value} onChange={onChange} />
    case 'number':  return <NumberField  schema={schema} value={value} onChange={onChange} />
    case 'boolean': return <BooleanField schema={schema} value={value} onChange={onChange} />
    case 'color':   return <ColorField   schema={schema} value={value} onChange={onChange} />
    case 'image':
    case 'asset':   return <ImageField   schema={schema} value={value} onChange={onChange} />
    case 'select':
    case 'multiselect': return <SelectField schema={schema} value={value} onChange={onChange} />
    case 'array':
    case 'object':
    default:
      return (
        <div className="text-xs text-slate-600 italic p-2 bg-white/5 rounded-lg">
          {schema.label}: <span className="font-mono">{schema.type}</span> — panel C6.3
        </div>
      )
  }
}

// ---------------------------------------------------------------------------
// PropsPanel root
// ---------------------------------------------------------------------------

export function PropsPanel() {
  const { dispatch, canvas, document, ctx } = useBuilder()
  const selectedNode = useSelectedSection()
  const responsiveEngine = useMemo(() => new ResponsiveEngine(), [])
  const [responsiveProps, setResponsiveProps] = useState<Record<string, Record<string, any>>>({})

  const handleClose = useCallback(() => {
    dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null } })
  }, [dispatch])

  const handlePropChange = useCallback((key: string, value: unknown) => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    const breakpoint = canvas.selection.activeBreakpoint
    const sectionResponsive = responsiveProps[canvas.selectedSectionId] ?? {}
    const updated = {
      ...sectionResponsive,
      [breakpoint.toLowerCase()]: value,
    }
    setResponsiveProps(prev => ({
      ...prev,
      [canvas.selectedSectionId!]: updated,
    }))
    dispatch({
      type: 'UPDATE_PROPS',
      pageId: canvas.selectedPageId,
      sectionId: canvas.selectedSectionId,
      props: { [key]: value },
    })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId, canvas.selection.activeBreakpoint, responsiveProps])

  const handleDelete = useCallback(() => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    dispatch({ type: 'REMOVE_SECTION', pageId: canvas.selectedPageId, sectionId: canvas.selectedSectionId })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  const handleDuplicate = useCallback(() => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    dispatch({ type: 'DUPLICATE_SECTION', pageId: canvas.selectedPageId, sectionId: canvas.selectedSectionId })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  const handleToggleVisibility = useCallback(() => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    dispatch({ type: 'TOGGLE_VISIBILITY', pageId: canvas.selectedPageId, sectionId: canvas.selectedSectionId })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  // Empty state
  if (!selectedNode) {
    // Show page-level SEO and branding when no section is selected
    const activePage = document.pages.find(p =>
      canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
    ) ?? document.pages[0]

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Właściwości</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activePage && (
            <>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Strona: {activePage.name}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Meta title
                </label>
                <input
                  type="text"
                  value={activePage.seo.title ?? ''}
                  onChange={e => dispatch({
                    type: 'UPDATE_PAGE_SEO',
                    pageId: activePage.id,
                    seo: { title: e.target.value }
                  })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                             focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Meta description
                </label>
                <textarea
                  value={activePage.seo.description ?? ''}
                  onChange={e => dispatch({
                    type: 'UPDATE_PAGE_SEO',
                    pageId: activePage.id,
                    seo: { description: e.target.value }
                  })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                             focus:outline-none focus:border-violet-500/50 transition-all resize-none"
                />
              </div>
            </>
          )}
          <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-xs text-center">
            <span className="text-2xl mb-2">▣</span>
            Kliknij sekcję, aby edytować jej właściwości
          </div>
        </div>
      </div>
    )
  }

  // Get schema from registry
  const descriptor = ctx.registry.get(selectedNode.type)
  const schema = descriptor?.schema ?? []
  const props = selectedNode.props

  // Group props by group
  const groups = new Map<string, PropSchema[]>()
  const ungrouped: PropSchema[] = []
  for (const field of schema) {
    if (field.group) {
      const existing = groups.get(field.group) ?? []
      existing.push(field)
      groups.set(field.group, existing)
    } else {
      ungrouped.push(field)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
            {selectedNode.label}
          </h2>
          <p className="text-[11px] text-slate-600 font-mono">{selectedNode.type}</p>
        </div>
        
        {/* Breakpoint Switcher */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          {(Object.keys(VIEWPORT_PRESETS) as ViewportLabel[]).map(label => (
            <button
              key={label}
              onClick={() => dispatch({ type: 'CANVAS', action: { type: 'SET_BREAKPOINT', breakpoint: label } })}
              className={`p-1 rounded transition-all ${
                canvas.selection.activeBreakpoint === label
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-slate-500 hover:text-white'
              }`}
              title={label}
            >
              {label === 'DESKTOP' && <Monitor className="w-3.5 h-3.5" />}
              {label === 'TABLET' && <Tablet className="w-3.5 h-3.5" />}
              {label === 'MOBILE' && <Smartphone className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleToggleVisibility}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors
              ${selectedNode.visible ? 'text-slate-400 hover:text-white' : 'text-violet-400'}`}
            title={selectedNode.visible ? 'Ukryj' : 'Pokaż'}
          >
            {selectedNode.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-violet-400 transition-colors"
            title="Duplikuj"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
            title="Usuń sekcję"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Zamknij"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Locked notice */}
      {selectedNode.locked && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          Sekcja jest zablokowana — edycja wyłączona
        </div>
      )}

      {/* Props */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${selectedNode.locked ? 'pointer-events-none opacity-60' : ''}`}>
        {schema.length === 0 ? (
          <div className="text-xs text-slate-600 italic text-center py-8">
            Brak konfigurowalnych właściwości dla tego komponentu.
            <br />
            Zarejestruj schemat w ComponentRegistry.
          </div>
        ) : (
          <>
            {/* Ungrouped fields */}
            {ungrouped.map(field => (
              <PropField
                key={field.key}
                schema={field}
                value={props[field.key]}
                onChange={handlePropChange}
              />
            ))}
            {/* Grouped fields */}
            {Array.from(groups.entries()).map(([groupName, fields]) => (
              <div key={groupName}>
                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 pt-2 border-t border-white/5">
                  {groupName}
                </div>
                <div className="space-y-3">
                  {fields.map(field => (
                    <PropField
                      key={field.key}
                      schema={field}
                      value={props[field.key]}
                      onChange={handlePropChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
