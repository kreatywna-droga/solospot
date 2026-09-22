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
import {
  ColorControl,
  GradientControl,
  UnitInput,
  SelectInput,
  IconToggleGroup,
  ShadowEditor,
  FourSideEditor,
  SmoothSlider,
  inputCls,
  isGradientCss,
  buildLinearGradient,
  DEFAULT_GRADIENT,
} from '../../../../packages/authoring-studio/src/inspector/controls'

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
// Shared CSS classes — canonical control system (see inspector/controls)
// ---------------------------------------------------------------------------

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
              value={styles.videoSrc ? 'video' : isGradientCss(styles.backgroundImage) ? 'gradient' : styles.backgroundImage ? 'image' : 'color'}
              onChange={(v) => {
                if (v === 'color') onStyleChange({ backgroundImage: '', videoSrc: '' })
                else if (v === 'image') {
                  if (isGradientCss(styles.backgroundImage)) onStyleChange({ backgroundImage: '' })
                  setMediaTarget('BACKGROUND_IMAGE'); setShowMediaPicker(true)
                }
                else if (v === 'video') onStyleChange({ videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4', backgroundImage: '' })
                else if (v === 'gradient') onStyleChange({
                  videoSrc: '',
                  backgroundImage: isGradientCss(styles.backgroundImage) ? styles.backgroundImage : buildLinearGradient(DEFAULT_GRADIENT),
                })
              }}
              options={[
                { value: 'color', label: 'Kolor' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'image', label: 'Obraz tła' },
                { value: 'video', label: 'Wideo tła' },
              ]}
            />
          </Row>
          {isGradientCss(styles.backgroundImage) && (
            <Row label="Gradient">
              <GradientControl
                value={styles.backgroundImage}
                onChange={(css) => onStyleChange({ backgroundImage: css })}
              />
            </Row>
          )}
          <Row label="Kolor">
            <ColorControl value={styles.backgroundColor} onChange={(v) => onStyleChange({ backgroundColor: v })} />
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
            <ColorControl value={styles.overlayColor || '#000000'} onChange={(v) => onStyleChange({ overlayColor: v })} />
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
        <ColorControl value={styles.color} onChange={(v) => onStyleChange({ color: v })} />
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
        <ColorControl value={styles.backgroundColor} onChange={(v) => { onStyleChange({ backgroundColor: v }); livePreview('background-color', v) }} />
      </Row>
      <Row label="Gradient">
        <GradientControl
          value={isGradientCss(styles.backgroundImage) ? styles.backgroundImage : ''}
          onChange={(css) => {
            onStyleChange({ backgroundImage: css })
            if (css) livePreview('background-image', css)
            else livePreview('background-image', 'none')
          }}
        />
      </Row>
      <Row label="Color">
        <ColorControl value={styles.color} onChange={(v) => { onStyleChange({ color: v }); livePreview('color', v) }} />
      </Row>
      <Row label="Opacity">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SmoothSlider min={0} max={1} step={0.01} value={styles.opacity ?? 1}
              onChange={(n) => onStyleChange({ opacity: n })} unit="" />
          </div>
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
        <ColorControl value={styles.borderColor} onChange={(v) => { onStyleChange({ borderColor: v }); livePreview('border-color', v) }} />
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
          <div className="flex-1">
            <SmoothSlider min={0} max={1} step={0.01} value={styles.opacity ?? 1}
              onChange={(n) => onStyleChange({ opacity: n })} unit="" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{Math.round((styles.opacity ?? 1) * 100)}%</span>
        </div>
      </Row>
      <Row label="Skala">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SmoothSlider min={10} max={300} step={1} value={Math.round((styles.scale ?? 1) * 100)}
              onChange={(n) => onStyleChange({ scale: n / 100 })} unit="%" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{Math.round((styles.scale ?? 1) * 100)}%</span>
        </div>
      </Row>
      <Row label="Obrót">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SmoothSlider min={-180} max={180} step={1} value={styles.rotate ?? 0}
              onChange={(n) => onStyleChange({ rotate: Math.round(n) })} unit="°" />
          </div>
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
          <div className="bg-[#18181B] border border-[#44444B] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: position.maxHeight }}>
            {/* Header — same surface system as the Inspector (panel #202024 on shell #18181B) */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#3A3A40] bg-[#202024] flex-shrink-0">
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
