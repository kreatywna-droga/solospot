'use client';

/**
 * PhaseThreeInspector — Simple-First Progressive Inspector
 *
 * Product Philosophy:
 *   SIMPLE FIRST. POWER SECOND.
 *
 * Default View (Simple Mode):
 *   Only 3-5 essential, intuitive visual controls tailored to the selected element.
 *   No CSS jargon or overwhelming wall of sliders.
 *
 * Advanced View:
 *   Collapsible accordion "Zaawansowane ustawienia (Advanced) ▼" revealing the
 *   complete professional DesignInspector (exact numeric transforms, scale,
 *   rotation, 4-side padding/margin, borders, shadows, z-index, custom CSS).
 *
 * Architecture (DECISION-043, DECISION-044, DECISION-045):
 *   - Reads selected node from BuilderDocument (SSOT) via useSelectedSection()
 *   - Dispatches SET_NODE_STYLES / UPDATE_PROPS
 *   - Inspector NEVER invokes PlaybackController
 */

import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import {
  Type, Image as ImageIcon, Sparkles, Sliders, ChevronDown, ChevronUp,
  FileText, AlignLeft, AlignCenter, AlignRight, ExternalLink,
  Layers, Palette, Video, Upload, Check, Move,
} from 'lucide-react';
import { useBuilder, useSelectedSection } from '../state/BuilderProvider';
import { DesignInspector } from '../../../../packages/authoring-studio/src/inspector/DesignInspector';
import { InspectorSync } from './InspectorSync';
import { InspectorShell } from '../../../../packages/authoring-studio/src/inspector/InspectorShell';
import { EmptyInspectorState } from '../../../../packages/authoring-studio/src/inspector/EmptyInspectorState';
import { InspectorRuntime } from '../../../../packages/builder-core/src/InspectorRuntime';
import { FontPicker } from '../../../../packages/authoring-studio/src/inspector/widgets/FontPicker';
import { MediaPickerModal } from '../sidebar/MediaPickerModal';
import { SmoothSlider } from './SmoothSlider';
import type { InspectorCategory } from '../../../../packages/builder-core/src/InspectorRuntime';
import type { NodeStyles, NodeResponsive } from '../../../../packages/builder-core/src/BuilderDocument';

export interface PhaseThreeInspectorProps {
  sectionId: string | null;
  onPropChange: (key: string, value: unknown) => void;
  onStyleChange: (patch: Partial<NodeStyles>) => void;
}

function viewportToBreakpoint(label: string): 'desktop' | 'tablet' | 'mobile' {
  if (label === 'TABLET') return 'tablet';
  if (label === 'MOBILE') return 'mobile';
  return 'desktop';
}

