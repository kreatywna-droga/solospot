'use client';

/**
 * DesignInspector — Phase 3
 *
 * A full, multi-tab Design Inspector that reads and edits NodeStyles
 * directly via SET_NODE_STYLES / UPDATE_NODE commands.
 *
 * Tabs: Design | Layout | Spacing | Typography | Advanced
 *
 * Architecture (DECISION-043, DECISION-044, DECISION-045):
 *   - Reads node styles from BuilderDocument (SSOT) via useSelectedSection()
 *   - Dispatches SET_NODE_STYLES for style changes
 *   - Dispatches UPDATE_NODE for responsive overrides
 *   - NEVER invokes PlaybackController
 *   - NEVER imports from runtime-core or publish-core
 *
 * @phase Phase 3 — Inspector + Layout Engine
 */

import * as React from 'react';
import {
  Palette, LayoutDashboard, AlignLeft, Type, Settings2,
  AlignCenter, AlignRight, AlignJustify,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ChevronDown,
  StretchHorizontal, Grid3X3, Upload,
} from 'lucide-react';
import type { NodeStyles } from '../../../builder-core/src/BuilderDocument';
import { FontPicker } from './widgets/FontPicker';
import {
  ColorControl,
  GradientControl,
  UnitInput,
  SelectInput,
  NumberInput,
  IconToggleGroup,
  ShadowEditor,
  FourSideEditor,
  SmoothSlider,
  inputCls,
  isGradientCss,
  buildLinearGradient,
  DEFAULT_GRADIENT,
} from './controls';

