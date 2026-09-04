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
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [unit, setUnit] = React.useState('px');
  const numVal = value ? value.replace(/[^0-9.-]/g, '') : '';

  const commit = (num: string, u: string) => onChange(num ? `${num}${u}` : '');

  return (
    <div className="flex">
      <input
        type="number"
        value={numVal}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value, unit)}
        className={unitInputCls}
      />
      <select
        value={unit}
        onChange={(e) => {
          setUnit(e.target.value);
          commit(numVal, e.target.value);
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
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded border border-white/20 flex-shrink-0 cursor-pointer relative overflow-hidden"
        style={{ background: value || 'transparent' }}
      >
        <input
          type="color"
          value={value?.startsWith('#') ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <input
        type="text"
        value={value || ''}
        placeholder="#ffffff or rgba(…)"
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-500">{label}</span>
        <button
          onClick={() => setLinked((v) => !v)}
          className={`p-0.5 rounded text-[10px] transition-colors ${
            linked
              ? 'text-violet-400 bg-violet-500/10'
              : 'text-slate-600 hover:text-white'
          }`}
          title={linked ? 'Unlink sides' : 'Link all sides'}
        >
          <Lock className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {sides.map(({ key, short }) => (
          <div key={key} className="relative">
            <input
              type="text"
              value={parsed[key] || ''}
              placeholder="0"
              onChange={(e) => handleSide(key, e.target.value)}
              className="w-full bg-[#0e0e1a] border border-white/10 rounded px-1 py-1 text-[11px] text-white text-center focus:outline-none focus:border-violet-500/60"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-600 uppercase">
              {short}
            </span>
          </div>
        ))}
      </div>
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
}: {
  styles: NodeStyles;
  onChange: (patch: Partial<NodeStyles>) => void;
}) {
  return (
    <>
      <Section title="Size">
        <Row label="Width">
          <UnitInput
            value={styles.width}
            onChange={(v) => onChange({ width: v })}
          />
        </Row>
        <Row label="Height">
          <UnitInput
            value={styles.height}
            onChange={(v) => onChange({ height: v })}
          />
        </Row>
        <Row label="Min W">
          <UnitInput
            value={styles.minWidth}
            onChange={(v) => onChange({ minWidth: v })}
          />
        </Row>
        <Row label="Max W">
          <UnitInput
            value={styles.maxWidth}
            onChange={(v) => onChange({ maxWidth: v })}
          />
        </Row>
        <Row label="Min H">
          <UnitInput
            value={styles.minHeight}
            onChange={(v) => onChange({ minHeight: v })}
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
              className="flex-1 accent-violet-500"
            />
            <span className="text-[11px] text-slate-400 w-10 text-right">
              {Math.round((styles.opacity ?? 1) * 100)}%
            </span>
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
        <Row label="Size">
          <UnitInput
            value={styles.fontSize}
            onChange={(v) => onChange({ fontSize: v })}
            placeholder="16px"
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
          />
        </Row>
        <Row label="Tracking">
          <UnitInput
            value={styles.letterSpacing}
            onChange={(v) => onChange({ letterSpacing: v })}
            placeholder="0em"
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
  const [activeTab, setActiveTab] = React.useState<DesignTab>('design');

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
          <DesignTab styles={styles} onChange={onStyleChange} />
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
