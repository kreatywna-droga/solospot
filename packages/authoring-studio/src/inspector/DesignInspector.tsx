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
  ChevronDown, Lock, Eye, EyeOff,
  StretchHorizontal, Grid3X3,
} from 'lucide-react';
import type { NodeStyles } from '../../../builder-core/src/BuilderDocument';
import { FontPicker } from './widgets/FontPicker';

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

const inputCls =
  'w-full bg-[#0e0e1a] border border-white/10 rounded px-2 py-1 text-[12px] text-white focus:outline-none focus:border-violet-500/60 transition-colors';

const unitInputCls =
  'w-full bg-[#0e0e1a] border border-white/10 rounded-l px-2 py-1 text-[12px] text-white focus:outline-none focus:border-violet-500/60 transition-colors';

function UnitInput({
  value,
  onChange,
  placeholder = '0',
  min,
  max,
  step,
  slider,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** When provided, renders a slider + numeric input pair sharing the same value */
  slider?: boolean;
}) {
  const match = value ? String(value).match(/^([+-]?(?:\d*\.)?\d+)([a-zA-Z%]*)$/) : null;
  const numVal = match ? parseFloat(match[1]) : (value ? parseFloat(String(value).replace(/[^0-9.-]/g, '')) : NaN);
  const detectedUnit = match && match[2] ? match[2] : 'px';
  const hasNum = !Number.isNaN(numVal);

  const [unit, setUnit] = React.useState(detectedUnit);

  React.useEffect(() => {
    if (match && match[2] && match[2] !== unit) {
      setUnit(match[2]);
    }
  }, [value]);

  const commit = (num: string, u: string) => onChange(num ? `${num}${u}` : '');

  const commitNumber = (n: number, u: string) =>
    onChange(`${Math.round(n * 100) / 100}${u}`);

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
          onChange={(e) => {
            const nextUnit = e.target.value;
            setUnit(nextUnit);
            commit(hasNum ? String(numVal) : '', nextUnit);
          }}
          className="bg-[#0e0e1a] border border-l-0 border-white/10 rounded-r text-[11px] text-slate-400 px-1 focus:outline-none"
        >
          <option>px</option>
          <option>%</option>
          <option>rem</option>
          <option>em</option>
          <option>vw</option>
          <option>vh</option>
          <option>fr</option>
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
          onChange={(e) => commitNumber(parseFloat(e.target.value), unit)}
          className="w-full accent-violet-500 h-1"
        />
      )}
    </div>
  );
}

const COLOR_PRESETS = [
  { label: 'Przezroczysty', value: 'transparent' },
  { label: 'Biały', value: '#ffffff' },
  { label: 'Czarny', value: '#000000' },
  { label: 'Ciemny', value: '#0a0a14' },
  { label: 'Fiolet', value: '#7c3aed' },
  { label: 'Róż', value: '#ec4899' },
  { label: 'Niebieski', value: '#3b82f6' },
  { label: 'Szmaragd', value: '#10b981' },
  { label: 'Bursztyn', value: '#f59e0b' },
  { label: 'Szary', value: '#64748b' },
];

function ColorInput({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const hexVal = React.useMemo(() => {
    if (!value || value === 'transparent') return '#ffffff';
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    return '#ffffff';
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5">
        <div
          className="w-7 h-7 rounded-lg border border-white/20 flex-shrink-0 cursor-pointer relative overflow-hidden shadow-inner"
          style={{ background: value || 'transparent' }}
          title="Kliknij, aby otworzyć próbnik kolorów"
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
              value === preset.value ? 'ring-1 ring-violet-400 border-white' : 'border-white/20'
            }`}
            style={{
              backgroundColor: preset.value === 'transparent' ? '#1a1a24' : preset.value,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} cursor-pointer`}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}: {
  value?: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={inputCls}
    />
  );
}

// ---------------------------------------------------------------------------
// 4-side Spacing editor (Padding / Margin)
// ---------------------------------------------------------------------------

type FourSide = { top?: string; right?: string; bottom?: string; left?: string };

function FourSideEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: FourSide | string;
  onChange: (v: FourSide) => void;
}) {
  const [linked, setLinked] = React.useState(true);

  const parsed: FourSide =
    value && typeof value === 'object'
      ? (value as FourSide)
      : typeof value === 'string'
      ? { top: value, right: value, bottom: value, left: value }
      : {};

  const handleSide = (side: keyof FourSide, v: string) => {
    if (linked) {
      onChange({ top: v, right: v, bottom: v, left: v });
    } else {
      onChange({ ...parsed, [side]: v });
    }
  };

  const sides: { key: keyof FourSide; short: string }[] = [
    { key: 'top', short: 'T' },
    { key: 'right', short: 'R' },
    { key: 'bottom', short: 'B' },
    { key: 'left', short: 'L' },
  ];

  const masterVal = parseInt(parsed.top || '0', 10) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setLinked((v) => !v)}
          className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 transition-colors ${
            linked
              ? 'text-violet-400 bg-violet-500/20 border border-violet-500/30'
              : 'text-slate-500 hover:text-white bg-white/5'
          }`}
          title={linked ? 'Rozłącz boki (edytuj każdy osobno)' : 'Połącz wszystkie boki'}
        >
          <Lock className="w-3 h-3" />
          <span className="text-[9px]">{linked ? 'Połączone' : 'Osobno'}</span>
        </button>
      </div>

      {linked ? (
        <div className="flex items-center gap-2 bg-[#0a0a14] p-2 rounded-lg border border-white/5">
          <input
            type="range"
            min={0}
            max={120}
            step={1}
            value={masterVal}
            onChange={(e) => {
              const v = `${e.target.value}px`;
              onChange({ top: v, right: v, bottom: v, left: v });
            }}
            className="flex-1 accent-violet-500 h-1 cursor-pointer"
          />
          <div className="flex items-center">
            <input
              type="number"
              min={0}
              max={999}
              value={masterVal}
              onChange={(e) => {
                const v = `${e.target.value || '0'}px`;
                onChange({ top: v, right: v, bottom: v, left: v });
              }}
              className="w-12 bg-[#0e0e1a] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-violet-500/60 font-mono"
            />
            <span className="text-[10px] text-slate-500 ml-1">px</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 bg-[#0a0a14] p-2 rounded-lg border border-white/5">
          {sides.map(({ key, short }) => {
            const sideVal = parseInt(parsed[key] || '0', 10) || 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-bold text-slate-400 uppercase">{short}:</span>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={1}
                  value={sideVal}
                  onChange={(e) => handleSide(key, `${e.target.value}px`)}
                  className="flex-1 accent-violet-500 h-1 cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={sideVal}
                  onChange={(e) => handleSide(key, `${e.target.value || '0'}px`)}
                  className="w-12 bg-[#0e0e1a] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-violet-500/60 font-mono"
                />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon toggle group
// ---------------------------------------------------------------------------

function IconToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value?: T;
  onChange: (v: T) => void;
  options: { value: T; icon: React.ReactNode; title: string }[];
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
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
              : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design tab
// ---------------------------------------------------------------------------

function DesignTab({
  styles,
  onChange,
  nodeType,
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
  nodeType?: string;
}) {
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
              value={styles.videoSrc ? 'video' : styles.backgroundImage ? 'image' : 'color'}
              onChange={(v) => {
                if (v === 'color') onChange({ backgroundImage: '', videoSrc: '' });
                else if (v === 'image' && !styles.backgroundImage) onChange({ backgroundImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809', videoSrc: '' });
                else if (v === 'video' && !styles.videoSrc) onChange({ videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4' });
              }}
              options={[
                { value: 'color', label: 'Kolor / Czysty' },
                { value: 'image', label: 'Zdjęcie (Image)' },
                { value: 'video', label: 'Wideo tła (Video MP4)' },
              ]}
            />
          </Row>
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
                  className="accent-violet-500 rounded cursor-pointer"
                />
              </Row>
              <Row label="Autoodtwarzanie">
                <input
                  type="checkbox"
                  checked={styles.videoAutoplay ?? true}
                  onChange={(e) => onChange({ videoAutoplay: e.target.checked })}
                  className="accent-violet-500 rounded cursor-pointer"
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
            <ColorInput
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
            slider
            min={100}
            max={1600}
            step={1}
          />
        </Row>
      </Section>

      <Section title="Fill">
        <Row label="Background">
          <ColorInput
            value={styles.backgroundColor}
            onChange={(v) => onChange({ backgroundColor: v })}
          />
        </Row>
        <Row label="Image URL">
          <input
            type="text"
            value={styles.backgroundImage || ''}
            placeholder="https://... or url('...')"
            onChange={(e) => onChange({ backgroundImage: e.target.value })}
            className={inputCls}
          />
        </Row>
        <Row label="Color">
          <ColorInput
            value={styles.color}
            onChange={(v) => onChange({ color: v })}
          />
        </Row>
        <Row label="Opacity">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={styles.opacity ?? 1}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="flex-1 accent-violet-500 h-1 cursor-pointer"
            />
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
                className="w-12 bg-[#0e0e1a] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-violet-500/60 font-mono"
              />
              <span className="text-[10px] text-slate-500 ml-1">%</span>
            </div>
          </div>
        </Row>
      </Section>

      <Section title="Border">
        <Row label="Color">
          <ColorInput
            value={styles.borderColor}
            onChange={(v) => onChange({ borderColor: v })}
          />
        </Row>
        <Row label="Width">
          <UnitInput
            value={styles.borderWidth}
            onChange={(v) => onChange({ borderWidth: v })}
            slider
            min={0}
            max={30}
            step={1}
          />
        </Row>
        <Row label="Style">
          <SelectInput
            value={styles.borderStyle}
            onChange={(v) => onChange({ borderStyle: v })}
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
            slider
            min={0}
            max={100}
            step={1}
          />
        </Row>
      </Section>

      <Section title="Shadow">
        <Row label="Box Shadow">
          <input
            type="text"
            value={styles.boxShadow || ''}
            placeholder="0 4px 24px rgba(0,0,0,0.3)"
            onChange={(e) => onChange({ boxShadow: e.target.value })}
            className={inputCls}
          />
        </Row>
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
            <input
              type="range"
              min={10}
              max={300}
              step={1}
              value={Math.round((styles.scale ?? 1) * 100)}
              onChange={(e) => onChange({ scale: parseFloat(e.target.value) / 100 })}
              className="flex-1 accent-violet-500 h-1 cursor-pointer"
            />
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
                className="w-12 bg-[#0e0e1a] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-violet-500/60 font-mono"
              />
              <span className="text-[10px] text-slate-500 ml-1">%</span>
            </div>
          </div>
        </Row>
        <Row label="Obrót (Rot)">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={styles.rotate ?? 0}
              onChange={(e) => onChange({ rotate: parseInt(e.target.value, 10) })}
              className="flex-1 accent-violet-500 h-1 cursor-pointer"
            />
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
                className="w-12 bg-[#0e0e1a] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-violet-500/60 font-mono"
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
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
}) {
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
            placeholder="1.5"
            slider
            min={0.8}
            max={3.0}
            step={0.05}
          />
        </Row>
        <Row label="Tracking">
          <UnitInput
            value={styles.letterSpacing}
            onChange={(v) => onChange({ letterSpacing: v })}
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
          className="w-full bg-[#0e0e1a] border border-white/10 rounded px-2 py-1.5 text-[11px] text-green-300 font-mono focus:outline-none focus:border-violet-500/60 resize-none"
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
                ? 'text-violet-300 border-violet-500'
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
          <DesignTab styles={styles} onChange={onStyleChange} nodeType={nodeType} />
        )}
        {activeTab === 'layout' && (
          <LayoutTab styles={styles} onChange={onStyleChange} />
        )}
        {activeTab === 'spacing' && (
          <SpacingTab styles={styles} onChange={onStyleChange} />
        )}
        {activeTab === 'typography' && (
          <TypographyTab styles={styles} onChange={onStyleChange} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab styles={styles} onChange={onStyleChange} />
        )}
      </div>
    </div>
  );
};

export default DesignInspector;
