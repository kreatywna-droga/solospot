'use client'

/**
 * ContextualSettingsPanel — Full contextual settings panel for the selected element.
 *
 * Appears next to the selected element on the Canvas, providing the same editing
 * capabilities as the right-side Inspector. Uses existing controls from
 * DesignInspector and PhaseThreeInspector.
 *
 * ARCHITECTURE:
 *   SelectionOverlay → ContextualSettingsPanel
 *     ↓
 *   usePanelPosition (collision detection)
 *     ↓
 *   Element Profile → Available Groups → Accordions → Controls
 *     ↓
 *   dispatch() → BuilderDocument (SSOT) → Canvas
 *
 * One source of truth — NO duplication of mutation logic.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronDown, Settings,
  Type, FileText, Image as ImageIcon, Video, MousePointer,
  Layers, LayoutDashboard, Palette, Square, Sparkles, Minus, Move,
  Upload, ExternalLink,
} from 'lucide-react'
import { useBuilder, useSelectedSection } from '../state/BuilderProvider'
import { usePanelPosition, type ElementRect } from './usePanelPosition'
import { getProfileForNodeType, type SettingsGroup, type ElementSettingsProfile } from './elementProfiles'
import { MediaPickerModal } from '../sidebar/MediaPickerModal'
import { applyAssetToNode } from '@/lib/assets/AssetResolver'
import type { AssetSlotType } from '@/lib/assets/AssetTypes'
import { FontPicker } from '../../../../packages/authoring-studio/src/inspector/widgets/FontPicker'
import { findNode } from '../../../../packages/builder-core/src'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContextualSettingsPanelProps {
  /** Selected element ID */
  sectionId: string
  /** Page ID */
  pageId: string
  /** Element bounding rect in viewport coords */
  elementRect: ElementRect | null
  /** Called when panel should close */
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Shared CSS classes
// ---------------------------------------------------------------------------

const inputCls =
  'w-full bg-[#18181B] border border-white/10 rounded px-2 py-1 text-[12px] text-white focus:outline-none focus:border-[#D9A86C]/60 transition-colors'

const unitInputCls =
  'w-full bg-[#18181B] border border-white/10 rounded-l px-2 py-1 text-[12px] text-white focus:outline-none focus:border-[#D9A86C]/60 transition-colors'

// ---------------------------------------------------------------------------
// Accordion Section
// ---------------------------------------------------------------------------

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-white transition-colors"
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row layout
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Color Input
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  { label: 'Przezroczysty', value: 'transparent' },
  { label: 'Biały', value: '#ffffff' },
  { label: 'Czarny', value: '#000000' },
  { label: 'Ciemny', value: '#18181B' },
  { label: 'Fiolet', value: '#7c3aed' },
  { label: 'Róż', value: '#ec4899' },
  { label: 'Niebieski', value: '#3b82f6' },
  { label: 'Szmaragd', value: '#10b981' },
  { label: 'Bursztyn', value: '#f59e0b' },
  { label: 'Szary', value: '#64748b' },
]

function ColorInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const hexVal = useMemo(() => {
    if (!value || value === 'transparent') return '#ffffff'
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    }
    return '#ffffff'
  }, [value])

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5">
        <div
          className="w-7 h-7 rounded-lg border border-white/20 flex-shrink-0 cursor-pointer relative overflow-hidden shadow-inner"
          style={{ background: value || 'transparent' }}
        >
          <input
            type="color"
            value={hexVal}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <input
          type="text"
          value={value || ''}
          placeholder="#ffffff, transparent, rgba(…)"
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} font-mono text-xs`}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            title={preset.label}
            onClick={() => onChange(preset.value)}
            className={`w-3.5 h-3.5 rounded-sm border transition-transform hover:scale-125 ${
              value === preset.value ? 'ring-1 ring-[#D9A86C] border-white' : 'border-white/20'
            }`}
            style={{
              backgroundColor: preset.value === 'transparent' ? '#1a1a24' : preset.value,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Unit Input with slider
// ---------------------------------------------------------------------------

function UnitInput({
  value,
  onChange,
  onLivePreview,
  placeholder = '0',
  min,
  max,
  step,
  slider,
  defaultUnit = 'px',
}: {
  value?: string
  onChange: (v: string) => void
  onLivePreview?: (v: string) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  slider?: boolean
  defaultUnit?: string
}) {
  const match = value ? String(value).match(/^([+-]?(?:\d*\.)?\d+)([a-zA-Z%]*)$/) : null
  const numVal = match ? parseFloat(match[1]) : (value ? parseFloat(String(value).replace(/[^0-9.-]/g, '')) : NaN)
  const detectedUnit = match && match[2] !== undefined ? match[2] : defaultUnit
  const hasNum = !Number.isNaN(numVal)
  const [unit, setUnit] = useState(detectedUnit)

  useEffect(() => {
    const m = value ? String(value).match(/^([+-]?(?:\d*\.)?\d+)([a-zA-Z%]*)$/) : null
    const newUnit = m && m[2] !== undefined ? m[2] : defaultUnit
    setUnit(newUnit)
  }, [value, defaultUnit])

  const commit = (num: string, u: string) => {
    if (!num) { onChange(''); return }
    onChange(`${num}${u !== undefined ? u : defaultUnit}`)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        <input
          type="number"
          value={hasNum ? numVal : ''}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={(e) => commit(e.target.value, unit)}
          className={unitInputCls}
        />
        <select
          value={unit}
          onChange={(e) => { setUnit(e.target.value); commit(hasNum ? String(numVal) : '', e.target.value) }}
          className="bg-[#18181B] border border-l-0 border-white/10 rounded-r text-[11px] text-slate-400 px-1 focus:outline-none"
        >
          <option value="">—</option>
          <option>px</option>
          <option>%</option>
          <option>rem</option>
          <option>em</option>
          <option>vw</option>
          <option>vh</option>
          <option>auto</option>
        </select>
      </div>
      {slider && min !== undefined && max !== undefined && (
        <input
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={hasNum ? Math.min(max, Math.max(min, numVal)) : min}
          onInput={(e) => {
            const n = parseFloat((e.target as HTMLInputElement).value)
            const rounded = Math.round(n * 100) / 100
            onLivePreview?.(unit ? `${rounded}${unit}` : `${rounded}`)
          }}
          onChange={(e) => {
            const rounded = Math.round(parseFloat(e.target.value) * 100) / 100
            commit(String(rounded), unit)
          }}
          className="w-full accent-[#D9A86C] h-1 cursor-pointer"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Select Input
// ---------------------------------------------------------------------------

function SelectInput({
  value,
  onChange,
  options,
}: {
  value?: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} cursor-pointer`}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Icon Toggle Group
// ---------------------------------------------------------------------------

function IconToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value?: T
  onChange: (v: T) => void
  options: { value: T; icon: React.ReactNode; title: string }[]
}) {
  return (
    <div className="flex gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center p-1.5 rounded text-[11px] transition-colors ${
            value === opt.value
              ? 'bg-[#D9A86C]/20 text-[#F2C27F] border border-[#D9A86C]/40'
              : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shadow Editor
// ---------------------------------------------------------------------------

function parseBoxShadow(raw?: string) {
  if (!raw || raw === 'none') return { x: 0, y: 4, blur: 16, spread: 0, color: '#000000', opacity: 0.25, enabled: false }
  const m = raw.match(/^-?(?:inset\s+)?(-?\d+(?:\.\d+)?)(?:px)?\s+(-?\d+(?:\.\d+)?)(?:px)?\s+(-?\d+(?:\.\d+)?)(?:px)?(?:\s+(-?\d+(?:\.\d+)?)(?:px)?)?\s*(.*)$/)
  if (!m) return { x: 0, y: 4, blur: 16, spread: 0, color: '#000000', opacity: 0.25, enabled: true }
  const x = parseFloat(m[1]) || 0
  const y = parseFloat(m[2]) || 0
  const blur = parseFloat(m[3]) || 0
  const spread = m[4] ? (parseFloat(m[4]) || 0) : 0
  const colorStr = (m[5] || '#000000').trim()
  let color = '#000000'
  let opacity = 0.25
  const rgbaMatch = colorStr.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i)
  if (rgbaMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbaMatch[1], 10))).toString(16).padStart(2, '0')
    const g = Math.min(255, Math.max(0, parseInt(rgbaMatch[2], 10))).toString(16).padStart(2, '0')
    const b = Math.min(255, Math.max(0, parseInt(rgbaMatch[3], 10))).toString(16).padStart(2, '0')
    color = `#${r}${g}${b}`
    opacity = parseFloat(rgbaMatch[4])
  } else {
    const hexMatch = colorStr.match(/#([0-9a-fA-F]{3,6})/)
    if (hexMatch) {
      let hex = hexMatch[1]
      if (hex.length === 3) hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      color = `#${hex}`
      opacity = 1
    }
  }
  return { x, y, blur, spread, color, opacity, enabled: true }
}

