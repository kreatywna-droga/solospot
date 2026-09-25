import { describe, it, expect } from 'vitest';
import {
  createBuilderContext,
  createBuilderComponentRegistry,
  createMemoryChannel,
} from '../../../../packages/builder-core/src/index';
import {
  buildTypographyApplicationPlan,
  buildFullCompositionPlan,
  resolveSemanticRoles,
  validateRoleContrast,
  collectTypographyNodes,
  collectCardNodes,
} from '../DesignApplyRepair';
import { validateDesignQuality, DESIGN_QUALITY_RULES } from '../DesignQualityRules';
import { contrastRatio } from '../../../../packages/design-system/src/contrast';

function makeDoc(overrides: any = {}) {
  const doc: any = {
    id: 'test-doc',
    tenantId: 'test-tenant',
    version: 1,
    isDirty: false,
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#f1f5f9',
      font: 'Inter',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      ...(overrides.theme || {}),
    },
    pages: [
      {
        id: 'page-1',
        slug: 'home',
        name: 'Home',
        seo: {},
        isHome: true,
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            label: 'Hero Section',
            styles: { fontFamily: 'Inter', color: '#ffffff' },
            props: {},
            children: [
              {
                id: 'heading-1',
                type: 'heading',
                label: 'Hero Headline',
                styles: { fontFamily: 'Inter', color: '#ffffff' },
                props: { text: 'Welcome' },
                children: [],
                order: 0,
                visible: true,
                locked: false,
              },
            ],
            order: 0,
            visible: true,
            locked: false,
          },
          {
            id: 'section-1',
            type: 'section',
            label: 'Features',
            styles: { fontFamily: 'Inter' },
            props: {},
            children: [
              {
                id: 'card-1',
                type: 'card',
                label: 'Product Card',
                styles: { backgroundColor: '#ffffff', color: '#0a0a0f', fontFamily: 'Inter' },
                props: {},
                children: [],
                order: 0,
                visible: true,
                locked: false,
              },
              {
                id: 'cta-1',
                type: 'button',
                label: 'Buy Now',
                styles: { backgroundColor: '#D9A86C', color: '#ffffff' },
                props: {},
                children: [],
                order: 1,
                visible: true,
                locked: false,
              },
            ],
            order: 1,
            visible: true,
            locked: false,
          },
        ],
      },
    ],
    ...(overrides.doc || {}),
  };
  return createBuilderContext({
    document: doc,
    registry: createBuilderComponentRegistry(),
    preview: createMemoryChannel().builderChannel,
  });
}

describe('DesignApplyRepair — FONT PERSISTENCE (Phase 1–4)', () => {
  it('buildTypographyApplicationPlan writes fontFamily to typography nodes via SET_NODE_STYLES', () => {
    const ctx = makeDoc();
    const doc = ctx.document;

    // BEFORE: node-level fontFamily is "Inter" (the stale default).
    const before = collectTypographyNodes(doc);
    expect(before.length).toBeGreaterThan(0);
    expect(before.every((n) => n.styles?.fontFamily === 'Inter')).toBe(true);

    // Apply Playfair Display.
    const plan = buildTypographyApplicationPlan(doc, {
      heading: 'Playfair Display',
      body: 'Lato',
    });

    // Theme SSOT patch.
    expect(plan.theme.font).toBe('Playfair Display');
    expect(plan.theme.bodyFont).toBe('Lato');

    // Node-level commands must exist and target fontFamily.
    expect(plan.nodeCommands.length).toBeGreaterThan(0);
    for (const cmd of plan.nodeCommands) {
      expect(cmd.type).toBe('SET_NODE_STYLES');
      expect((cmd as any).styles.fontFamily).toBeDefined();
    }

    // Heading nodes get the heading font; the plan is deterministic.
    const headingTargets = collectTypographyNodes(doc).filter((n) => n.type === 'heading');
    expect(plan.nodeCommands.some((c: any) => c.nodeId === headingTargets[0].id)).toBe(true);
  });

  it('plan skips nodes that already match (idempotent, deterministic)', () => {
    const ctx = makeDoc();
    const doc = ctx.document;
    const plan1 = buildTypographyApplicationPlan(doc, { heading: 'Playfair Display' });
    // Re-run on the same unchanged document — same commands (deterministic).
    const plan2 = buildTypographyApplicationPlan(doc, { heading: 'Playfair Display' });
    expect(plan1.nodeCommands.length).toBe(plan2.nodeCommands.length);
  });
});

