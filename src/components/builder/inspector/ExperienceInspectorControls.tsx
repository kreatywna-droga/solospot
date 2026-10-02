'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { normalizeSceneConfig, getActiveCapabilityNames } from '@/lib/experience/runtime/CapabilityEngine';
import type {
  ExperienceSceneConfig,
  SceneLayerDefinition,
  BackgroundEffectType,
  ShaderPreset,
  MotionType,
  ScrollInteractionType,
  PointerInteractionType,
  PerformanceTier,
} from '@/lib/experience/ExperienceRuntimeTypes';
import { Sparkles, RotateCcw, Sliders, ShieldCheck, Eye, Activity, MousePointer, Layers } from 'lucide-react';

export interface ExperienceInspectorControlsProps {
  config?: Partial<ExperienceSceneConfig>;
  experienceId?: string;
  experienceTitle?: string;
  onChange: (config: Partial<ExperienceSceneConfig>) => void;
  onReset?: () => void;
}

export type Tab = 'visual' | 'layers' | 'motion' | 'interaction' | 'performance';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'visual', label: 'Wizualne', icon: Eye },
  { id: 'layers', label: 'Warstwy', icon: Layers },
  { id: 'motion', label: 'Ruch', icon: Activity },
  { id: 'interaction', label: 'Interakcja', icon: MousePointer },
  { id: 'performance', label: 'Wydajność', icon: ShieldCheck },
];

const BACKGROUND_TYPES: { value: BackgroundEffectType; label: string }[] = [
  { value: 'none', label: 'Brak' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'mesh-gradient', label: 'Mesh Gradient' },
  { value: 'ambient-blobs', label: 'Ambient Blobs' },
  { value: 'glowing-orb', label: 'Glowing Orb' },
  { value: 'shader', label: 'WebGL Shader' },
  { value: 'interactive-gradient', label: 'Gradient Interaktywny' },
  { value: 'static-gradient', label: 'Gradient Statyczny' },
  { value: 'video', label: 'Wideo Tło' },
];

const SHADER_PRESETS: { value: ShaderPreset; label: string }[] = [
  { value: 'aurora-noise', label: 'Aurora Noise' },
  { value: 'fluid-warp', label: 'Fluid Warp' },
  { value: 'nebula', label: 'Nebula Space' },
  { value: 'plasma', label: 'Plasma Glow' },
  { value: 'digital-rain', label: 'Digital Matrix' },
];

const MOTION_TYPES: { value: MotionType; label: string }[] = [
  { value: 'none', label: 'Brak' },
  { value: 'float', label: 'Pływanie (Float)' },
  { value: 'pulse', label: 'Pulsowanie' },
  { value: 'breathe', label: 'Oddychanie' },
  { value: 'drift', label: 'Dryfowanie' },
  { value: 'wave', label: 'Fala' },
  { value: 'morph', label: 'Morfizm' },
  { value: 'orbit', label: 'Orbita' },
  { value: 'rotate', label: 'Rotacja' },
  { value: 'reveal', label: 'Odsłanianie' },
];

const SCROLL_TYPES: { value: ScrollInteractionType; label: string }[] = [
  { value: 'none', label: 'Brak' },
  { value: 'sticky-story', label: 'Sticky Story' },
  { value: 'horizontal-showcase', label: 'Horizontal Showcase' },
  { value: 'parallax-depth', label: 'Parallax Depth' },
  { value: 'timeline-scrub', label: 'Timeline Scrub' },
  { value: 'reveal', label: 'Scroll Reveal' },
];

const POINTER_TYPES: { value: PointerInteractionType; label: string }[] = [
  { value: 'none', label: 'Brak' },
  { value: 'tilt', label: '3D Tilt (Nachylenie)' },
  { value: 'spotlight', label: 'Reflektor (Spotlight)' },
  { value: 'parallax', label: 'Paralaks kursora' },
  { value: 'magnetic', label: 'Magnetyczne przyciąganie' },
  { value: 'glow', label: 'Poświata kursorowa' },
  { value: 'perspective', label: 'Głębia perspektywy' },
];

const DEFAULT_COLORS = ['#B8893A', '#3b82f6', '#ec4899', '#06b6d4'];

