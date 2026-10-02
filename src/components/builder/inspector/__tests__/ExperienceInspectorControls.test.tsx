import './setup-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { ExperienceInspectorControls } from '../ExperienceInspectorControls';
import type { ExperienceSceneConfig } from '@/lib/experience/ExperienceRuntimeTypes';

describe('ExperienceInspectorControls', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders correctly with default or empty config without crashing', () => {
    const handleChange = vi.fn();
    const { getByText } = render(
      <ExperienceInspectorControls
        config={undefined}
        onChange={handleChange}
      />
    );

    expect(getByText(/Visual Experience v2.0/i)).toBeDefined();
    expect(getByText(/Wizualne/i)).toBeDefined();
    expect(getByText(/Ruch/i)).toBeDefined();
    expect(getByText(/Interakcja/i)).toBeDefined();
    expect(getByText(/Wydajność/i)).toBeDefined();
  });

  it('displays custom experience title and capability badges', () => {
    const config: Partial<ExperienceSceneConfig> = {
      version: '2.0.0',
      background: {
        type: 'shader',
        shader: {
          preset: 'aurora-noise',
        },
      },
      particles: {
        count: 300,
      },
    };

    const { getByText } = render(
      <ExperienceInspectorControls
        config={config}
        experienceTitle="Aurora Cinematic Hero"
        onChange={vi.fn()}
      />
    );

    expect(getByText('Aurora Cinematic Hero')).toBeDefined();
    expect(getByText('Background: shader')).toBeDefined();
    expect(getByText('Particles: 300')).toBeDefined();
  });

  it('updates background effect type when selecting a different background', () => {
    const handleChange = vi.fn();
    const config: Partial<ExperienceSceneConfig> = {
      background: { type: 'none' },
    };

    const { getByRole } = render(
      <ExperienceInspectorControls
        config={config}
        onChange={handleChange}
      />
    );

    const auroraBtn = getByRole('button', { name: /aurora/i });
    fireEvent.click(auroraBtn);

    expect(handleChange).toHaveBeenCalled();
    const emittedConfig = handleChange.mock.calls[0][0];
    expect(emittedConfig.background.type).toBe('aurora');
  });

  it('renders shader preset selector when shader background is selected', () => {
    const handleChange = vi.fn();
    const config: Partial<ExperienceSceneConfig> = {
      background: {
        type: 'shader',
        shader: { preset: 'aurora-noise' },
      },
    };

    const { getByText, getByRole } = render(
      <ExperienceInspectorControls
        config={config}
        onChange={handleChange}
      />
    );

    expect(getByText(/Preset Shadera WebGL/i)).toBeDefined();
    const plasmaBtn = getByRole('button', { name: /plasma/i });
    fireEvent.click(plasmaBtn);

    expect(handleChange).toHaveBeenCalled();
    const emittedConfig = handleChange.mock.calls[0][0];
    expect(emittedConfig.background.shader.preset).toBe('plasma');
  });

  it('toggles particles on and off', () => {
    const handleChange = vi.fn();
    const config: Partial<ExperienceSceneConfig> = {
      particles: { count: 0 },
    };

    const { getByText } = render(
      <ExperienceInspectorControls
        config={config}
        onChange={handleChange}
      />
    );

    const particleToggle = getByText(/Cząsteczki \(GPU Particles\)/i).closest('div')?.parentElement?.querySelector('button');
    expect(particleToggle).toBeDefined();
    if (particleToggle) {
      fireEvent.click(particleToggle);
      expect(handleChange).toHaveBeenCalled();
      const emitted = handleChange.mock.calls[0][0];
      expect(emitted.particles.count).toBe(200);
    }
  });

  it('switches to Motion tab and allows tuning motion type and speed', () => {
    const handleChange = vi.fn();
    const config: Partial<ExperienceSceneConfig> = {
      motion: { type: 'float', speed: 1.2, intensity: 1.0 },
    };

    const { getByRole, getByText } = render(
      <ExperienceInspectorControls
        config={config}
        onChange={handleChange}
      />
    );

    // Switch to Motion Tab
    const motionTab = getByRole('button', { name: /Ruch/i });
    fireEvent.click(motionTab);

    expect(getByText(/Wariant Ruchu/i)).toBeDefined();
    const pulseBtn = getByRole('button', { name: /pulsowanie/i });
    fireEvent.click(pulseBtn);

    expect(handleChange).toHaveBeenCalled();
    const emitted = handleChange.mock.calls[0][0];
    expect(emitted.motion.type).toBe('pulse');
  });

  it('switches to Interaction tab and configures pointer and scroll dynamics', () => {
    const handleChange = vi.fn();
    const config: Partial<ExperienceSceneConfig> = {
      pointer: { type: 'tilt', strength: 1.0, maxAngle: 15 },
      scroll: { type: 'sticky-story', steps: 4 },
    };

    const { getByRole, getByText } = render(
      <ExperienceInspectorControls
        config={config}
        onChange={handleChange}
      />
    );

    const interactionTab = getByRole('button', { name: /Interakcja/i });
    fireEvent.click(interactionTab);

    expect(getByText(/Reakcja na kursor/i)).toBeDefined();
    expect(getByText(/Interakcja ze scrollem/i)).toBeDefined();

    const spotlightBtn = getByRole('button', { name: /reflektor/i });
    fireEvent.click(spotlightBtn);

    expect(handleChange).toHaveBeenCalled();
    const emitted = handleChange.mock.calls[0][0];
    expect(emitted.pointer.type).toBe('spotlight');
  });

  it('switches to Performance tab and handles tier & reduced motion fallback', () => {
    const handleChange = vi.fn();
    const config: Partial<ExperienceSceneConfig> = {
      performanceTier: 'high',
      reducedMotionFallback: true,
    };

    const { getByRole, getByText } = render(
      <ExperienceInspectorControls
        config={config}
        onChange={handleChange}
      />
    );

    const perfTab = getByRole('button', { name: /Wydajność/i });
    fireEvent.click(perfTab);

    expect(getByText(/Profil Wydajności/i)).toBeDefined();
    const lowTierBtn = getByRole('button', { name: /Low/i });
    fireEvent.click(lowTierBtn);

    expect(handleChange).toHaveBeenCalled();
    const emitted = handleChange.mock.calls[0][0];
    expect(emitted.performanceTier).toBe('low');
  });

  it('calls reset handler when reset button is clicked', () => {
    const handleReset = vi.fn();
    const handleChange = vi.fn();

    const { getByTitle } = render(
      <ExperienceInspectorControls
        config={{ motion: { type: 'pulse' } }}
        onChange={handleChange}
        onReset={handleReset}
      />
    );

    const resetBtn = getByTitle(/Przywróć domyślne parametry/i);
    fireEvent.click(resetBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
