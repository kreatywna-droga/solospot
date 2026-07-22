import { describe, it, expect } from 'vitest';
import {
  createOutputModeStrategy,
  getModeConfig,
} from '../OutputModes';
import { createSectionRegistry, SectionRenderContext } from '../SectionRegistry';
import { createPipelineRequest } from '../PipelineRequest';
import { makeDeps, makeRequest } from './test-utils';
import { createRuntimePipeline } from '../DefaultRuntimePipeline';
import { RuntimeTheme } from '../RuntimeContext';

const THEME: RuntimeTheme = { primaryColor: '#111', secondaryColor: '#222', font: 'Inter' };

function renderContext(mode: 'LIVE' | 'PREVIEW' | 'EXPORT'): SectionRenderContext {
  return {
    storeName: 'store',
    tenantId: 'tenant',
    storeId: 'store',
    mode,
    locale: 'pl',
    currency: 'PLN',
  };
}

describe('RuntimeMode contracts', () => {
  it('returns the correct strategy per mode without branching in callers', () => {
    expect(createOutputModeStrategy('LIVE').mode).toBe('LIVE');
    expect(createOutputModeStrategy('PREVIEW').mode).toBe('PREVIEW');
    expect(createOutputModeStrategy('EXPORT').mode).toBe('EXPORT');
  });

  it('falls back to LIVE for unknown input', () => {
    expect(createOutputModeStrategy('NOPE' as never).mode).toBe('LIVE');
  });

  it('getModeConfig bundles mode and strategy', () => {
    const cfg = getModeConfig('PREVIEW');
    expect(cfg.mode).toBe('PREVIEW');
    expect(cfg.strategy.mode).toBe('PREVIEW');
  });
});

describe('LIVE output mode', () => {
  const strategy = createOutputModeStrategy('LIVE');

  it('renders sections unchanged (passthrough)', async () => {
    const reg = createSectionRegistry().register({
      type: 'hero',
      render: async () => '<div>live</div>',
    });
    const renderer = strategy.getSectionRenderer('hero', reg);
    expect(renderer).toBeDefined();
    expect(typeof renderer!.render).toBe('function');

    const html = await renderer!.render({}, THEME, renderContext('LIVE'));
    expect(html).toContain('live');
  });

  it('wrapSection returns html as-is and assemblePage is passthrough', () => {
    expect(strategy.wrapSection({ id: 's', type: 'hero', label: 'Hero', props: {}, order: 0, visible: true }, '<p>x</p>')).toBe('<p>x</p>');
    expect(strategy.assemblePage('<p>x</p>')).toBe('<p>x</p>');
  });

  it('does not expose export options', () => {
    expect(strategy.getExportOptions).toBeUndefined();
  });
});

describe('PREVIEW output mode', () => {
  const strategy = createOutputModeStrategy('PREVIEW');

  it('wraps each section in a preview marker', () => {
    const section = { id: 's-1', type: 'hero', label: 'Hero', props: {}, order: 0, visible: true };
    const wrapped = strategy.wrapSection(section, '<h1>hi</h1>');
    expect(wrapped).toContain('data-preview-id="s-1"');
    expect(wrapped).toContain('data-preview-type="hero"');
    expect(wrapped).toContain('<h1>hi</h1>');
  });

  it('assembles a full HTML preview document', () => {
    const doc = strategy.assemblePage('<section>body</section>');
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<body>');
    expect(doc).toContain('body');
  });

  it('only renders when context mode is PREVIEW', () => {
    expect(strategy.canRenderSection({ id: 's', type: 'hero', label: 'Hero', props: {}, order: 0, visible: true }, { mode: 'PREVIEW' } as never)).toBe(true);
    expect(strategy.canRenderSection({ id: 's', type: 'hero', label: 'Hero', props: {}, order: 0, visible: true }, { mode: 'LIVE' } as never)).toBe(false);
  });

  it('drives the pipeline output for PREVIEW requests', async () => {
    const pipeline = createRuntimePipeline(makeDeps());
    const result = await pipeline.execute(makeRequest({ mode: 'PREVIEW' }));
    const html = result.stageResults.find((s) => s.stageName === 'render-sections')?.data as string;
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('data-preview-type');
  });
});

describe('EXPORT output mode', () => {
  const strategy = createOutputModeStrategy('EXPORT');

  it('assembles a full HTML export document', () => {
    const doc = strategy.assemblePage('<div>export</div>');
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<body>');
    expect(doc).toContain('export');
  });

  it('exposes export options', () => {
    expect(strategy.getExportOptions?.()).toMatchObject({
      inlineStyles: true,
      removeScripts: true,
    });
  });

  it('strips script/style tags from rendered sections', async () => {
    const reg = createSectionRegistry().register({
      type: 'hero',
      render: async () =>
        '<div>ok</div><script>alert(1)</script><style>.x{}</style>',
    });
    const renderer = strategy.getSectionRenderer('hero', reg);
    const html = await renderer!.render({}, THEME, renderContext('EXPORT'));
    expect(html).toContain('ok');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<style');
  });

  it('skips draft sections', () => {
    const draft = { id: 's', type: 'draft-banner', label: 'B', props: {}, order: 0, visible: true };
    expect(strategy.canRenderSection(draft, { mode: 'EXPORT' } as never)).toBe(false);
    const normal = { id: 's', type: 'hero', label: 'Hero', props: {}, order: 0, visible: true };
    expect(strategy.canRenderSection(normal, { mode: 'EXPORT' } as never)).toBe(true);
  });

  it('drives the pipeline output for EXPORT requests', async () => {
    const pipeline = createRuntimePipeline(makeDeps());
    const result = await pipeline.execute(makeRequest({ mode: 'EXPORT' }));
    const html = result.stageResults.find((s) => s.stageName === 'render-sections')?.data as string;
    expect(html).toContain('<!DOCTYPE html>');
  });
});
