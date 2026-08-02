import { describe, it, expect, beforeEach } from 'vitest';
import { DebugOverlayState } from './DebugOverlayState';

describe('DebugOverlayState Foundation', () => {
  let state: DebugOverlayState;

  beforeEach(() => {
    state = new DebugOverlayState();
  });

  it('should toggle visibility state', () => {
    expect(state.getIsVisible()).toBe(false);
    state.show();
    expect(state.getIsVisible()).toBe(true);
    state.toggleVisibility();
    expect(state.getIsVisible()).toBe(false);
  });

  it('should report and track component render diagnostic info', () => {
    state.reportComponentRender('hero_1', 'HeroSection', 12.4, { x: 0, y: 0, width: 1200, height: 400 });

    const active = state.getActiveComponent();
    expect(active).not.toBeNull();
    expect(active?.componentId).toBe('hero_1');
    expect(active?.renderTimeMs).toBe(12.4);

    const info = state.getComponentInfo('hero_1');
    expect(info?.componentType).toBe('HeroSection');
  });

  it('should track validation errors and warnings', () => {
    state.reportValidationError('Invalid border radius unit', 'sec_1', 'borderRadius');
    state.reportWarning('High render latency detected');

    const errors = state.getValidationErrors();
    const warnings = state.getWarnings();

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Invalid border radius unit');
    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toBe('High render latency detected');
  });

  it('should clear diagnostic entries on request', () => {
    state.reportComponentRender('sec_1', 'Navbar', 5);
    state.reportWarning('Warn');
    state.clearDiagnostics();

    expect(state.getActiveComponent()).toBeNull();
    expect(state.getWarnings().length).toBe(0);
  });
});
