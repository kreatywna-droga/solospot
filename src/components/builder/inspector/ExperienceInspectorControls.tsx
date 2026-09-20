'use client';

import React, { useState, useCallback } from 'react';
import { normalizeSceneConfig } from '@/lib/experience/runtime/CapabilityEngine';
import type {
  ExperienceSceneConfig,
  BackgroundEffectType,
  ShaderPreset,
  MotionType,
  ScrollInteractionType,
  PointerInteractionType,
  PerformanceTier,
} from '@/lib/experience/ExperienceRuntimeTypes';

interface ExperienceInspectorControlsProps {
  config?: Partial<ExperienceSceneConfig>;
  onChange: (config: Partial<ExperienceSceneConfig>) => void;
}

type Tab = 'visual' | 'motion' | 'interaction' | 'performance';

const TABS: { id: Tab; label: string }[] = [
  { id: 'visual', label: 'Visual' },
  { id: 'motion', label: 'Motion' },
  { id: 'interaction', label: 'Interaction' },
  { id: 'performance', label: 'Performance' },
];

const BACKGROUND_TYPES: { value: BackgroundEffectType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'mesh-gradient', label: 'Mesh Gradient' },
  { value: 'ambient-blobs', label: 'Ambient Blobs' },
  { value: 'glowing-orb', label: 'Glowing Orb' },
  { value: 'video', label: 'Video' },
  { value: 'static-gradient', label: 'Static Gradient' },
  { value: 'shader', label: 'Shader' },
  { value: 'interactive-gradient', label: 'Interactive Gradient' },
];

const SHADER_PRESETS: { value: ShaderPreset; label: string }[] = [
  { value: 'aurora-noise', label: 'Aurora Noise' },
  { value: 'fluid-warp', label: 'Fluid Warp' },
  { value: 'nebula', label: 'Nebula' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'digital-rain', label: 'Digital Rain' },
];

const MOTION_TYPES: { value: MotionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'float', label: 'Float' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'breathe', label: 'Breathe' },
  { value: 'drift', label: 'Drift' },
  { value: 'wave', label: 'Wave' },
  { value: 'morph', label: 'Morph' },
  { value: 'orbit', label: 'Orbit' },
];

const SCROLL_TYPES: { value: ScrollInteractionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sticky-story', label: 'Sticky Story' },
  { value: 'horizontal-showcase', label: 'Horizontal Showcase' },
  { value: 'parallax-depth', label: 'Parallax Depth' },
  { value: 'timeline-scrub', label: 'Timeline Scrub' },
  { value: 'reveal', label: 'Reveal' },
];

const POINTER_TYPES: { value: PointerInteractionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'parallax', label: 'Parallax' },
  { value: 'magnetic', label: 'Magnetic' },
  { value: 'glow', label: 'Glow' },
  { value: 'perspective', label: 'Perspective' },
];

