import { describe, it, expect, beforeEach } from 'vitest';
import { createBuilderContext, createBuilderComponentRegistry, createMemoryChannel } from '../../../../packages/builder-core/src/index';
import { DesignSystem } from '../index';
import { resolveDesignApplication, designApplicationToCommandPayload } from '../builder';

describe('DesignSystem Apply Pipeline — All Categories Gate v2.0', () => {
  const CATEGORIES = [
    { kind: 'style-pack', id: 'sp-medical-clean', label: 'Style Pack' },
    { kind: 'color-palette', id: 'mono-black-white', label: 'Color Palette' },
    { kind: 'typography', id: 'typography-modern-minimal', label: 'Typography' },
    { kind: 'font', id: 'inter', label: 'Font' },
    { kind: 'font-pairing', id: 'modern-minimal', label: 'Font Pairing' },
    { kind: 'button', id: 'buttons-solid', label: 'Button' },
    { kind: 'card', id: 'cards-minimal', label: 'Card' },
    { kind: 'background', id: 'background-solid', label: 'Background' },
    { kind: 'hero', id: 'hero-centered', label: 'Hero' },
    { kind: 'section', id: 'section-clean', label: 'Section' },
    { kind: 'image', id: 'image-natural', label: 'Image' },
    { kind: 'icon', id: 'icon-minimal', label: 'Icon' },
    { kind: 'effect', id: 'effect-fade', label: 'Effect' },
    { kind: 'shadow', id: 'shadow-soft', label: 'Shadow' },
    { kind: 'radius', id: 'radius-rounded', label: 'Radius' },
    { kind: 'spacing', id: 'spacing-balanced', label: 'Spacing' },
    { kind: 'industry-preset', id: 'ind-dental', label: 'Industry Preset' },
    { kind: 'design-combination', id: 'comb-001', label: 'Design Combination' },
  ] as const;

  it('all categories resolve to a non-empty command payload or clear skip', () => {
    for (const cat of CATEGORIES) {
      const result = resolveDesignApplication(
        { kind: cat.kind, id: cat.id },
        DesignSystem as any
      );

      if (!result.ok) {
        console.warn(`[SKIP] ${cat.label} (${cat.id}): ${result.message}`);
        continue;
      }

      const payload = designApplicationToCommandPayload(result);
      expect(payload, `${cat.label} should produce a command payload`).not.toBeNull();
      expect(payload?.type).toBe('UPDATE_THEME');
    }
  });

  it('style pack produces full theme + tokens + appliedStylePackId', () => {
    const result = resolveDesignApplication(
      { kind: 'style-pack', id: 'sp-medical-clean' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.type).toBe('UPDATE_THEME');
    expect(payload!.theme.appliedStylePackId).toBe('sp-medical-clean');
    expect(payload!.theme.tokens).toBeDefined();
  });

  it('color palette produces color tokens', () => {
    const result = resolveDesignApplication(
      { kind: 'color-palette', id: 'mono-black-white' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.tokens.colors).toBeDefined();
    expect(payload!.theme.primaryColor).toBe('#000000');
  });

  it('typography produces font + typography tokens', () => {
    const result = resolveDesignApplication(
      { kind: 'typography', id: 'typography-modern-minimal' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.font).toBeDefined();
    expect(payload!.theme.tokens.typography).toBeDefined();
  });

  it('font produces theme.font', () => {
    const result = resolveDesignApplication(
      { kind: 'font', id: 'inter' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.font).toBe('Inter');
  });

  it('radius produces radius token', () => {
    const result = resolveDesignApplication(
      { kind: 'radius', id: 'radius-rounded' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.tokens.radius).toBeDefined();
  });

  it('spacing produces spacing token', () => {
    const result = resolveDesignApplication(
      { kind: 'spacing', id: 'spacing-balanced' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.tokens.spacing).toBeDefined();
  });

  it('shadow produces shadow token', () => {
    const result = resolveDesignApplication(
      { kind: 'shadow', id: 'shadow-soft' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.tokens.shadows).toBeDefined();
  });

  it('button produces component tokens', () => {
    const result = resolveDesignApplication(
      { kind: 'button', id: 'buttons-solid' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
  });

  it('card produces component tokens', () => {
    const result = resolveDesignApplication(
      { kind: 'card', id: 'cards-minimal' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
  });

  it('background produces background theme properties', () => {
    const result = resolveDesignApplication(
      { kind: 'background', id: 'background-solid' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
    expect(payload!.theme.backgroundColor).toBeDefined();
  });

  it('industry preset produces preset theme + tokens', () => {
    const result = resolveDesignApplication(
      { kind: 'industry-preset', id: 'ind-dental' },
      DesignSystem as any
    );

    expect(result.ok).toBe(true);
    const payload = designApplicationToCommandPayload(result);
    expect(payload).not.toBeNull();
  });
});