export const PhaseThreeInspector: React.FC<PhaseThreeInspectorProps> = ({
  sectionId,
  onPropChange,
  onStyleChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  /** Which property the media picker writes to */
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'image' | 'section-bg' | 'video-bg'>('image');
  const selectedNode = useSelectedSection();
  const { canvas, document: builderDoc } = useBuilder();

  // Label refs — updated in-place during slider drag (no re-render)
  const fontSizeLabelRef = useRef<HTMLSpanElement>(null);
  const imgWidthLabelRef = useRef<HTMLSpanElement>(null);
  const imgHeightLabelRef = useRef<HTMLSpanElement>(null);
  const vidWidthLabelRef = useRef<HTMLSpanElement>(null);
  const vidHeightLabelRef = useRef<HTMLSpanElement>(null);
  const btnWidthLabelRef = useRef<HTMLSpanElement>(null);
  const btnHeightLabelRef = useRef<HTMLSpanElement>(null);
  const svgSizeLabelRef = useRef<HTMLSpanElement>(null);
  const txLabelRef = useRef<HTMLSpanElement>(null);
  const tyLabelRef = useRef<HTMLSpanElement>(null);

  // Helper: get canvas DOM element for the selected node for live preview
  const getCanvasEl = useCallback((): HTMLElement | null => {
    if (!sectionId) return null;
    return (
      document.querySelector(`[data-section-id="${sectionId}"]`) ??
      document.querySelector(`[data-node-id="${sectionId}"]`)
    ) as HTMLElement | null;
  }, [sectionId]);

  if (!sectionId || !selectedNode) {
    return <EmptyInspectorState />;
  }

  const activeBreakpoint = viewportToBreakpoint(canvas.viewport.label);
  const currentStyles: NodeStyles =
    activeBreakpoint === 'desktop'
      ? (selectedNode.styles ?? {})
      : { ...(selectedNode.styles ?? {}), ...((selectedNode.responsive as NodeResponsive | undefined)?.[activeBreakpoint] ?? {}) };

  const nodeLabel = selectedNode.label ?? selectedNode.type;
  const nodeType = selectedNode.type;
  const props = selectedNode.props ?? {};

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#07070f] text-white select-none">
      {/* Element Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#090914] flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white truncate">{nodeLabel}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 uppercase">
              {nodeType}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Szybka edycja wizualna</p>
        </div>
      </div>

      {/* Main Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: TEXT / HEADING                                */}
        {/* ============================================================= */}
        {(nodeType === 'text' || nodeType === 'heading') && (
          <div className="space-y-4">
            {/* Direct Text Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Treść tekstu</label>
              <textarea
                value={String(props.text ?? '')}
                onChange={(e) => onPropChange('text', e.target.value)}
                placeholder="Wpisz treść tekstu..."
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Czcionka (Google Fonts)</label>
              <FontPicker
                value={currentStyles.fontFamily || 'Inter'}
                onChange={(font) => onStyleChange({ fontFamily: font })}
              />
            </div>

            {/* Font Size — Exact Input + SmoothSlider (zero re-render during drag) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Rozmiar tekstu</span>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                  <span ref={fontSizeLabelRef} className="w-10 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.fontSize || '16px').replace('px', '')) || 16}
                  </span>
                  <span className="text-slate-400 text-[10px]">px</span>
                </div>
              </div>
              <SmoothSlider
                min={8}
                max={150}
                value={parseInt(String(currentStyles.fontSize || '16px').replace('px', '')) || 16}
                labelRef={fontSizeLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.fontSize = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ fontSize: `${v}px` })}
              />
              {/* Quick Jumps */}
              <div className="flex items-center gap-1">
                {[16, 24, 36, 48, 64].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onStyleChange({ fontSize: `${sz}px` })}
                    className={`flex-1 py-0.5 text-[9px] font-mono rounded border transition-all ${
                      (parseInt(String(currentStyles.fontSize || '16px').replace('px', '')) || 16) === sz
                        ? 'bg-violet-600/30 text-violet-300 border-violet-500/50'
                        : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Color & Alignment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Kolor tekstu</label>
                <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <input
                    type="color"
                    value={currentStyles.color || '#ffffff'}
                    onChange={(e) => onStyleChange({ color: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={currentStyles.color || '#ffffff'}
                    onChange={(e) => onStyleChange({ color: e.target.value })}
                    placeholder="#ffffff"
                    className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none focus:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Wyrównanie</label>
                <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
                  <button
                    onClick={() => onStyleChange({ textAlign: 'left' })}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      currentStyles.textAlign === 'left' || !currentStyles.textAlign ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onStyleChange({ textAlign: 'center' })}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      currentStyles.textAlign === 'center' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onStyleChange({ textAlign: 'right' })}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      currentStyles.textAlign === 'right' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: IMAGE                                         */}
        {/* ============================================================= */}
        {nodeType === 'image' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300">Zdjęcie</label>
              <button
                onClick={() => { setMediaPickerTarget('image'); setShowMediaPicker(true); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-xs text-white transition-all shadow-md shadow-violet-600/20"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Wybierz lub wgraj nowe zdjęcie</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Adres URL grafiki</label>
              <input
                type="text"
                value={String(props.src ?? '')}
                onChange={(e) => onPropChange('src', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Dopasowanie (Object Fit)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onStyleChange({ objectFit: 'cover' })}
                  className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    currentStyles.objectFit === 'cover' || !currentStyles.objectFit
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  Wypełnij (Cover)
                </button>
                <button
                  onClick={() => onStyleChange({ objectFit: 'contain' })}
                  className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    currentStyles.objectFit === 'contain'
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  Dopasuj (Contain)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Zaokrąglenie narożników</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Proste', val: '0px' },
                  { label: '8px', val: '8px' },
                  { label: '16px', val: '16px' },
                  { label: 'Pełne', val: '9999px' },
                ].map((r) => (
                  <button
                    key={r.val}
                    onClick={() => onStyleChange({ borderRadius: r.val })}
                    className={`py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      currentStyles.borderRadius === r.val
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Width & Height — SmoothSlider */}
            <div className="space-y-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Szerokość obrazu</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={imgWidthLabelRef} className="w-12 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.width || '400px').replace('px', '')) || 400}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={20}
                max={1400}
                value={parseInt(String(currentStyles.width || '400px').replace('px', '')) || 400}
                labelRef={imgWidthLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.width = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ width: `${v}px` })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Wysokość obrazu</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={imgHeightLabelRef} className="w-12 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.height || '260px').replace('px', '')) || 260}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={20}
                max={1200}
                value={parseInt(String(currentStyles.height || '260px').replace('px', '')) || 260}
                labelRef={imgHeightLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.height = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ height: `${v}px` })}
              />
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: BUTTON                                        */}
        {/* ============================================================= */}
        {nodeType === 'button' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Tekst na przycisku</label>
              <input
                type="text"
                value={String(props.text ?? '')}
                onChange={(e) => onPropChange('text', e.target.value)}
                placeholder="np. Kup Teraz, Zarejestruj się"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Link docelowy (URL)</label>
              <div className="relative">
                <ExternalLink className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={String(props.href ?? '')}
                  onChange={(e) => onPropChange('href', e.target.value)}
                  placeholder="https://... lub #kontakt"
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Kolor tła</label>
                <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <input
                    type="color"
                    value={currentStyles.backgroundColor || '#7c3aed'}
                    onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={currentStyles.backgroundColor || '#7c3aed'}
                    onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
                    placeholder="#7c3aed"
                    className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none focus:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Kolor tekstu</label>
                <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <input
                    type="color"
                    value={currentStyles.color || '#ffffff'}
                    onChange={(e) => onStyleChange({ color: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={currentStyles.color || '#ffffff'}
                    onChange={(e) => onStyleChange({ color: e.target.value })}
                    placeholder="#ffffff"
                    className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none focus:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Button Width & Height — SmoothSlider */}
            <div className="space-y-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Szerokość przycisku</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={btnWidthLabelRef} className="w-12 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.width || '180px').replace('px', '')) || 180}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={60}
                max={800}
                value={parseInt(String(currentStyles.width || '180px').replace('px', '')) || 180}
                labelRef={btnWidthLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.width = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ width: `${v}px` })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Wysokość przycisku</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={btnHeightLabelRef} className="w-12 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.height || '44px').replace('px', '')) || 44}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={24}
                max={120}
                value={parseInt(String(currentStyles.height || '44px').replace('px', '')) || 44}
                labelRef={btnHeightLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.height = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ height: `${v}px` })}
              />
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: SECTION                                       */}
        {/* ============================================================= */}
        {nodeType === 'section' && (() => {
          const bgType: 'color' | 'image' | 'video' =
            props.backgroundVideo ? 'video'
            : currentStyles.backgroundImage && currentStyles.backgroundImage !== 'none' ? 'image'
            : 'color';

          return (
            <div className="space-y-4">
              {/* ---- Background type tabs: Kolor | Zdjęcie | Wideo ---- */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300">Tło sekcji</label>
                <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
                  {(['color', 'image', 'video'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        if (tab === 'color') {
                          onStyleChange({ backgroundImage: 'none' });
                          onPropChange('backgroundVideo', '');
                        } else if (tab === 'image') {
                          onPropChange('backgroundVideo', '');
                        } else {
                          onStyleChange({ backgroundImage: 'none' });
                        }
                      }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                        bgType === tab
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === 'color' ? '🎨 Kolor' : tab === 'image' ? '🖼 Zdjęcie' : '🎬 Wideo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---- Solid colour ---- */}
              {bgType === 'color' && (
                <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-xl">
                  <input
                    type="color"
                    value={currentStyles.backgroundColor || '#06060c'}
                    onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white mb-0.5">Kolor tła</div>
                    <input
                      type="text"
                      value={currentStyles.backgroundColor || '#06060c'}
                      onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
                      placeholder="#06060c"
                      className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none focus:text-white"
                    />
                  </div>
                </div>
              )}

              {/* ---- Background image (upload / library / URL) ---- */}
              {bgType === 'image' && (
                <div className="space-y-3">
                  <button
                    onClick={() => { setMediaPickerTarget('section-bg'); setShowMediaPicker(true); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-xs text-white transition-all shadow-md shadow-violet-600/20"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Wybierz lub wgraj zdjęcie tła</span>
                  </button>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">URL zdjęcia</label>
                    <input
                      type="text"
                      value={(() => {
                        const bg = currentStyles.backgroundImage || '';
                        const m = bg.match(/url\(["']?(.+?)["']?\)/);
                        return m ? m[1] : '';
                      })()}
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        onStyleChange({
                          backgroundImage: url ? `url("${url}")` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        });
                      }}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Fit */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">Dopasowanie</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Wypełnij', size: 'cover' },
                        { label: 'Dopasuj', size: 'contain' },
                        { label: 'Oryginał', size: 'auto' },
                      ].map((opt) => (
                        <button
                          key={opt.size}
                          onClick={() => onStyleChange({ backgroundSize: opt.size })}
                          className={`py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                            currentStyles.backgroundSize === opt.size || (!currentStyles.backgroundSize && opt.size === 'cover')
                              ? 'bg-violet-600 text-white border-violet-500'
                              : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Darkening overlay */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300">Przyciemnienie (overlay)</label>
                      <span className="text-[11px] font-mono text-white">
                        {Math.round((currentStyles.overlayOpacity ?? 0.4) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round((currentStyles.overlayOpacity ?? 0.4) * 100)}
                      onChange={(e) => onStyleChange({ overlayOpacity: Number(e.target.value) / 100 })}
                      className="w-full accent-violet-500 h-1 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* ---- Background video ---- */}
              {bgType === 'video' && (
                <div className="space-y-3">
                  <button
                    onClick={() => { setMediaPickerTarget('video-bg'); setShowMediaPicker(true); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-xs text-white transition-all shadow-md shadow-violet-600/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Wybierz lub wgraj wideo tła</span>
                  </button>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">URL wideo tła (mp4 / webm)</label>
                    <input
                      type="text"
                      value={String(props.backgroundVideo ?? '')}
                      onChange={(e) => onPropChange('backgroundVideo', e.target.value)}
                      placeholder="https://... (mp4, webm)"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-[10px] text-slate-500">Wideo odtwarzane automatycznie w tle (bez dźwięku, w pętli)</p>
                  </div>

                  {/* Darkening overlay */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300">Przyciemnienie (overlay)</label>
                      <span className="text-[11px] font-mono text-white">
                        {Math.round((currentStyles.overlayOpacity ?? 0.4) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round((currentStyles.overlayOpacity ?? 0.4) * 100)}
                      onChange={(e) => onStyleChange({ overlayOpacity: Number(e.target.value) / 100 })}
                      className="w-full accent-violet-500 h-1 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[11px] font-semibold text-slate-300">Odstępy pionowe (Padding)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Kompaktowe', top: '40px', bottom: '40px' },
                    { label: 'Normalne', top: '70px', bottom: '70px' },
                    { label: 'Duże', top: '100px', bottom: '100px' },
                  ].map((p) => {
                    const isSelected =
                      (typeof currentStyles.padding === 'object' && currentStyles.padding?.top === p.top) ||
                      currentStyles.padding === `${p.top} 24px`;
                    return (
                      <button
                        key={p.label}
                        onClick={() =>
                          onStyleChange({
                            padding: { top: p.top, right: '24px', bottom: p.bottom, left: '24px' },
                          })
                        }
                        className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: CONTAINER                                     */}
        {/* ============================================================= */}
        {nodeType === 'container' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Układ elementów</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onStyleChange({ display: 'flex', flexDirection: 'column' })}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    currentStyles.flexDirection === 'column' || !currentStyles.flexDirection
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  W pionie (Kolumna)
                </button>
                <button
                  onClick={() => onStyleChange({ display: 'flex', flexDirection: 'row' })}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    currentStyles.flexDirection === 'row'
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  W poziomie (Wiersz)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Odstęp między elementami (Gap)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Mały (8px)', val: '8px' },
                  { label: 'Średni (16px)', val: '16px' },
                  { label: 'Duży (32px)', val: '32px' },
                ].map((g) => (
                  <button
                    key={g.val}
                    onClick={() => onStyleChange({ gap: g.val })}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      currentStyles.gap === g.val
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {g.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: VIDEO                                         */}
        {/* ============================================================= */}
        {nodeType === 'video' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Adres URL wideo</label>
              <input
                type="text"
                value={String(props.src ?? '')}
                onChange={(e) => {
                  onPropChange('src', e.target.value)
                  onPropChange('url', e.target.value)
                }}
                placeholder="https://... (mp4, webm)"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Szerokość wideo</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={vidWidthLabelRef} className="w-12 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.width || '480px').replace('px', '')) || 480}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={100}
                max={1400}
                value={parseInt(String(currentStyles.width || '480px').replace('px', '')) || 480}
                labelRef={vidWidthLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.width = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ width: `${v}px` })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Wysokość wideo</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={vidHeightLabelRef} className="w-12 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.height || '270px').replace('px', '')) || 270}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={80}
                max={900}
                value={parseInt(String(currentStyles.height || '270px').replace('px', '')) || 270}
                labelRef={vidHeightLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) el.style.height = `${v}px`;
                }}
                onChange={(v) => onStyleChange({ height: `${v}px` })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <button
                onClick={() => onPropChange('loop', !props.loop)}
                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  props.loop ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Pętla (Loop)
              </button>
              <button
                onClick={() => onPropChange('autoPlay', !props.autoPlay)}
                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  props.autoPlay ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Autoodtwarzanie
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SIMPLE CONTROLS: SVG / ICON                                    */}
        {/* ============================================================= */}
        {(nodeType === 'svg' || nodeType === 'icon') && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Rozmiar ikony</label>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  <span ref={svgSizeLabelRef} className="w-10 text-right font-mono text-white text-xs">
                    {parseInt(String(currentStyles.width || '48px').replace('px', '')) || 48}
                  </span>
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
              <SmoothSlider
                min={12}
                max={256}
                value={parseInt(String(currentStyles.width || '48px').replace('px', '')) || 48}
                labelRef={svgSizeLabelRef}
                unit=""
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) { el.style.width = `${v}px`; el.style.height = `${v}px`; }
                }}
                onChange={(v) => onStyleChange({ width: `${v}px`, height: `${v}px` })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Kolor ikony</label>
              <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
                <input
                  type="color"
                  value={currentStyles.color || '#8b5cf6'}
                  onChange={(e) => onStyleChange({ color: e.target.value })}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0"
                />
                <input
                  type="text"
                  value={currentStyles.color || '#8b5cf6'}
                  onChange={(e) => onStyleChange({ color: e.target.value })}
                  placeholder="#8b5cf6"
                  className="w-full bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none focus:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* UNIVERSAL CANVAS POSITION (X / Y)                             */}
        {/* ============================================================= */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
              <Move className="w-3.5 h-3.5 text-violet-400" />
              <span>Pozycja na Canvasie</span>
            </div>
            {(currentStyles.translateX || currentStyles.translateY) && (
              <button
                onClick={() => onStyleChange({ translateX: '0px', translateY: '0px' })}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Resetuj (0, 0)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Position X — SmoothSlider */}
            <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Oś X</span>
                <span ref={txLabelRef} className="font-mono text-white">
                  {currentStyles.translateX || '0px'}
                </span>
              </div>
              <SmoothSlider
                min={-500}
                max={500}
                value={parseInt(String(currentStyles.translateX || '0px').replace('px', '')) || 0}
                labelRef={txLabelRef}
                unit="px"
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) {
                    const curTy = parseInt(el.style.transform.match(/translate\([^,]+,\s*(-?\d+)/)?.[1] ?? '0') || 0;
                    el.style.transform = `translate(${v}px, ${curTy}px)`;
                  }
                }}
                onChange={(v) => onStyleChange({ translateX: `${v}px` })}
              />
            </div>

            {/* Position Y — SmoothSlider */}
            <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Oś Y</span>
                <span ref={tyLabelRef} className="font-mono text-white">
                  {currentStyles.translateY || '0px'}
                </span>
              </div>
              <SmoothSlider
                min={-500}
                max={500}
                value={parseInt(String(currentStyles.translateY || '0px').replace('px', '')) || 0}
                labelRef={tyLabelRef}
                unit="px"
                onLivePreview={(v) => {
                  const el = getCanvasEl();
                  if (el) {
                    const curTx = parseInt(el.style.transform.match(/translate\((-?\d+)/)?.[1] ?? '0') || 0;
                    el.style.transform = `translate(${curTx}px, ${v}px)`;
                  }
                }}
                onChange={(v) => onStyleChange({ translateY: `${v}px` })}
              />
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* ADVANCED COLLAPSIBLE ACCORDION                                */}
        {/* ============================================================= */}
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all border border-white/5"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Zaawansowane ustawienia (Advanced)</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <DesignInspector
                styles={currentStyles}
                onStyleChange={onStyleChange}
                nodeLabel={nodeLabel}
                nodeType={nodeType}
              />
            </div>
          )}
        </div>
      </div>

      {/* Media Picker Modal — target-aware write-back */}
      {showMediaPicker && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          title={
            mediaPickerTarget === 'section-bg' ? 'Zdjęcie tła sekcji'
            : mediaPickerTarget === 'video-bg' ? 'Wideo tła sekcji'
            : 'Zdjęcie'
          }
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            if (mediaPickerTarget === 'section-bg') {
              onStyleChange({
                backgroundImage: url ? `url("${url}")` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              });
            } else if (mediaPickerTarget === 'video-bg') {
              onPropChange('backgroundVideo', url);
            } else {
              onPropChange('src', url);
            }
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
};

export default PhaseThreeInspector;