describe('DesignApplyRepair — CARD CONTRAST / SEMANTIC ROLES (Phase 5–6)', () => {
  it('light surface forces dark text (no light-on-light)', () => {
    const roles = resolveSemanticRoles({
      background: '#ffffff',
      surface: '#ffffff',
      text: '#ffffff', // intentionally light — must be corrected
    });
    // cardText must be dark on a light card background.
    expect(contrastRatio(roles.cardText, roles.cardBackground)).toBeGreaterThanOrEqual(4.5);
    expect(relativeLumDark(roles.cardText)).toBe(true);
  });

  it('dark surface forces light text (no dark-on-dark)', () => {
    const roles = resolveSemanticRoles({
      background: '#0a0a0f',
      surface: '#0a0a0f',
      text: '#0a0a0f', // intentionally dark — must be corrected
    });
    expect(contrastRatio(roles.cardText, roles.cardBackground)).toBeGreaterThanOrEqual(4.5);
    expect(relativeLumDark(roles.cardText)).toBe(false);
  });

  it('validateRoleContrast passes for a resolved safe role set', () => {
    const roles = resolveSemanticRoles({
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#1a1a1a',
      accent: '#D9A86C',
      cta: '#B8893A',
    });
    const report = validateRoleContrast(roles);
    expect(report.pass).toBe(true);
    expect(report.violations).toHaveLength(0);
  });

  it('button text reads on button background', () => {
    const roles = resolveSemanticRoles({ cta: '#B8893A', surface: '#ffffff' });
    expect(contrastRatio(roles.buttonText, roles.buttonBackground)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('DesignApplyRepair — COMPOSITION COMPLETENESS (Phase 7–10)', () => {
  it('buildFullCompositionPlan writes real node styles for sections, cards, CTA', () => {
    const ctx = makeDoc();
    const doc = ctx.document;

    const plan = buildFullCompositionPlan(
      doc,
      {
        font: { heading: 'Playfair Display', body: 'Lato' },
        colors: { background: '#ffffff', surface: '#ffffff', primary: '#D9A86C' },
        radius: '12px',
        cardPadding: '24px',
        sectionPaddingTop: '96px',
      }
    );

    // Theme patch present.
    expect(plan.theme.font).toBe('Playfair Display');
    // Real node commands present (typography + section + card + cta).
    expect(plan.nodeCommands.length).toBeGreaterThan(0);

    const types = new Set(plan.nodeCommands.map((c) => c.type));
    expect(types.has('SET_NODE_STYLES')).toBe(true);

    // Card gets relational bg + text (light card → dark text).
    const cardCmd = plan.nodeCommands.find(
      (c: any) => c.nodeId === 'card-1'
    ) as any;
    expect(cardCmd).toBeDefined();
    expect(cardCmd.styles.color).toBeDefined();
    expect(contrastRatio(cardCmd.styles.color, cardCmd.styles.backgroundColor)).toBeGreaterThanOrEqual(4.5);

    // CTA gets button bg + readable button text.
    const ctaCmd = plan.nodeCommands.find((c: any) => c.nodeId === 'cta-1') as any;
    expect(ctaCmd).toBeDefined();
    expect(contrastRatio(ctaCmd.styles.color, ctaCmd.styles.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  });

  it('full composition plan is deterministic (same output for same input)', () => {
    const ctx = makeDoc();
    const doc = ctx.document;
    const a = buildFullCompositionPlan(doc, { font: { heading: 'Playfair Display' }, colors: { surface: '#ffffff' } });
    const b = buildFullCompositionPlan(doc, { font: { heading: 'Playfair Display' }, colors: { surface: '#ffffff' } });
    expect(a.nodeCommands.length).toBe(b.nodeCommands.length);
    expect(JSON.stringify(a.nodeCommands)).toBe(JSON.stringify(b.nodeCommands));
  });
});

describe('DesignQualityRules — Phase 11', () => {
  it('exposes all ten design quality rules', () => {
    expect(DESIGN_QUALITY_RULES).toHaveLength(10);
    const ids = DESIGN_QUALITY_RULES.map((r) => r.id);
    expect(ids).toContain('RULE_1_READABLE_TEXT');
    expect(ids).toContain('RULE_9_CANVAS_EQUALS_DOCUMENT');
    expect(ids).toContain('RULE_8_RELOAD_PERSISTS');
  });

  it('rejects unreadable text', () => {
    const report = validateDesignQuality({ fg: '#ffffff', bg: '#ffffff', label: 'test' });
    expect(report.pass).toBe(false);
    expect(report.violations.some((v) => v.rule === 'RULE_1_READABLE_TEXT')).toBe(true);
  });

  it('accepts readable text', () => {
    const report = validateDesignQuality({ fg: '#0a0a0f', bg: '#ffffff', label: 'test' });
    expect(report.pass).toBe(true);
  });
});

function relativeLumDark(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}