const DEFAULT_COLORS = ['#7c3aed', '#3b82f6', '#ec4899', '#06b6d4'];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-zinc-300">{label}</label>
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
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
            value === opt.value
              ? 'bg-violet-600 text-white border-violet-500'
              : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-300">{label}</span>
        <span className="text-[11px] font-mono text-white">
          {Number.isInteger(value) ? value : value.toFixed(2)}{resolvedUnit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full cursor-pointer accent-violet-500"
        style={{
          background: `linear-gradient(to right, #7c3aed ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-zinc-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-white/10'
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
  const addColor = () => onChange([...colors, '#7c3aed']);
  const removeColor = (idx: number) => onChange(colors.filter((_, i) => i !== idx));
  const updateColor = (idx: number, c: string) => {
    const next = [...colors];
    next[idx] = c;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg">
            <input
              type="color"
              value={c}
              onChange={(e) => updateColor(i, e.target.value)}
              className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
            />
            <span className="text-[10px] font-mono text-zinc-400 w-14 truncate">{c}</span>
            <button
              onClick={() => removeColor(i)}
              className="text-[10px] text-zinc-500 hover:text-red-400 px-0.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addColor}
        className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold"
      >
        + Add Color
      </button>
    </div>
  );
}

export function ExperienceInspectorControls({
  config: rawConfig,
  onChange,
}: ExperienceInspectorControlsProps) {
  const config = normalizeSceneConfig(rawConfig);
  const [activeTab, setActiveTab] = useState<Tab>('visual');

  const patch = useCallback(
    (partial: Partial<ExperienceSceneConfig>) => onChange(partial),
    [onChange],
  );

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

  return (
    <div className="flex flex-col h-full bg-[#202024] text-white select-none">
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#27272A]">
        <div className="text-xs font-bold text-white">Experience Controls</div>
        <p className="text-[11px] text-zinc-500 mt-0.5">Scene configuration</p>
      </div>

      <div className="flex border-b border-white/[0.08]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[11px] font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-violet-400 border-b-2 border-violet-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'visual' && (
          <>
            <FieldGroup label="Background Type">
              <SelectField
                value={config.background?.type ?? 'none'}
                options={BACKGROUND_TYPES}
                onChange={(v) => patchBackground({ type: v as BackgroundEffectType })}
              />
            </FieldGroup>

            {config.background?.type === 'shader' && (
              <FieldGroup label="Shader Preset">
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

            <FieldGroup label="Colors">
              <ColorArrayField
                colors={config.background?.colors ?? DEFAULT_COLORS}
                onChange={(c) => patchBackground({ colors: c })}
              />
            </FieldGroup>

            <SliderField
              label="Opacity"
              value={config.background?.opacity ?? 0.8}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => patchBackground({ opacity: v })}
            />

            <SliderField
              label="Speed"
              value={config.background?.speed ?? 1}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => patchBackground({ speed: v })}
              unit="x"
            />

            <div className="border-t border-white/[0.06] pt-4 space-y-4">
              <FieldGroup label="Particles">
                <ToggleField
                  label="Enable Particles"
                  checked={!!config.particles && config.particles.count > 0}
                  onChange={(v) =>
                    patchParticles({ count: v ? 200 : 0 })
                  }
                />
              </FieldGroup>

              {config.particles && config.particles.count > 0 && (
                <>
                  <SliderField
                    label="Count"
                    value={config.particles.count}
                    min={10}
                    max={1000}
                    step={10}
                    onChange={(v) => patchParticles({ count: v })}
                  />
                  <SliderField
                    label="Size"
                    value={config.particles.size ?? 3}
                    min={0.5}
                    max={10}
                    step={0.5}
                    onChange={(v) => patchParticles({ size: v })}
                  />
                  <SliderField
                    label="Speed"
                    value={config.particles.speed ?? 1}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={(v) => patchParticles({ speed: v })}
                  />
                  <SliderField
                    label="Pointer Influence"
                    value={config.particles.pointerInfluence ?? 0}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(v) => patchParticles({ pointerInfluence: v })}
                  />
                  <FieldGroup label="Attract / Repel">
                    <SelectField
                      value={config.particles.attractRepel ?? 'none'}
                      options={[
                        { value: 'none', label: 'None' },
                        { value: 'attract', label: 'Attract' },
                        { value: 'repell', label: 'Repel' },
                      ]}
                      onChange={(v) =>
                        patchParticles({ attractRepel: v as 'attract' | 'repell' | 'none' })
                      }
                    />
                  </FieldGroup>
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'motion' && (
          <>
            <FieldGroup label="Motion Type">
              <SelectField
                value={config.motion?.type ?? 'none'}
                options={MOTION_TYPES}
                onChange={(v) => patchMotion({ type: v as MotionType })}
              />
            </FieldGroup>

            {config.motion?.type !== 'none' && (
              <>
                <SliderField
                  label="Speed"
                  value={config.motion?.speed ?? 1}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchMotion({ speed: v })}
                  unit="x"
                />
                <SliderField
                  label="Intensity"
                  value={config.motion?.intensity ?? 1}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchMotion({ intensity: v })}
                  unit="x"
                />
              </>
            )}

            <div className="border-t border-white/[0.06] pt-4 space-y-4">
              <FieldGroup label="Scroll Type">
                <SelectField
                  value={config.scroll?.type ?? 'none'}
                  options={SCROLL_TYPES}
                  onChange={(v) => patchScroll({ type: v as ScrollInteractionType })}
                />
              </FieldGroup>

              {config.scroll?.type !== 'none' && (
                <SliderField
                  label="Steps"
                  value={config.scroll?.steps ?? 3}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(v) => patchScroll({ steps: v })}
                />
              )}
            </div>
          </>
        )}

        {activeTab === 'interaction' && (
          <>
            <FieldGroup label="Pointer Type">
              <SelectField
                value={config.pointer?.type ?? 'none'}
                options={POINTER_TYPES}
                onChange={(v) => patchPointer({ type: v as PointerInteractionType })}
              />
            </FieldGroup>

            {config.pointer?.type !== 'none' && (
              <>
                <SliderField
                  label="Max Angle"
                  value={config.pointer?.maxAngle ?? 12}
                  min={0}
                  max={45}
                  step={1}
                  onChange={(v) => patchPointer({ maxAngle: v })}
                  unit="°"
                />
                <SliderField
                  label="Strength"
                  value={config.pointer?.strength ?? 1}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => patchPointer({ strength: v })}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <FieldGroup label="Performance Tier">
              <div className="flex items-center gap-2">
                {(['high', 'medium', 'low'] as PerformanceTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => patch({ performanceTier: tier })}
                    className={`flex-1 py-2 text-[11px] font-semibold rounded-lg border transition-all capitalize ${
                      config.performanceTier === tier
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Reduced Motion Fallback">
              <ToggleField
                label="Reduced Motion"
                checked={config.reducedMotionFallback ?? true}
                onChange={(v) => patch({ reducedMotionFallback: v })}
              />
            </FieldGroup>
          </>
        )}
      </div>
    </div>
  );
}