function FieldGroup({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-zinc-300">{label}</label>
        {tooltip && <span className="text-[10px] text-zinc-500 font-normal">{tooltip}</span>}
      </div>
      {children}
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
              isSelected
                ? 'bg-[#D9A86C] text-white border-[#D9A86C] shadow-sm shadow-[#D9A86C]/20'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  const resolvedUnit = unit ?? '';
  const safeValue = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  const percentage = Math.max(0, Math.min(100, ((safeValue - min) / (max - min)) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-300">{label}</span>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-[#3A3A40] rounded px-1.5 py-0.5">
          <span className="text-[11px] font-mono text-white">
            {Number.isInteger(safeValue) ? safeValue : safeValue.toFixed(2)}
          </span>
          {resolvedUnit && <span className="text-[10px] text-zinc-400">{resolvedUnit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full cursor-pointer accent-[#D9A86C]"
        style={{
          background: `linear-gradient(to right, #B8893A ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`,
        }}
      />
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="pr-3">
        <span className="text-[11px] font-semibold text-zinc-300 block">{label}</span>
        {description && <span className="text-[10px] text-zinc-500 block">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-[#D9A86C]' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </div>
  );
}

function ColorArrayField({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (c: string[]) => void;
}) {
  const addColor = () => onChange([...colors, '#B8893A']);
  const removeColor = (idx: number) => {
    if (colors.length <= 1) return;
    onChange(colors.filter((_, i) => i !== idx));
  };
  const updateColor = (idx: number, c: string) => {
    const next = [...colors];
    next[idx] = c;
    onChange(next);
  };

  const gradient = colors.length > 1
    ? `linear-gradient(to right, ${colors.join(', ')})`
    : colors[0] || '#B8893A';

  return (
    <div className="space-y-2">
      <div
        className="w-full h-5 rounded-lg border border-[#3A3A40] shadow-inner"
        style={{ background: gradient }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        {colors.map((c, i) => (
          <div key={i} className="relative group flex items-center">
            <input
              type="color"
              value={c}
              onChange={(e) => updateColor(i, e.target.value)}
              className="w-6 h-6 rounded-md border border-[#3A3A40] cursor-pointer bg-transparent"
              title={`Kolor #${i + 1}: ${c}`}
            />
            {colors.length > 1 && (
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-[#202024] text-zinc-300 text-[9px] border border-[#3A3A40] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/60 hover:text-white"
                title="Usuń kolor"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {colors.length < 6 && (
          <button
            type="button"
            onClick={addColor}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-[#3A3A40] text-zinc-400 hover:text-white hover:bg-white/[0.06] text-xs transition-colors"
            title="Dodaj kolor do palety"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

export function ExperienceInspectorControls({
  config: rawConfig,
  experienceId,
  experienceTitle,
  onChange,
  onReset,
}: ExperienceInspectorControlsProps) {
  const config = useMemo(() => normalizeSceneConfig(rawConfig), [rawConfig]);
  const [activeTab, setActiveTab] = useState<Tab>('visual');

  const capabilities = useMemo(() => getActiveCapabilityNames(config), [config]);

  const patch = useCallback(
    (partial: Partial<ExperienceSceneConfig>) => {
      onChange({
        ...config,
        ...partial,
        version: '2.0.0',
      });
    },
    [config, onChange],
  );

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    } else {
      onChange(normalizeSceneConfig(null));
    }
  }, [onChange, onReset]);

  const patchBackground = useCallback(
    (partial: Partial<ExperienceSceneConfig['background']>) => {
      patch({ background: { ...config.background, ...partial } as ExperienceSceneConfig['background'] });
    },
    [config.background, patch],
  );

  const patchMotion = useCallback(
    (partial: Partial<ExperienceSceneConfig['motion']>) => {
      patch({ motion: { ...config.motion, ...partial } as ExperienceSceneConfig['motion'] });
    },
    [config.motion, patch],
  );

  const patchPointer = useCallback(
    (partial: Partial<ExperienceSceneConfig['pointer']>) => {
      patch({ pointer: { ...config.pointer, ...partial } as ExperienceSceneConfig['pointer'] });
    },
    [config.pointer, patch],
  );

  const patchScroll = useCallback(
    (partial: Partial<ExperienceSceneConfig['scroll']>) => {
      patch({ scroll: { ...config.scroll, ...partial } as ExperienceSceneConfig['scroll'] });
    },
    [config.scroll, patch],
  );

  const patchParticles = useCallback(
    (partial: Partial<ExperienceSceneConfig['particles']>) => {
      patch({ particles: { ...config.particles, ...partial } as ExperienceSceneConfig['particles'] });
    },
    [config.particles, patch],
  );

  const patchLayers = useCallback(
    (layers: SceneLayerDefinition[]) => {
      patch({ layers, version: '3.0.0' });
    },
    [patch],
  );

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      const current = config.layers || [];
      const updated = current.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
      patchLayers(updated);
    },
    [config.layers, patchLayers],
  );

  const updateLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      const current = config.layers || [];
      const updated = current.map((l) => (l.id === layerId ? { ...l, opacity } : l));
      patchLayers(updated);
    },
    [config.layers, patchLayers],
  );

  const convertCurrentToLayers = useCallback(() => {
    const generatedLayers: SceneLayerDefinition[] = [
      {
        id: 'layer-bg',
        name: config.background?.type !== 'none' ? `Tło: ${config.background?.type}` : 'Tło Główne',
        role: 'background',
        zIndex: 0,
        visible: true,
        opacity: config.background?.opacity ?? 1,
        background: config.background,
      },
      {
        id: 'layer-particles',
        name: 'GPU Cząsteczki (Particles)',
        role: 'particles',
        zIndex: 1,
        visible: !!(config.particles && config.particles.count > 0),
        opacity: 0.9,
        particles: config.particles,
      },
      {
        id: 'layer-spatial',
        name: 'Scena 3D & Perspektywa',
        role: 'spatial-3d',
        zIndex: 2,
        visible: !!(config.scene3d && config.scene3d.transformStyle === 'preserve-3d'),
        scene3d: config.scene3d,
      },
      {
        id: 'layer-content',
        name: 'Warstwa Treści & Ruchu',
        role: 'content',
        zIndex: 3,
        visible: true,
        motion: config.motion,
      },
      {
        id: 'layer-overlay',
        name: 'Interakcja Kursora & Reflektor',
        role: 'overlay',
        zIndex: 4,
        visible: !!(config.pointer && config.pointer.type !== 'none'),
        pointer: config.pointer,
      },
    ];
    patchLayers(generatedLayers);
  }, [config, patchLayers]);

  return (
    <div className="rounded-2xl border border-[#3A3A40] bg-[#18181B] text-white select-none overflow-hidden shadow-xl mb-4">
      {/* Header with Title, Capability chips and Reset */}
      <div className="px-4 py-3 border-b border-[#3A3A40] bg-[#202024]/80 backdrop-blur flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F2C27F] flex-shrink-0" />
            <span className="text-xs font-bold text-white truncate">
              {experienceTitle || experienceId || `Visual Experience v${config.version?.startsWith('3') ? '3.0' : '2.0'}`}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#D9A86C]/15 text-[#F2C27F] uppercase flex-shrink-0">
              {config.version}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {capabilities.slice(0, 3).map((cap, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 text-[9px] font-medium"
              >
                {cap}
              </span>
            ))}
            {capabilities.length > 3 && (
              <span className="text-[9px] text-zinc-500 font-medium">
                +{capabilities.length - 3} więcej
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#F2C27F] hover:bg-white/[0.08] transition-all flex-shrink-0"
          title="Przywróć domyślne parametry sceny"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 border-b border-[#3A3A40] bg-[#1a1a1e]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all border-b-2 ${
                isActive
                  ? 'text-[#F2C27F] border-[#D9A86C] bg-white/[0.02]'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="p-4 space-y-4">
        {/* TAB: LAYERS (v3.0) */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">Stos Warstw Sceny (Layer Stack)</span>
              {config.layers && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {config.layers.length} warstw
                </span>
              )}
            </div>

            {config.layers && config.layers.length > 0 ? (
              <div className="space-y-2">
                {config.layers.map((layer, idx) => (
                  <div
                    key={layer.id || idx}
                    className={`p-2.5 rounded-xl border transition-all ${
                      layer.visible !== false
                        ? 'bg-[#222227] border-[#3A3A40]'
                        : 'bg-white/[0.02] border-white/[0.04] opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#D9A86C]/15 text-[#F2C27F] uppercase">
                          Z:{layer.zIndex}
                        </span>
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {layer.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className={`p-1 rounded-md text-xs transition-colors ${
                          layer.visible !== false
                            ? 'text-[#F2C27F] bg-[#D9A86C]/10 hover:bg-[#D9A86C]/20'
                            : 'text-zinc-500 bg-white/[0.05] hover:text-zinc-300'
                        }`}
                        title={layer.visible !== false ? 'Ukryj warstwę' : 'Pokaż warstwę'}
                      >
                        {layer.visible !== false ? 'Widoczna' : 'Ukryta'}
                      </button>
                    </div>

                    {layer.visible !== false && typeof layer.opacity === 'number' && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <SliderField
                          label="Krycie (Opacity)"
                          value={layer.opacity}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(v) => updateLayerOpacity(layer.id, v)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-[#3A3A40] text-center space-y-3">
                <p className="text-[11px] text-zinc-400">
                  Scena korzysta z płaskiej konfiguracji v2.0. Możesz ją przekształcić w 5-warstwową kompozycję v3.0.
                </p>
                <button
                  type="button"
                  onClick={convertCurrentToLayers}
                  className="w-full py-2 px-3 rounded-xl bg-[#D9A86C] text-black font-bold text-xs hover:bg-[#E5B57E] transition-all shadow-md"
                >
                  ✦ Aktywuj Stos 5 Warstw (v3.0)
                </button>
              </div>
            )}
          </div>
        )}
        {/* TAB 1: VISUAL */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
            <FieldGroup label="Efekt Tła (Background)">
              <SelectField
                value={config.background?.type ?? 'none'}
                options={BACKGROUND_TYPES}
                onChange={(v) => patchBackground({ type: v as BackgroundEffectType })}
              />
            </FieldGroup>

            {config.background?.type === 'shader' && (
              <FieldGroup label="Preset Shadera WebGL">
                <SelectField
                  value={config.background.shader?.preset ?? 'aurora-noise'}
                  options={SHADER_PRESETS}
                  onChange={(v) =>
                    patchBackground({
                      shader: { ...config.background?.shader, preset: v as ShaderPreset },
                    })
                  }
                />
              </FieldGroup>
            )}

            {config.background?.type !== 'none' && (
              <>
                <FieldGroup label="Paleta Kolorów Sceny">
                  <ColorArrayField
                    colors={config.background?.colors ?? DEFAULT_COLORS}
                    onChange={(c) => patchBackground({ colors: c })}
                  />
                </FieldGroup>

                <SliderField
                  label="Przezroczystość (Opacity)"
                  value={config.background?.opacity ?? 0.8}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => patchBackground({ opacity: v })}
                />

                <SliderField
                  label="Prędkość Animacji Tła"
                  value={config.background?.speed ?? 1}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchBackground({ speed: v })}
                  unit="x"
                />
              </>
            )}

            {/* Particles Subgroup */}
            <div className="border-t border-[#3A3A40] pt-3 space-y-3">
              <ToggleField
                label="System Cząsteczek (Canvas 2D)"
                description="Generatywny rój cząsteczek w tle"
                checked={!!config.particles && config.particles.count > 0}
                onChange={(v) =>
                  patchParticles({ count: v ? 200 : 0 })
                }
              />

              {config.particles && config.particles.count > 0 && (
                <div className="space-y-3 pl-2 border-l-2 border-[#D9A86C]/40 mt-2">
                  <SliderField
                    label="Liczba cząsteczek"
                    value={config.particles.count}
                    min={10}
                    max={1000}
                    step={10}
                    onChange={(v) => patchParticles({ count: v })}
                  />
                  <SliderField
                    label="Rozmiar cząsteczek"
                    value={config.particles.size ?? 3}
                    min={0.5}
                    max={10}
                    step={0.5}
                    onChange={(v) => patchParticles({ size: v })}
                    unit="px"
                  />
                  <SliderField
                    label="Prędkość ruchu"
                    value={config.particles.speed ?? 1}
                    min={0.1}
                    max={5}
                    step={0.1}
                    onChange={(v) => patchParticles({ speed: v })}
                    unit="x"
                  />
                  <SliderField
                    label="Wpływ kursora"
                    value={config.particles.pointerInfluence ?? 0}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(v) => patchParticles({ pointerInfluence: v })}
                  />
                  <FieldGroup label="Reakcja na kursor">
                    <SelectField
                      value={config.particles.attractRepel ?? 'none'}
                      options={[
                        { value: 'none', label: 'Brak' },
                        { value: 'attract', label: 'Przyciągaj' },
                        { value: 'repell', label: 'Odpychaj' },
                      ]}
                      onChange={(v) =>
                        patchParticles({ attractRepel: v as 'attract' | 'repell' | 'none' })
                      }
                    />
                  </FieldGroup>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MOTION */}
        {activeTab === 'motion' && (
          <div className="space-y-4">
            <FieldGroup label="Wariant Ruchu (Motion Preset)">
              <SelectField
                value={config.motion?.type ?? 'none'}
                options={MOTION_TYPES}
                onChange={(v) => patchMotion({ type: v as MotionType })}
              />
            </FieldGroup>

            {config.motion?.type !== 'none' && (
              <>
                <SliderField
                  label="Prędkość Ruchu (Speed)"
                  value={config.motion?.speed ?? 1}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchMotion({ speed: v })}
                  unit="x"
                />
                <SliderField
                  label="Intensywność (Intensity)"
                  value={config.motion?.intensity ?? 1}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchMotion({ intensity: v })}
                  unit="x"
                />
                <FieldGroup label="Kierunek Animacji">
                  <SelectField
                    value={config.motion?.direction ?? 'normal'}
                    options={[
                      { value: 'normal', label: 'Normalny' },
                      { value: 'reverse', label: 'Odwrotny' },
                      { value: 'alternate', label: 'Naprzemienny' },
                    ]}
                    onChange={(v) => patchMotion({ direction: v as 'normal' | 'reverse' | 'alternate' })}
                  />
                </FieldGroup>
              </>
            )}
          </div>
        )}

        {/* TAB 3: INTERACTION & SCROLL */}
        {activeTab === 'interaction' && (
          <div className="space-y-4">
            <FieldGroup label="Reakcja na kursor (Pointer Dynamics)">
              <SelectField
                value={config.pointer?.type ?? 'none'}
                options={POINTER_TYPES}
                onChange={(v) => patchPointer({ type: v as PointerInteractionType })}
              />
            </FieldGroup>

            {config.pointer?.type !== 'none' && (
              <>
                <SliderField
                  label="Maksymalny kąt nachylenia"
                  value={config.pointer?.maxAngle ?? 12}
                  min={0}
                  max={45}
                  step={1}
                  onChange={(v) => patchPointer({ maxAngle: v })}
                  unit="°"
                />
                <SliderField
                  label="Siła efektu kursorowego"
                  value={config.pointer?.strength ?? 1}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchPointer({ strength: v })}
                  unit="x"
                />
                <SliderField
                  label="Promień oddziaływania"
                  value={config.pointer?.radius ?? 350}
                  min={50}
                  max={800}
                  step={25}
                  onChange={(v) => patchPointer({ radius: v })}
                  unit="px"
                />
              </>
            )}

            <div className="border-t border-[#3A3A40] pt-3 space-y-3">
              <FieldGroup label="Interakcja ze scrollem (Scroll Story)">
                <SelectField
                  value={config.scroll?.type ?? 'none'}
                  options={SCROLL_TYPES}
                  onChange={(v) => patchScroll({ type: v as ScrollInteractionType })}
                />
              </FieldGroup>

              {config.scroll?.type !== 'none' && (
                <SliderField
                  label="Liczba kroków / sekcji"
                  value={config.scroll?.steps ?? 3}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(v) => patchScroll({ steps: v })}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PERFORMANCE & ACCESSIBILITY */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <FieldGroup label="Profil Wydajności (Performance Tier)">
              <div className="flex items-center gap-1.5">
                {(['high', 'medium', 'low'] as PerformanceTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => patch({ performanceTier: tier })}
                    className={`flex-1 py-2 text-[11px] font-semibold rounded-xl border transition-all capitalize ${
                      config.performanceTier === tier || (!config.performanceTier && tier === 'high')
                        ? 'bg-[#D9A86C] text-white border-[#D9A86C] shadow-sm shadow-[#D9A86C]/20'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {tier === 'high' ? '🚀 High' : tier === 'medium' ? '⚡ Med' : '🔋 Low'}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-[#3A3A40] space-y-2">
              <ToggleField
                label="Reduced Motion Fallback"
                description="Respektuj preferencje użytkowników z ograniczonym ruchem"
                checked={config.reducedMotionFallback ?? true}
                onChange={(v) => patch({ reducedMotionFallback: v })}
              />
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Automatycznie wycisza dynamiczne shadery, cząsteczki i skomplikowane animacje na urządzeniach z włączonym trybem oszczędzania ruchu w systemie operacyjnym.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