function buildBoxShadow(s: { x: number; y: number; blur: number; spread: number; color: string; opacity: number; enabled: boolean }) {
  if (!s.enabled) return 'none'
  const r = parseInt(s.color.slice(1, 3), 16)
  const g = parseInt(s.color.slice(3, 5), 16)
  const b = parseInt(s.color.slice(5, 7), 16)
  return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(${r},${g},${b},${s.opacity})`
}

function ShadowEditor({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const shadow = useMemo(() => parseBoxShadow(value), [value])
  const [local, setLocal] = useState(shadow)
  useEffect(() => { setLocal(shadow) }, [value])

  const update = (patch: Partial<typeof local>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange(buildBoxShadow(next))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Shadow</span>
        <button
          type="button"
          onClick={() => update({ enabled: !local.enabled })}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            local.enabled ? 'bg-[#D9A86C] text-white' : 'bg-white/5 text-slate-500 hover:text-white'
          }`}
        >
          {local.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {local.enabled && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500">X</label>
              <input type="range" min={-50} max={50} step={1} value={local.x}
                onInput={(e) => update({ x: parseFloat((e.target as HTMLInputElement).value) })}
                className="w-full accent-[#D9A86C] h-1" />
              <div className="text-[10px] text-slate-400 text-right font-mono">{local.x}px</div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Y</label>
              <input type="range" min={-50} max={50} step={1} value={local.y}
                onInput={(e) => update({ y: parseFloat((e.target as HTMLInputElement).value) })}
                className="w-full accent-[#D9A86C] h-1" />
              <div className="text-[10px] text-slate-400 text-right font-mono">{local.y}px</div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Blur</label>
              <input type="range" min={0} max={100} step={1} value={local.blur}
                onInput={(e) => update({ blur: parseFloat((e.target as HTMLInputElement).value) })}
                className="w-full accent-[#D9A86C] h-1" />
              <div className="text-[10px] text-slate-400 text-right font-mono">{local.blur}px</div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Spread</label>
              <input type="range" min={-50} max={50} step={1} value={local.spread}
                onInput={(e) => update({ spread: parseFloat((e.target as HTMLInputElement).value) })}
                className="w-full accent-[#D9A86C] h-1" />
              <div className="text-[10px] text-slate-400 text-right font-mono">{local.spread}px</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg border border-white/20 flex-shrink-0 overflow-hidden shadow-inner"
              style={{ background: local.color }}>
              <input type="color" value={local.color}
                onChange={(e) => update({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500">Opacity</label>
              <input type="range" min={0} max={1} step={0.01} value={local.opacity}
                onInput={(e) => update({ opacity: parseFloat((e.target as HTMLInputElement).value) })}
                className="w-full accent-[#D9A86C] h-1" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono w-10 text-right">{Math.round(local.opacity * 100)}%</div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FourSideEditor (Padding / Margin)
// ---------------------------------------------------------------------------

type FourSide = { top?: string; right?: string; bottom?: string; left?: string }

function FourSideEditor({ label, value, onChange }: { label: string; value?: FourSide | string; onChange: (v: FourSide) => void }) {
  const [linked, setLinked] = useState(true)
  const parsed: FourSide =
    value && typeof value === 'object' ? value
    : typeof value === 'string' ? { top: value, right: value, bottom: value, left: value }
    : {}
  const masterVal = parseInt(parsed.top || '0', 10) || 0

  const handleSide = (side: keyof FourSide, v: string) => {
    if (linked) onChange({ top: v, right: v, bottom: v, left: v })
    else onChange({ ...parsed, [side]: v })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setLinked(!linked)}
          className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 transition-colors ${
            linked
              ? 'text-[#D9A86C] bg-[#D9A86C]/20 border border-[#D9A86C]/30'
              : 'text-slate-500 hover:text-white bg-white/5'
          }`}
        >
          <span className="text-[9px]">{linked ? 'Połączone' : 'Osobno'}</span>
        </button>
      </div>
      {linked ? (
        <div className="flex items-center gap-2 bg-[#18181B] p-2 rounded-lg border border-white/5">
          <input type="range" min={0} max={120} step={1} value={masterVal}
            onChange={(e) => { const v = `${e.target.value}px`; onChange({ top: v, right: v, bottom: v, left: v }) }}
            className="flex-1 accent-[#D9A86C] h-1 cursor-pointer" />
          <div className="flex items-center">
            <input type="number" min={0} max={999} value={masterVal}
              onChange={(e) => { const v = `${e.target.value || '0'}px`; onChange({ top: v, right: v, bottom: v, left: v }) }}
              className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none font-mono" />
            <span className="text-[10px] text-slate-500 ml-1">px</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 bg-[#18181B] p-2 rounded-lg border border-white/5">
          {([['top', 'T'], ['right', 'R'], ['bottom', 'B'], ['left', 'L']] as const).map(([key, short]) => {
            const sideVal = parseInt(parsed[key] || '0', 10) || 0
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-bold text-slate-400 uppercase">{short}:</span>
                <input type="range" min={0} max={120} step={1} value={sideVal}
                  onChange={(e) => handleSide(key, `${e.target.value}px`)}
                  className="flex-1 accent-[#D9A86C] h-1 cursor-pointer" />
                <input type="number" min={0} max={999} value={sideVal}
                  onChange={(e) => handleSide(key, `${e.target.value || '0'}px`)}
                  className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none font-mono" />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content Group (Text / Button content)
// ---------------------------------------------------------------------------

function ContentGroup({
  nodeType,
  props,
  styles,
  onPropChange,
  onStyleChange,
  sectionId,
}: {
  nodeType: string
  props: Record<string, any>
  styles: Record<string, any>
  onPropChange: (key: string, value: unknown) => void
  onStyleChange: (patch: Record<string, any>) => void
  sectionId: string
}) {
  const { dispatch } = useBuilder()
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaTarget, setMediaTarget] = useState<AssetSlotType>('IMAGE')

  if (nodeType === 'heading' || nodeType === 'text') {
    return (
      <AccordionSection title="Content" defaultOpen>
        <Row label="Tekst">
          <textarea
            value={props.text || props.content || ''}
            onChange={(e) => onPropChange('text', e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Row>
      </AccordionSection>
    )
  }

  if (nodeType === 'button') {
    return (
      <AccordionSection title="Content" defaultOpen>
        <Row label="Tekst">
          <input
            type="text"
            value={props.text || ''}
            onChange={(e) => onPropChange('text', e.target.value)}
            className={inputCls}
          />
        </Row>
        <Row label="Link">
          <input
            type="text"
            value={props.href || props.link || ''}
            onChange={(e) => onPropChange('href', e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </Row>
      </AccordionSection>
    )
  }

  if (nodeType === 'image') {
    return (
      <AccordionSection title="Image Source" defaultOpen>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => { setMediaTarget('IMAGE'); setShowMediaPicker(true) }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#D9A86C] hover:bg-[#B8893A] text-white text-[11px] font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Wybierz obraz
            </button>
          </div>
          <Row label="URL">
            <input
              type="text"
              value={props.src || props.url || ''}
              onChange={(e) => onPropChange('src', e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </Row>
          <Row label="Alt">
            <input
              type="text"
              value={props.alt || ''}
              onChange={(e) => onPropChange('alt', e.target.value)}
              className={inputCls}
            />
          </Row>
          <Row label="Fit">
            <SelectInput
              value={styles.objectFit}
              onChange={(v) => onStyleChange({ objectFit: v })}
              options={[
                { value: 'cover', label: 'Cover' },
                { value: 'contain', label: 'Contain' },
                { value: 'fill', label: 'Fill' },
                { value: 'none', label: 'None' },
              ]}
            />
          </Row>
        </div>
        {showMediaPicker && (
          <MediaPickerModal
            isOpen={showMediaPicker}
            slotType={mediaTarget}
            onClose={() => setShowMediaPicker(false)}
            onSelect={(url, asset) => {
              if (asset) {
                applyAssetToNode(dispatch, sectionId, asset, mediaTarget)
              } else if (mediaTarget === 'IMAGE') {
                onPropChange('src', url)
              } else {
                onStyleChange({ backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' })
              }
              setShowMediaPicker(false)
            }}
          />
        )}
      </AccordionSection>
    )
  }

  if (nodeType === 'video') {
    return (
      <AccordionSection title="Video Source" defaultOpen>
        <Row label="URL">
          <input
            type="text"
            value={props.src || props.url || ''}
            onChange={(e) => onPropChange('src', e.target.value)}
            placeholder="https://... .mp4/.webm"
            className={inputCls}
          />
        </Row>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <input type="checkbox" checked={props.controls ?? true}
              onChange={(e) => onPropChange('controls', e.target.checked)}
              className="accent-[#D9A86C] rounded" />
            Controls
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <input type="checkbox" checked={props.loop ?? false}
              onChange={(e) => onPropChange('loop', e.target.checked)}
              className="accent-[#D9A86C] rounded" />
            Loop
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <input type="checkbox" checked={props.muted ?? true}
              onChange={(e) => onPropChange('muted', e.target.checked)}
              className="accent-[#D9A86C] rounded" />
            Muted
          </label>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <input type="checkbox" checked={props.autoPlay ?? false}
            onChange={(e) => onPropChange('autoPlay', e.target.checked)}
            className="accent-[#D9A86C] rounded" />
          Autoplay
        </div>
      </AccordionSection>
    )
  }

  // Section / Container / Hero — show background settings
  if (nodeType === 'section' || nodeType === 'container' || nodeType?.startsWith('hero')) {
    return (
      <AccordionSection title="Background" defaultOpen>
        <div className="space-y-2">
          <Row label="Typ">
            <SelectInput
              value={styles.videoSrc ? 'video' : styles.backgroundImage ? 'image' : 'color'}
              onChange={(v) => {
                if (v === 'color') onStyleChange({ backgroundImage: '', videoSrc: '' })
                else if (v === 'image') { setMediaTarget('BACKGROUND_IMAGE'); setShowMediaPicker(true) }
                else if (v === 'video') onStyleChange({ videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4' })
              }}
              options={[
                { value: 'color', label: 'Kolor' },
                { value: 'image', label: 'Obraz tła' },
                { value: 'video', label: 'Wideo tła' },
              ]}
            />
          </Row>
          <Row label="Kolor">
            <ColorInput value={styles.backgroundColor} onChange={(v) => onStyleChange({ backgroundColor: v })} />
          </Row>
          {styles.videoSrc && (
            <>
              <Row label="Wideo URL">
                <input type="text" value={styles.videoSrc || ''} onChange={(e) => onStyleChange({ videoSrc: e.target.value })}
                  placeholder="https://..." className={inputCls} />
              </Row>
              <Row label="Wycisz">
                <input type="checkbox" checked={styles.videoMuted ?? true}
                  onChange={(e) => onStyleChange({ videoMuted: e.target.checked })}
                  className="accent-[#D9A86C] rounded" />
              </Row>
              <Row label="Autoplay">
                <input type="checkbox" checked={styles.videoAutoplay ?? true}
                  onChange={(e) => onStyleChange({ videoAutoplay: e.target.checked })}
                  className="accent-[#D9A86C] rounded" />
              </Row>
            </>
          )}
          <Row label="Nakładka">
            <ColorInput value={styles.overlayColor || '#000000'} onChange={(v) => onStyleChange({ overlayColor: v })} />
          </Row>
          <Row label="Krycie">
            <UnitInput
              value={`${Math.round((styles.overlayOpacity ?? 0.5) * 100)}%`}
              onChange={(v) => { const num = parseFloat(v) || 0; onStyleChange({ overlayOpacity: Math.min(1, Math.max(0, num / 100)) }) }}
              slider min={0} max={100} step={1}
            />
          </Row>
        </div>
        {showMediaPicker && (
          <MediaPickerModal
            isOpen={showMediaPicker}
            slotType={mediaTarget}
            onClose={() => setShowMediaPicker(false)}
            onSelect={(url, asset) => {
              if (asset) applyAssetToNode(dispatch, sectionId, asset, mediaTarget)
              else onStyleChange({ backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' })
              setShowMediaPicker(false)
            }}
          />
        )}
      </AccordionSection>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Typography Group
// ---------------------------------------------------------------------------

function TypographyGroup({ styles, onStyleChange, sectionId }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void; sectionId?: string }) {
  const livePreview = (prop: string, value: string) => {
    if (!sectionId) return
    const el = (document.querySelector(`[data-node-id="${sectionId}"]`) ?? document.querySelector(`[data-section-id="${sectionId}"]`)) as HTMLElement | null
    if (el) {
      const textEl = el.querySelector('[data-inline-edit="text"]') as HTMLElement | null
      ;(textEl || el).style.setProperty(prop, value, 'important')
    }
  }

  return (
    <AccordionSection title="Typography">
      <Row label="Font">
        <FontPicker value={styles.fontFamily || 'Inter'} onChange={(v) => onStyleChange({ fontFamily: v })} />
      </Row>
      <Row label="Size">
        <UnitInput value={styles.fontSize} onChange={(v) => onStyleChange({ fontSize: v })}
          onLivePreview={(v) => livePreview('font-size', v)} placeholder="16px" slider min={8} max={150} step={1} />
      </Row>
      <Row label="Weight">
        <SelectInput value={styles.fontWeight} onChange={(v) => onStyleChange({ fontWeight: v })}
          options={[
            { value: '400', label: 'Regular (400)' }, { value: '500', label: 'Medium (500)' },
            { value: '600', label: 'SemiBold (600)' }, { value: '700', label: 'Bold (700)' },
            { value: '800', label: 'ExtraBold (800)' }, { value: '900', label: 'Black (900)' },
          ]} />
      </Row>
      <Row label="Line H.">
        <UnitInput value={styles.lineHeight} onChange={(v) => onStyleChange({ lineHeight: v })}
          onLivePreview={(v) => livePreview('line-height', v)} placeholder="1.5" slider min={0.8} max={3.0} step={0.05} defaultUnit="" />
      </Row>
      <Row label="Tracking">
        <UnitInput value={styles.letterSpacing} onChange={(v) => onStyleChange({ letterSpacing: v })}
          onLivePreview={(v) => livePreview('letter-spacing', v)} placeholder="0px" slider min={-2} max={12} step={0.5} />
      </Row>
      <Row label="Align">
        <IconToggleGroup<'left' | 'center' | 'right' | 'justify'>
          value={styles.textAlign}
          onChange={(v) => onStyleChange({ textAlign: v })}
          options={[
            { value: 'left', icon: <Type className="w-3.5 h-3.5" />, title: 'Left' },
            { value: 'center', icon: <Type className="w-3.5 h-3.5 text-center" />, title: 'Center' },
            { value: 'right', icon: <Type className="w-3.5 h-3.5 text-right" />, title: 'Right' },
            { value: 'justify', icon: <Type className="w-3.5 h-3.5 text-justify" />, title: 'Justify' },
          ]}
        />
      </Row>
      <Row label="Color">
        <ColorInput value={styles.color} onChange={(v) => onStyleChange({ color: v })} />
      </Row>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Size Group
// ---------------------------------------------------------------------------

function SizeGroup({ styles, onStyleChange, sectionId }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void; sectionId?: string }) {
  const livePreview = (prop: string, value: string) => {
    if (!sectionId) return
    const el = (document.querySelector(`[data-node-id="${sectionId}"]`) ?? document.querySelector(`[data-section-id="${sectionId}"]`)) as HTMLElement | null
    if (el) el.style.setProperty(prop, value, 'important')
  }

  return (
    <AccordionSection title="Size">
      <Row label="Width">
        <UnitInput value={styles.width} onChange={(v) => onStyleChange({ width: v })}
          onLivePreview={(v) => livePreview('width', v)} slider min={20} max={1600} step={1} />
      </Row>
      <Row label="Height">
        <UnitInput value={styles.height} onChange={(v) => onStyleChange({ height: v })}
          onLivePreview={(v) => livePreview('height', v)} slider min={20} max={1200} step={1} />
      </Row>
      <Row label="Min W">
        <UnitInput value={styles.minWidth} onChange={(v) => onStyleChange({ minWidth: v })}
          onLivePreview={(v) => livePreview('min-width', v)} slider min={0} max={1600} step={1} />
      </Row>
      <Row label="Max W">
        <UnitInput value={styles.maxWidth} onChange={(v) => onStyleChange({ maxWidth: v })}
          onLivePreview={(v) => livePreview('max-width', v)} slider min={200} max={1920} step={1} />
      </Row>
      <Row label="Min H">
        <UnitInput value={styles.minHeight} onChange={(v) => onStyleChange({ minHeight: v })}
          onLivePreview={(v) => livePreview('min-height', v)} slider min={0} max={1200} step={1} />
      </Row>
      <Row label="Max H">
        <UnitInput value={styles.maxHeight} onChange={(v) => onStyleChange({ maxHeight: v })}
          onLivePreview={(v) => livePreview('max-height', v)} slider min={100} max={1600} step={1} />
      </Row>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Position Group
// ---------------------------------------------------------------------------

function PositionGroup({ styles, onStyleChange }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void }) {
  return (
    <AccordionSection title="Position">
      <Row label="X">
        <UnitInput value={styles.translateX !== undefined ? String(styles.translateX) : '0px'}
          onChange={(v) => onStyleChange({ translateX: v })} slider min={-200} max={200} step={1} />
      </Row>
      <Row label="Y">
        <UnitInput value={styles.translateY !== undefined ? String(styles.translateY) : '0px'}
          onChange={(v) => onStyleChange({ translateY: v })} slider min={-200} max={200} step={1} />
      </Row>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Fill Group (background color)
// ---------------------------------------------------------------------------

function FillGroup({ styles, onStyleChange, sectionId }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void; sectionId?: string }) {
  const livePreview = (prop: string, value: string) => {
    if (!sectionId) return
    const el = (document.querySelector(`[data-node-id="${sectionId}"]`) ?? document.querySelector(`[data-section-id="${sectionId}"]`)) as HTMLElement | null
    if (el) el.style.setProperty(prop, value, 'important')
  }

  return (
    <AccordionSection title="Fill">
      <Row label="Background">
        <ColorInput value={styles.backgroundColor} onChange={(v) => { onStyleChange({ backgroundColor: v }); livePreview('background-color', v) }} />
      </Row>
      <Row label="Color">
        <ColorInput value={styles.color} onChange={(v) => { onStyleChange({ color: v }); livePreview('color', v) }} />
      </Row>
      <Row label="Opacity">
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={1} step={0.01} value={styles.opacity ?? 1}
            onChange={(e) => onStyleChange({ opacity: parseFloat(e.target.value) })}
            className="flex-1 accent-[#D9A86C] h-1 cursor-pointer" />
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{Math.round((styles.opacity ?? 1) * 100)}%</span>
        </div>
      </Row>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Spacing Group (Padding / Margin)
// ---------------------------------------------------------------------------

function SpacingGroup({ styles, onStyleChange }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void }) {
  return (
    <AccordionSection title="Spacing">
      <FourSideEditor
        label="Padding"
        value={typeof styles.padding === 'object' ? styles.padding : typeof styles.padding === 'string' ? { top: styles.padding, right: styles.padding, bottom: styles.padding, left: styles.padding } : {}}
        onChange={(v) => onStyleChange({ padding: v })}
      />
      <FourSideEditor
        label="Margin"
        value={typeof styles.margin === 'object' ? styles.margin : typeof styles.margin === 'string' ? { top: styles.margin, right: styles.margin, bottom: styles.margin, left: styles.margin } : {}}
        onChange={(v) => onStyleChange({ margin: v })}
      />
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Border Group
// ---------------------------------------------------------------------------

function BorderGroup({ styles, onStyleChange, sectionId }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void; sectionId?: string }) {
  const livePreview = (prop: string, value: string) => {
    if (!sectionId) return
    const el = (document.querySelector(`[data-node-id="${sectionId}"]`) ?? document.querySelector(`[data-section-id="${sectionId}"]`)) as HTMLElement | null
    if (el) el.style.setProperty(prop, value, 'important')
  }

  return (
    <AccordionSection title="Border">
      <Row label="Color">
        <ColorInput value={styles.borderColor} onChange={(v) => { onStyleChange({ borderColor: v }); livePreview('border-color', v) }} />
      </Row>
      <Row label="Width">
        <UnitInput value={styles.borderWidth} onChange={(v) => onStyleChange({ borderWidth: v })}
          onLivePreview={(v) => livePreview('border-width', v)} slider min={0} max={30} step={1} />
      </Row>
      <Row label="Style">
        <SelectInput value={styles.borderStyle} onChange={(v) => onStyleChange({ borderStyle: v })}
          options={[
            { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' }, { value: 'none', label: 'None' },
          ]} />
      </Row>
      <Row label="Radius">
        <UnitInput value={styles.borderRadius} onChange={(v) => onStyleChange({ borderRadius: v })}
          onLivePreview={(v) => livePreview('border-radius', v)} slider min={0} max={100} step={1} />
      </Row>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Shadow Group
// ---------------------------------------------------------------------------

function ShadowGroup({ styles, onStyleChange }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void }) {
  return (
    <AccordionSection title="Shadow">
      <ShadowEditor value={styles.boxShadow} onChange={(v) => onStyleChange({ boxShadow: v })} />
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Appearance Group (opacity + transform)
// ---------------------------------------------------------------------------

function AppearanceGroup({ styles, onStyleChange }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void }) {
  return (
    <AccordionSection title="Appearance">
      <Row label="Opacity">
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={1} step={0.01} value={styles.opacity ?? 1}
            onChange={(e) => onStyleChange({ opacity: parseFloat(e.target.value) })}
            className="flex-1 accent-[#D9A86C] h-1 cursor-pointer" />
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{Math.round((styles.opacity ?? 1) * 100)}%</span>
        </div>
      </Row>
      <Row label="Skala">
        <div className="flex items-center gap-2">
          <input type="range" min={10} max={300} step={1} value={Math.round((styles.scale ?? 1) * 100)}
            onChange={(e) => onStyleChange({ scale: parseFloat(e.target.value) / 100 })}
            className="flex-1 accent-[#D9A86C] h-1 cursor-pointer" />
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{Math.round((styles.scale ?? 1) * 100)}%</span>
        </div>
      </Row>
      <Row label="Obrót">
        <div className="flex items-center gap-2">
          <input type="range" min={-180} max={180} step={1} value={styles.rotate ?? 0}
            onChange={(e) => onStyleChange({ rotate: parseInt(e.target.value, 10) })}
            className="flex-1 accent-[#D9A86C] h-1 cursor-pointer" />
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{styles.rotate ?? 0}°</span>
        </div>
      </Row>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Advanced Group (Custom CSS)
// ---------------------------------------------------------------------------

function AdvancedGroup({ styles, onStyleChange }: { styles: Record<string, any>; onStyleChange: (p: Record<string, any>) => void }) {
  return (
    <AccordionSection title="Advanced">
      <div className="space-y-2">
        <span className="text-[11px] text-slate-500">Custom CSS</span>
        <textarea
          value={styles.customCss || ''}
          onChange={(e) => onStyleChange({ customCss: e.target.value })}
          placeholder={'/* custom CSS */\ncolor: red;\nfont-size: 18px;'}
          rows={4}
          className="w-full bg-[#18181B] border border-white/10 rounded px-2 py-1.5 text-[11px] text-green-300 font-mono focus:outline-none focus:border-[#D9A86C]/60 resize-none"
          spellCheck={false}
        />
      </div>
    </AccordionSection>
  )
}

// ---------------------------------------------------------------------------
// Main: ContextualSettingsPanel
// ---------------------------------------------------------------------------

export function ContextualSettingsPanel({
  sectionId,
  pageId,
  elementRect,
  onClose,
}: ContextualSettingsPanelProps) {
  const { dispatch, document: builderDoc, canvas } = useBuilder()
  const selectedNode = useSelectedSection()

  // Position
  const position = usePanelPosition(elementRect, !!sectionId)

  // Find the node
  const found = useMemo(() => findNode(builderDoc, sectionId), [builderDoc, sectionId])
  const node = found?.node
  const nodeType = node?.type || 'section'
  const profile = getProfileForNodeType(nodeType)

  // Current props & styles
  const activeBp = canvas.viewport.label === 'TABLET' ? 'tablet' : canvas.viewport.label === 'MOBILE' ? 'mobile' : 'desktop'
  const styles = useMemo(() => {
    if (!node) return {}
    if (activeBp === 'desktop') return node.styles || {}
    const resp = (node.responsive as Record<string, any>)?.[activeBp] || {}
    return { ...(node.styles || {}), ...resp }
  }, [node, activeBp])
  const props = node?.props || {}

  // Mutation handlers — reuse exact same dispatch pattern as Inspector
  const handlePropChange = useCallback((key: string, value: unknown) => {
    dispatch({ type: 'UPDATE_PROPS', pageId, sectionId, props: { [key]: value } } as any)
  }, [dispatch, pageId, sectionId])

  const handleStyleChange = useCallback((patch: Record<string, any>) => {
    const effectivePatch = { ...patch }
    if (patch.fontSize && (nodeType === 'text' || nodeType === 'heading')) {
      effectivePatch.height = undefined
    }
    if (activeBp === 'tablet' || activeBp === 'mobile') {
      const currentResp = (node?.responsive as Record<string, any>) || {}
      const currentBpStyles = currentResp[activeBp] || {}
      dispatch({
        type: 'UPDATE_NODE',
        nodeId: sectionId,
        updates: { responsive: { ...currentResp, [activeBp]: { ...currentBpStyles, ...effectivePatch } } },
        pageId,
      } as any)
    } else {
      dispatch({ type: 'SET_NODE_STYLES', nodeId: sectionId, styles: effectivePatch } as any)
    }
  }, [dispatch, sectionId, activeBp, node, pageId, nodeType])

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!node) return null

  const renderGroup = (group: SettingsGroup) => {
    switch (group) {
      case 'content':
        return <ContentGroup key={group} nodeType={nodeType} props={props} styles={styles}
          onPropChange={handlePropChange} onStyleChange={handleStyleChange} sectionId={sectionId} />
      case 'typography':
        return <TypographyGroup key={group} styles={styles} onStyleChange={handleStyleChange} sectionId={sectionId} />
      case 'size':
        return <SizeGroup key={group} styles={styles} onStyleChange={handleStyleChange} sectionId={sectionId} />
      case 'position':
        return <PositionGroup key={group} styles={styles} onStyleChange={handleStyleChange} />
      case 'fill':
        return <FillGroup key={group} styles={styles} onStyleChange={handleStyleChange} sectionId={sectionId} />
      case 'spacing':
        return <SpacingGroup key={group} styles={styles} onStyleChange={handleStyleChange} />
      case 'border':
        return <BorderGroup key={group} styles={styles} onStyleChange={handleStyleChange} sectionId={sectionId} />
      case 'shadow':
        return <ShadowGroup key={group} styles={styles} onStyleChange={handleStyleChange} />
      case 'appearance':
        return <AppearanceGroup key={group} styles={styles} onStyleChange={handleStyleChange} />
      case 'advanced':
        return <AdvancedGroup key={group} styles={styles} onStyleChange={handleStyleChange} />
      // Groups that reuse content for hero/section backgrounds
      case 'background':
      case 'background-video':
      case 'image-source':
      case 'video-source':
      case 'layout':
      case 'responsive':
      case 'experience':
        return <ContentGroup key={group} nodeType={nodeType} props={props} styles={styles}
          onPropChange={handlePropChange} onStyleChange={handleStyleChange} sectionId={sectionId} />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {sectionId && (
        <motion.div
          ref={(el) => { if (el) el.style.zIndex = '9999' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed pointer-events-auto"
          style={{
            left: position.x,
            top: position.y,
            width: 320,
            maxHeight: position.maxHeight,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="bg-[#202024] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: position.maxHeight }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
                  {profile.label}
                </span>
                <span className="text-[10px] text-slate-600 font-mono truncate">{nodeType}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                title="Zamknij panel (ESC)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: position.maxHeight - 48 }}>
              {profile.groups.map(renderGroup)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
