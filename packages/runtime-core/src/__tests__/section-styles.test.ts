/**
 * P0 FOUNDATION GATE — runtime carries section position (styles/responsive).
 *
 * FIRST BREAK (production, scratch/p0-responsive-fresh.json): the builder
 * persists node position in `styles.translateX/Y` (+ `responsive.tablet/mobile`
 * overrides), but every hop of the runtime chain dropped it:
 *   composition normalize → RuntimeSectionAdapter → renderStore legacy maps →
 *   store pages → SectionRenderer.
 * Result: the live site rendered sections at their natural position while the
 * builder canvas showed the saved offset (x=471 instead of x=535).
 *
 * These tests pin the two independent runtime paths:
 *  1. pipeline path — DefaultRuntimeCompositionEngine.normalizeSection keeps
 *     styles/responsive through compose() (snapshot.configuration.pages)
 *  2. legacy fallback path — RuntimeSectionAdapter round-trip keeps them
 *     (toRuntimeSection / toRuntimeSectionFromPageSection / toLegacySection)
 */
import { describe, it, expect } from 'vitest';
import { DefaultRuntimeCompositionEngine } from '../DefaultRuntimeCompositionEngine';
import { RuntimeSectionAdapter } from '../adapters/RuntimeSectionAdapter';
import { createRuntimeSection } from '../RuntimeSection';

const STORE_CONFIG = {
  name: 'P0 Test Store',
  publicationStatus: 'PUBLISHED',
  pages: [
    {
      id: 'page-home',
      slug: '',
      name: 'Home',
      sections: [
        {
          id: 'sec-hero-init',
          type: 'hero',
          label: 'Hero',
          config: { title: 'Welcome' },
          order: 0,
          styles: { translateX: '100px', translateY: '40px' },
          responsive: {
            tablet: { translateX: '60px', translateY: '0px' },
          },
        },
      ],
    },
  ],
};

const TENANT_CONTEXT = {
  tenantId: 'tenant-demo',
  slug: 's-demo',
  domains: { primary: 'demo.solospot.pl' },
  plan: { tier: 'FREE' as const, limits: {} },
  capabilities: [],
  metadata: { locale: 'pl', currency: 'PLN' },
};

describe('runtime composition keeps section position (styles/responsive)', () => {
  it('1. pipeline path: compose() normalizes sections with styles + responsive intact', async () => {
    const engine = new DefaultRuntimeCompositionEngine({
      storeRepo: {
        getStoreBySlug: async () => ({
          id: 'store-123',
          tenantId: 'tenant-demo',
          name: 'P0 Test Store',
          config: STORE_CONFIG as any,
        }),
      },
      productRepo: {
        getProductsByStore: async () => [],
      },
    });

    const snapshot = await engine.compose(TENANT_CONTEXT as any);
    const configuration = snapshot.configuration as any;
    const sections = configuration.pages[0].sections;

    expect(sections).toHaveLength(1);
    expect(sections[0].styles).toEqual({ translateX: '100px', translateY: '40px' });
    expect(sections[0].responsive).toEqual({
      tablet: { translateX: '60px', translateY: '0px' },
    });
    // props still normalized from config (existing contract unchanged)
    expect(sections[0].props).toEqual({ title: 'Welcome' });
    expect(sections[0].visible).toBe(true);
  });

  it('2. legacy path: toRuntimeSection keeps styles/responsive from an API section', () => {
    const apiSection = STORE_CONFIG.pages[0].sections[0];
    const runtime = RuntimeSectionAdapter.toRuntimeSection(apiSection as any);
    expect(runtime.styles).toEqual({ translateX: '100px', translateY: '40px' });
    expect(runtime.responsive).toEqual({
      tablet: { translateX: '60px', translateY: '0px' },
    });
  });

  it('3. legacy path: toRuntimeSectionFromPageSection keeps styles/responsive', () => {
    const pageSection = STORE_CONFIG.pages[0].sections[0];
    const runtime = RuntimeSectionAdapter.toRuntimeSectionFromPageSection(pageSection as any);
    expect(runtime.styles).toEqual({ translateX: '100px', translateY: '40px' });
    expect(runtime.responsive).toEqual({
      tablet: { translateX: '60px', translateY: '0px' },
    });
  });

  it('4. round-trip: toLegacySection returns styles + responsive for renderStore', () => {
    const apiSection = STORE_CONFIG.pages[0].sections[0];
    const legacy = RuntimeSectionAdapter.toLegacySection(
      RuntimeSectionAdapter.toRuntimeSection(apiSection as any)
    );
    expect(legacy.styles).toEqual({ translateX: '100px', translateY: '40px' });
    expect(legacy.responsive).toEqual({
      tablet: { translateX: '60px', translateY: '0px' },
    });
  });

  it('5. contract: sections without styles produce no styles/responsive keys', () => {
    const plain = RuntimeSectionAdapter.toRuntimeSection({
      id: 'sec-plain',
      type: 'content',
      label: 'Content',
      config: {},
    } as any);
    expect(plain.styles).toBeUndefined();
    expect(plain.responsive).toBeUndefined();
    const created = createRuntimeSection('s1', 'hero', 'Hero', {}, 0, true);
    expect(created.styles).toBeUndefined();
  });
});