// ---------------------------------------------------------------------------
// Shared mini-components
// ---------------------------------------------------------------------------

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-white transition-colors"
      >
        {title}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-slate-500 w-20 flex-shrink-0">{label}</span>
    <div className="flex-1">{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Design tab
// ---------------------------------------------------------------------------

function DesignTab({
  styles,
  onChange,
  nodeType,
  sectionId,
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
  nodeType?: string;
  sectionId?: string;
}) {
  const livePreview = (prop: string, value: string) => {
    if (!sectionId) return;
    const el = (
      window.document.querySelector(`[data-node-id="${sectionId}"]`) ??
      window.document.querySelector(`[data-section-id="${sectionId}"]`)
    ) as HTMLElement | null;
    if (el) el.style.setProperty(prop, value, 'important');
  };

  return (
    <>
      {/* Contextual: Image Source section when an Image element is selected */}
      {nodeType === 'image' && (
        <Section title="Zdjęcie / Źródło obrazu">
          <Row label="Adres URL">
            <input
              type="text"
              value={styles.backgroundImage || ''}
              placeholder="https://... URL zdjęcia"
              onChange={(e) => onChange({ backgroundImage: e.target.value })}
              className={inputCls}
            />
          </Row>
          <Row label="Dopasowanie">
            <SelectInput
              value={styles.objectFit}
              onChange={(v) => onChange({ objectFit: v as NodeStyles['objectFit'] })}
              options={[
                { value: 'cover', label: 'Cover (Wypełnij)' },
                { value: 'contain', label: 'Contain (Zmieść w całości)' },
                { value: 'fill', label: 'Fill (Rozciągnij)' },
                { value: 'none', label: 'None (Oryginalny rozmiar)' },
                { value: 'scale-down', label: 'Scale Down' },
              ]}
            />
          </Row>
          <Row label="Pozycja">
            <SelectInput
              value={styles.objectPosition}
              onChange={(v) => onChange({ objectPosition: v })}
              options={[
                { value: 'center', label: 'Środek (Center)' },
                { value: 'top', label: 'Góra (Top)' },
                { value: 'bottom', label: 'Dół (Bottom)' },
                { value: 'left', label: 'Lewo (Left)' },
                { value: 'right', label: 'Prawo (Right)' },
              ]}
            />
          </Row>
        </Section>
      )}

      {/* Contextual: Section Media & Background */}
      {nodeType === 'section' && (
        <Section title="Media i tło sekcji">
          <Row label="Typ tła">
            <SelectInput
              value={styles.videoSrc ? 'video' : isGradientCss(styles.backgroundImage) ? 'gradient' : styles.backgroundImage ? 'image' : 'color'}
              onChange={(v) => {
                if (v === 'color') onChange({ backgroundImage: '', videoSrc: '' });
                else if (v === 'gradient') onChange({
                  videoSrc: '',
                  backgroundImage: isGradientCss(styles.backgroundImage) ? styles.backgroundImage : buildLinearGradient(DEFAULT_GRADIENT),
                });
                else if (v === 'image') {
                  if (isGradientCss(styles.backgroundImage)) onChange({ backgroundImage: '' });
                  if (!styles.backgroundImage) onChange({ backgroundImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809', videoSrc: '' });
                }
                else if (v === 'video' && !styles.videoSrc) onChange({ videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4' });
              }}
              options={[
                { value: 'color', label: 'Kolor / Czysty' },
                { value: 'gradient', label: 'Gradient (Linear)' },
                { value: 'image', label: 'Zdjęcie (Image)' },
                { value: 'video', label: 'Wideo tła (Video MP4)' },
              ]}
            />
          </Row>
          {isGradientCss(styles.backgroundImage) && (
            <Row label="Gradient">
              <GradientControl
                value={styles.backgroundImage}
                onChange={(css) => onChange({ backgroundImage: css })}
              />
            </Row>
          )}
          {styles.videoSrc ? (
            <>
              <Row label="Wideo URL">
                <input
                  type="text"
                  value={styles.videoSrc || ''}
                  placeholder="https://... direct .mp4/.webm URL"
                  onChange={(e) => onChange({ videoSrc: e.target.value })}
                  className={inputCls}
                />
              </Row>
              <Row label="Wyciszone">
                <input
                  type="checkbox"
                  checked={styles.videoMuted ?? true}
                  onChange={(e) => onChange({ videoMuted: e.target.checked })}
                  className="accent-gold-placeholder-500 rounded cursor-pointer"
                />
              </Row>
              <Row label="Autoodtwarzanie">
                <input
                  type="checkbox"
                  checked={styles.videoAutoplay ?? true}
                  onChange={(e) => onChange({ videoAutoplay: e.target.checked })}
                  className="accent-gold-placeholder-500 rounded cursor-pointer"
                />
              </Row>
            </>
          ) : (
            <Row label="Zdjęcie URL">
              <input
                type="text"
                value={styles.backgroundImage || ''}
                placeholder="https://... URL zdjęcia tła"
                onChange={(e) => onChange({ backgroundImage: e.target.value })}
                className={inputCls}
              />
            </Row>
          )}
          <Row label="Kolor nakładki">
<ColorControl 
              value={styles.overlayColor || '#000000'}
              onChange={(v) => onChange({ overlayColor: v })}
            />
          </Row>
          <Row label="Krycie nakładki">
            <UnitInput
              value={`${Math.round((styles.overlayOpacity ?? 0.5) * 100)}%`}
              onChange={(v) => {
                const num = parseFloat(v) || 0;
                onChange({ overlayOpacity: Math.min(1, Math.max(0, num / 100)) });
              }}
              slider
              min={0}
              max={100}
              step={1}
            />
          </Row>
        </Section>
      )}

      <Section title="Size">
        <Row label="Width">
          <UnitInput
            value={styles.width}
            onChange={(v) => onChange({ width: v })}
            onLivePreview={(v) => livePreview('width', v)}
            slider
            min={20}
            max={1600}
            step={1}
          />
        </Row>
        <Row label="Height">
          <UnitInput
            value={styles.height}
            onChange={(v) => onChange({ height: v })}
            onLivePreview={(v) => livePreview('height', v)}
            slider
            min={20}
            max={1200}
            step={1}
          />
        </Row>
        <Row label="Min W">
          <UnitInput
            value={styles.minWidth}
            onChange={(v) => onChange({ minWidth: v })}
            onLivePreview={(v) => livePreview('min-width', v)}
            slider
            min={0}
            max={1600}
            step={1}
          />
        </Row>
        <Row label="Max W">
          <UnitInput
            value={styles.maxWidth}
            onChange={(v) => onChange({ maxWidth: v })}
            onLivePreview={(v) => livePreview('max-width', v)}
            slider
            min={200}
            max={1920}
            step={1}
          />
        </Row>
        <Row label="Min H">
          <UnitInput
            value={styles.minHeight}
            onChange={(v) => onChange({ minHeight: v })}
            onLivePreview={(v) => livePreview('min-height', v)}
            slider
            min={0}
            max={1200}
            step={1}
          />
        </Row>
        <Row label="Max H">
          <UnitInput
            value={styles.maxHeight}
            onChange={(v) => onChange({ maxHeight: v })}
            onLivePreview={(v) => livePreview('max-height', v)}
            slider
            min={100}
            max={1600}
            step={1}
          />
        </Row>
      </Section>

      <Section title="Fill">
        <Row label="Background">
          <ColorControl
            value={styles.backgroundColor}
            onChange={(v) => {
              onChange({ backgroundColor: v });
              livePreview('background-color', v);
            }}
          />
        </Row>
        <Row label="Gradient">
          <GradientControl
            value={isGradientCss(styles.backgroundImage) ? styles.backgroundImage : ''}
            onChange={(css) => {
              onChange({ backgroundImage: css });
              livePreview('background-image', css || 'none');
            }}
          />
        </Row>
        <Row label="Image URL">
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={styles.backgroundImage || ''}
              placeholder="https://... lub plik"
              onChange={(e) => {
                const val = e.target.value;
                onChange({ backgroundImage: val });
                livePreview('background-image', val);
              }}
              className={inputCls}
            />
            <label className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-[#D9A86C] hover:bg-gold-placeholder-500 text-white text-[11px] font-semibold cursor-pointer flex-shrink-0 transition-colors" title="Wgraj obraz z dysku">
              <Upload className="w-3 h-3" />
              <span>Wgraj</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const dataUrl = evt.target?.result as string;
                      if (dataUrl) {
                        const bgVal = `url("${dataUrl}")`;
                        onChange({ backgroundImage: bgVal });
                        livePreview('background-image', bgVal);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {styles.backgroundImage && styles.backgroundImage !== 'none' && (
              <button
                type="button"
                onClick={() => {
                  onChange({ backgroundImage: 'none' });
                  livePreview('background-image', 'none');
                }}
                className="px-1.5 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-mono flex-shrink-0"
                title="Usuń obraz tła"
              >
                ✕
              </button>
            )}
          </div>
        </Row>
        <Row label="Color">
          <ColorControl
            value={styles.color}
            onChange={(v) => {
              onChange({ color: v });
              livePreview('color', v);
            }}
          />
        </Row>
        <Row label="Opacity">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SmoothSlider
                min={0}
                max={1}
                step={0.01}
                value={styles.opacity ?? 1}
                onChange={(n) => onChange({ opacity: n })}
                onLivePreview={(n) => livePreview('opacity', String(n))}
                unit=""
              />
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={Math.round((styles.opacity ?? 1) * 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!Number.isNaN(val)) {
                    onChange({ opacity: Math.min(1, Math.max(0, val / 100)) });
                  }
                }}
                className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-[#D9A86C]/60 font-mono"
              />
              <span className="text-[10px] text-slate-500 ml-1">%</span>
            </div>
          </div>
        </Row>
      </Section>

      <Section title="Border">
        <Row label="Color">
          <ColorControl
            value={styles.borderColor}
            onChange={(v) => {
              onChange({ borderColor: v });
              livePreview('border-color', v);
            }}
          />
        </Row>
        <Row label="Width">
          <UnitInput
            value={styles.borderWidth}
            onChange={(v) => onChange({ borderWidth: v })}
            onLivePreview={(v) => livePreview('border-width', v)}
            slider
            min={0}
            max={30}
            step={1}
          />
        </Row>
        <Row label="Style">
          <SelectInput
            value={styles.borderStyle}
            onChange={(v) => {
              onChange({ borderStyle: v });
              livePreview('border-style', v);
            }}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
              { value: 'none', label: 'None' },
            ]}
          />
        </Row>
        <Row label="Radius">
          <UnitInput
            value={styles.borderRadius}
            onChange={(v) => onChange({ borderRadius: v })}
            onLivePreview={(v) => livePreview('border-radius', v)}
            slider
            min={0}
            max={100}
            step={1}
          />
        </Row>
      </Section>

      <Section title="Shadow">
        <ShadowEditor
          value={styles.boxShadow}
          onChange={(v) => onChange({ boxShadow: v })}
          onLivePreview={(v) => livePreview('box-shadow', v)}
        />
      </Section>

      <Section title="Transformacje (Transform)">
        <Row label="Pozycja X">
          <UnitInput
            value={styles.translateX !== undefined ? String(styles.translateX) : '0px'}
            onChange={(v) => onChange({ translateX: v })}
            slider
            min={-200}
            max={200}
            step={1}
            placeholder="0px"
          />
        </Row>
        <Row label="Pozycja Y">
          <UnitInput
            value={styles.translateY !== undefined ? String(styles.translateY) : '0px'}
            onChange={(v) => onChange({ translateY: v })}
            slider
            min={-200}
            max={200}
            step={1}
            placeholder="0px"
          />
        </Row>
        <Row label="Skala">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SmoothSlider
                min={10}
                max={300}
                step={1}
                value={Math.round((styles.scale ?? 1) * 100)}
                onChange={(n) => onChange({ scale: n / 100 })}
                unit="%"
              />
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min={20}
                max={500}
                value={Math.round((styles.scale ?? 1) * 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!Number.isNaN(val)) onChange({ scale: Math.max(0.1, val / 100) });
                }}
                className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-[#D9A86C]/60 font-mono"
              />
              <span className="text-[10px] text-slate-500 ml-1">%</span>
            </div>
          </div>
        </Row>
        <Row label="Obrót (Rot)">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SmoothSlider
                min={-180}
                max={180}
                step={1}
                value={styles.rotate ?? 0}
                onChange={(n) => onChange({ rotate: Math.round(n) })}
                unit="°"
              />
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min={-360}
                max={360}
                value={styles.rotate ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) onChange({ rotate: val });
                }}
                className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-[#D9A86C]/60 font-mono"
              />
              <span className="text-[10px] text-slate-500 ml-1">°</span>
            </div>
          </div>
        </Row>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layout tab
// ---------------------------------------------------------------------------

function LayoutTab({
  styles,
  onChange,
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
}) {
  return (
    <>
      <Section title="Display">
        <Row label="Display">
          <SelectInput
            value={styles.display}
            onChange={(v) => onChange({ display: v })}
            options={[
              { value: 'block', label: 'Block' },
              { value: 'flex', label: 'Flex' },
              { value: 'grid', label: 'Grid' },
              { value: 'inline-flex', label: 'Inline Flex' },
              { value: 'inline-block', label: 'Inline Block' },
              { value: 'none', label: 'None' },
            ]}
          />
        </Row>
      </Section>

      {(styles.display === 'flex' || styles.display === 'inline-flex') && (
        <Section title="Flexbox">
          <Row label="Direction">
            <IconToggleGroup
              value={styles.flexDirection}
              onChange={(v) => onChange({ flexDirection: v as NodeStyles['flexDirection'] })}
              options={[
                { value: 'row', icon: <StretchHorizontal className="w-3.5 h-3.5" />, title: 'Row' },
                { value: 'column', icon: <Grid3X3 className="w-3.5 h-3.5" />, title: 'Column' },
                { value: 'row-reverse', icon: <StretchHorizontal className="w-3.5 h-3.5 rotate-180" />, title: 'Row Reverse' },
                { value: 'column-reverse', icon: <Grid3X3 className="w-3.5 h-3.5 rotate-180" />, title: 'Column Reverse' },
              ]}
            />
          </Row>
          <Row label="Align">
            <IconToggleGroup
              value={styles.alignItems}
              onChange={(v) => onChange({ alignItems: v })}
              options={[
                { value: 'flex-start', icon: <AlignStartVertical className="w-3.5 h-3.5" />, title: 'Start' },
                { value: 'center', icon: <AlignCenterVertical className="w-3.5 h-3.5" />, title: 'Center' },
                { value: 'flex-end', icon: <AlignEndVertical className="w-3.5 h-3.5" />, title: 'End' },
                { value: 'stretch', icon: <StretchHorizontal className="w-3.5 h-3.5" />, title: 'Stretch' },
              ]}
            />
          </Row>
          <Row label="Justify">
            <SelectInput
              value={styles.justifyContent}
              onChange={(v) => onChange({ justifyContent: v })}
              options={[
                { value: 'flex-start', label: 'Start' },
                { value: 'center', label: 'Center' },
                { value: 'flex-end', label: 'End' },
                { value: 'space-between', label: 'Space Between' },
                { value: 'space-around', label: 'Space Around' },
                { value: 'space-evenly', label: 'Space Evenly' },
              ]}
            />
          </Row>
          <Row label="Gap">
            <UnitInput
              value={styles.gap}
              onChange={(v) => onChange({ gap: v })}
              placeholder="16px"
              slider
              min={0}
              max={200}
              step={1}
            />
          </Row>
        </Section>
      )}

      {styles.display === 'grid' && (
        <Section title="Grid">
          <Row label="Columns">
            <input
              type="text"
              value={styles.gridTemplateColumns || ''}
              placeholder="repeat(3, 1fr)"
              onChange={(e) => onChange({ gridTemplateColumns: e.target.value })}
              className={inputCls}
            />
          </Row>
          <Row label="Rows">
            <input
              type="text"
              value={styles.gridTemplateRows || ''}
              placeholder="auto"
              onChange={(e) => onChange({ gridTemplateRows: e.target.value })}
              className={inputCls}
            />
          </Row>
          <Row label="Gap">
            <UnitInput
              value={styles.gap}
              onChange={(v) => onChange({ gap: v })}
              placeholder="16px"
              slider
              min={0}
              max={120}
              step={2}
            />
          </Row>
          <Row label="Align">
            <SelectInput
              value={styles.alignItems}
              onChange={(v) => onChange({ alignItems: v })}
              options={[
                { value: 'start', label: 'Start' },
                { value: 'center', label: 'Center' },
                { value: 'end', label: 'End' },
                { value: 'stretch', label: 'Stretch' },
              ]}
            />
          </Row>
          <Row label="Justify">
            <SelectInput
              value={styles.justifyContent}
              onChange={(v) => onChange({ justifyContent: v })}
              options={[
                { value: 'start', label: 'Start' },
                { value: 'center', label: 'Center' },
                { value: 'end', label: 'End' },
                { value: 'space-between', label: 'Space Between' },
              ]}
            />
          </Row>
        </Section>
      )}

      <Section title="Position">
        <Row label="Position">
          <SelectInput
            value={styles.position}
            onChange={(v) => onChange({ position: v as NodeStyles['position'] })}
            options={[
              { value: 'static', label: 'Static' },
              { value: 'relative', label: 'Relative' },
              { value: 'absolute', label: 'Absolute' },
              { value: 'fixed', label: 'Fixed' },
              { value: 'sticky', label: 'Sticky' },
            ]}
          />
        </Row>
        <Row label="Z-Index">
          <NumberInput
            value={styles.zIndex}
            onChange={(v) => onChange({ zIndex: v })}
            min={-9999}
            max={9999}
            placeholder="0"
          />
        </Row>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Spacing tab
// ---------------------------------------------------------------------------

function SpacingTab({
  styles,
  onChange,
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
}) {
  return (
    <>
      <Section title="Padding">
        <FourSideEditor
          label="Padding"
          value={
            typeof styles.padding === 'object' && styles.padding !== null
              ? styles.padding
              : typeof styles.padding === 'string'
              ? { top: styles.padding, right: styles.padding, bottom: styles.padding, left: styles.padding }
              : {}
          }
          onChange={(v) => onChange({ padding: v as NodeStyles['padding'] })}
        />
      </Section>
      <Section title="Margin">
        <FourSideEditor
          label="Margin"
          value={
            typeof styles.margin === 'object' && styles.margin !== null
              ? styles.margin
              : typeof styles.margin === 'string'
              ? { top: styles.margin, right: styles.margin, bottom: styles.margin, left: styles.margin }
              : {}
          }
          onChange={(v) => onChange({ margin: v as NodeStyles['margin'] })}
        />
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Typography tab
// ---------------------------------------------------------------------------

function TypographyTab({
  styles,
  onChange,
  sectionId,
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
  sectionId?: string;
}) {
  // Live preview: find the text element and apply style directly during slider drag
  const livePreview = (prop: string, value: string) => {
    if (!sectionId) return;
    const nodeWrapper = window.document.querySelector(`[data-node-id="${sectionId}"]`);
    if (!nodeWrapper) return;
    const textEl = nodeWrapper.querySelector('[data-inline-edit="text"]') as HTMLElement | null;
    if (textEl) textEl.style.setProperty(prop, value, 'important');
  };

  return (
    <>
      <Section title="Font">
        <Row label="Family">
          <FontPicker
            value={styles.fontFamily || 'Inter'}
            onChange={(v) => onChange({ fontFamily: v })}
          />
        </Row>
        <Row label="Size">
          <UnitInput
            value={styles.fontSize}
            onChange={(v) => onChange({ fontSize: v })}
            onLivePreview={(v) => livePreview('font-size', v)}
            placeholder="16px"
            slider
            min={8}
            max={150}
            step={1}
          />
        </Row>
        <Row label="Weight">
          <SelectInput
            value={styles.fontWeight}
            onChange={(v) => onChange({ fontWeight: v })}
            options={[
              { value: '100', label: 'Thin (100)' },
              { value: '200', label: 'ExtraLight (200)' },
              { value: '300', label: 'Light (300)' },
              { value: '400', label: 'Regular (400)' },
              { value: '500', label: 'Medium (500)' },
              { value: '600', label: 'SemiBold (600)' },
              { value: '700', label: 'Bold (700)' },
              { value: '800', label: 'ExtraBold (800)' },
              { value: '900', label: 'Black (900)' },
            ]}
          />
        </Row>
        <Row label="Line H.">
          <UnitInput
            value={styles.lineHeight}
            onChange={(v) => onChange({ lineHeight: v })}
            onLivePreview={(v) => livePreview('line-height', v)}
            placeholder="1.5"
            slider
            min={0.8}
            max={3.0}
            step={0.05}
            defaultUnit=""
          />
        </Row>
        <Row label="Tracking">
          <UnitInput
            value={styles.letterSpacing}
            onChange={(v) => onChange({ letterSpacing: v })}
            onLivePreview={(v) => livePreview('letter-spacing', v)}
            placeholder="0px"
            slider
            min={-2}
            max={12}
            step={0.5}
          />
        </Row>
      </Section>

      <Section title="Alignment">
        <Row label="Text Align">
          <IconToggleGroup<'left' | 'center' | 'right' | 'justify'>
            value={styles.textAlign}
            onChange={(v) => onChange({ textAlign: v })}
            options={[
              { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" />, title: 'Left' },
              { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />, title: 'Center' },
              { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" />, title: 'Right' },
              { value: 'justify', icon: <AlignJustify className="w-3.5 h-3.5" />, title: 'Justify' },
            ]}
          />
        </Row>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Advanced tab
// ---------------------------------------------------------------------------

function AdvancedTab({
  styles,
  onChange,
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
}) {
  return (
    <>
      <Section title="Custom CSS">
        <textarea
          value={styles.customCss || ''}
          onChange={(e) => onChange({ customCss: e.target.value })}
          placeholder={'/* custom CSS for this element */\ncolor: red;\nfont-size: 18px;'}
          rows={6}
          className="w-full bg-[#0e0e1a] border border-white/10 rounded px-2 py-1.5 text-[11px] text-green-300 font-mono focus:outline-none focus:border-gold-placeholder-500/60 resize-none"
          spellCheck={false}
        />
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// DesignInspector — public API
// ---------------------------------------------------------------------------

export type DesignTab = 'design' | 'layout' | 'spacing' | 'typography' | 'advanced';

export interface DesignInspectorProps {
  /** The current NodeStyles of the selected node */
  styles: NodeStyles;
  /** Called when user changes any style property */
  onStyleChange: (patch: Partial<NodeStyles>) => void;
  /** Node label for the header */
  nodeLabel?: string;
  /** Node type for the header */
  nodeType?: string;
  /** Selected node ID for live DOM preview during slider drag */
  sectionId?: string;
}

const TABS: { id: DesignTab; label: string; icon: React.ReactNode }[] = [
  { id: 'design', label: 'Design', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'layout', label: 'Layout', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'spacing', label: 'Spacing', icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { id: 'typography', label: 'Type', icon: <Type className="w-3.5 h-3.5" /> },
  { id: 'advanced', label: 'CSS', icon: <Settings2 className="w-3.5 h-3.5" /> },
];

export const DesignInspector: React.FC<DesignInspectorProps> = ({
  styles,
  onStyleChange,
  nodeLabel,
  nodeType,
  sectionId,
}) => {
  const getInitialTab = (type?: string): DesignTab => {
    if (type === 'heading' || type === 'text') return 'typography';
    if (type === 'container') return 'layout';
    return 'design';
  };

  const [activeTab, setActiveTab] = React.useState<DesignTab>(() => getInitialTab(nodeType));

  React.useEffect(() => {
    if (nodeType) {
      setActiveTab(getInitialTab(nodeType));
    }
  }, [nodeType]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      {(nodeLabel || nodeType) && (
        <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
          {nodeLabel && (
            <h4 className="text-[11px] font-bold text-white truncate uppercase tracking-wider">
              {nodeLabel}
            </h4>
          )}
          {nodeType && (
            <span className="text-[10px] text-slate-600 font-mono">{nodeType}</span>
          )}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex border-b border-white/5 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors min-w-0 border-b-2 ${
              activeTab === tab.id
                ? 'text-gold-placeholder-300 border-gold-placeholder-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'design' && (
          <DesignTab styles={styles} onChange={onStyleChange} nodeType={nodeType} sectionId={sectionId} />
        )}
        {activeTab === 'layout' && (
          <LayoutTab styles={styles} onChange={onStyleChange} />
        )}
        {activeTab === 'spacing' && (
          <SpacingTab styles={styles} onChange={onStyleChange} />
        )}
        {activeTab === 'typography' && (
          <TypographyTab styles={styles} onChange={onStyleChange} sectionId={sectionId} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab styles={styles} onChange={onStyleChange} />
        )}
      </div>
    </div>
  );
};

export default DesignInspector;
