import { describe, it, expect } from 'vitest';
import {
  buildCompositionDecisions,
  compositionDecisionsToCommands,
} from '../CompositionIntelligence';
import { buildVisualLanguageCommandPlan } from '../VisualLanguageApplication';
import { createBuilderContext, createBuilderComponentRegistry, createMemoryChannel } from '../../../../packages/builder-core/src/index';
import { VISUAL_LANGUAGES } from '../VisualLanguages';

describe('CompositionIntelligence — Gate v2.0', () => {
  const ctx = createBuilderContext({
    document: {
      id: 'test-doc',
      tenantId: 'test-tenant',
      version: 1,
      isDirty: false,
      metadata: { storeName: 'Test', storeSlug: 'test' },
      pages: [
        {
          id: 'page-1',
          slug: 'home',
          name: 'Home',
          sections: [
            {
              id: 'hero-1',
              type: 'hero',
              label: 'Hero Section',
              styles: {},
              props: {},
              children: [],
              order: 0,
              visible: true,
            },
            {
              id: 'section-1',
              type: 'section',
              label: 'Features',
              styles: {},
              props: {},
              children: [],
              order: 1,
              visible: true,
            },
            {
              id: 'card-1',
              type: 'card',
              label: 'Product Card',
              styles: {},
              props: {},
              children: [],
              order: 2,
              visible: true,
            },
            {
              id: 'cta-1',
              type: 'cta',
              label: 'Call to Action',
              styles: {},
              props: {},
              children: [],
              order: 3,
              visible: true,
            },
          ],
          seo: {},
        },
      ],
      theme: {
        primaryColor: '#D9A86C',
        secondaryColor: '#F2C27F',
        backgroundColor: '#090910',
        font: 'Inter',
        borderRadius: '12px',
        appliedStylePackId: null,
        tokens: {},
      },
    },
    registry: createBuilderComponentRegistry(),
    preview: createMemoryChannel().builderChannel,
  });

  for (const lang of VISUAL_LANGUAGES) {
    it(`${lang.name}: produces composition decisions for hero/section/card/cta`, () => {
      const decisions = buildCompositionDecisions({
        document: ctx.document,
        visualLanguage: lang,
        targetPageId: 'page-1',
      });

      expect(decisions.length, `${lang.name} should produce composition decisions`).toBeGreaterThan(0);
    });

    it(`${lang.name}: converts decisions to valid BuilderCommands`, () => {
      const decisions = buildCompositionDecisions({
        document: ctx.document,
        visualLanguage: lang,
        targetPageId: 'page-1',
      });

      const commands = compositionDecisionsToCommands(decisions, 'page-1');
      expect(commands.length, `${lang.name} should produce commands`).toBeGreaterThan(0);
      for (const cmd of commands) {
        expect(['SET_NODE_STYLES']).toContain(cmd.type);
      }
    });

    it(`${lang.name}: produces composition with language-specific values`, () => {
      const decisions = buildCompositionDecisions({
        document: ctx.document,
        visualLanguage: lang,
        targetPageId: 'page-1',
      });

      const paddingDecisions = decisions.filter((d) => d.property === 'paddingTop' || d.property === 'paddingBottom');
      expect(paddingDecisions.length).toBeGreaterThan(0);
      const values = [...new Set(paddingDecisions.map((d) => d.value))];
      expect(values.length).toBeGreaterThanOrEqual(1);
    });
  }

  it('Luxury Editorial produces sparse spacing', () => {
    const lang = VISUAL_LANGUAGES.find((l) => l.id === 'luxury-editorial')!;
    const decisions = buildCompositionDecisions({
      document: ctx.document,
      visualLanguage: lang,
      targetPageId: 'page-1',
    });

    const paddingDecisions = decisions.filter((d) => d.property === 'paddingTop' || d.property === 'paddingBottom');
    expect(paddingDecisions.length).toBeGreaterThan(0);
    for (const d of paddingDecisions) {
      expect(d.value).toBe('120px');
    }
  });

  it('Modern Technology produces structured spacing', () => {
    const lang = VISUAL_LANGUAGES.find((l) => l.id === 'modern-technology')!;
    const decisions = buildCompositionDecisions({
      document: ctx.document,
      visualLanguage: lang,
      targetPageId: 'page-1',
    });

    const paddingDecisions = decisions.filter((d) => d.property === 'paddingTop' || d.property === 'paddingBottom');
    expect(paddingDecisions.length).toBeGreaterThan(0);
    for (const d of paddingDecisions) {
      expect(d.value).toBe('80px');
    }
  });

  it('commands can be dispatched to mutate BuilderDocument', () => {
    const lang = VISUAL_LANGUAGES.find((l) => l.id === 'luxury-editorial')!;
    const decisions = buildCompositionDecisions({
      document: ctx.document,
      visualLanguage: lang,
      targetPageId: 'page-1',
    });
    const commands = compositionDecisionsToCommands(decisions, 'page-1');

    const nextCtx = ctx.dispatch(commands[0]);
    expect(nextCtx.document).not.toBe(ctx.document);
  });

  it('buildVisualLanguageCommandPlan produces complete plan', () => {
    const lang = VISUAL_LANGUAGES.find((l) => l.id === 'cinematic-creative')!;
    const plan = buildVisualLanguageCommandPlan(lang, ctx.document, 'page-1');

    expect(plan.visualLanguageId).toBe('cinematic-creative');
    expect(plan.compositionCommands.length).toBeGreaterThan(0);
    expect(plan.compositionDecisionsCount).toBeGreaterThan(0);
    expect(plan.summary.length).toBeGreaterThan(0);
  });
});

