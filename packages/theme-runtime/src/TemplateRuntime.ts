// TemplateRuntime.ts
// C6.3-D: Template Runtime Engine
// Renders StoreConfig pages/sections into HTML using ThemeRuntime and RendererEngine.

import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { RuntimeSection, RuntimePage } from '../../runtime-core/src/RuntimeSection';
import { ThemeRuntime } from './ThemeRuntime';
import { RendererEngine, StorefrontRenderContext } from './RendererEngine';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { SimpleAssetResolver } from '../../asset-manager-core/src/AssetResolver';
import { AssetReference } from '../../asset-manager-core/src/AssetReference';

export interface SectionRenderContext {
  tenantId: string;
  themeId: string;
  tokens: StorefrontRenderContext['tokens'];
  locale: string;
  currency: string;
  assets: SimpleAssetResolver;
}

export interface SectionRenderer {
  type: string;
  render(section: RuntimeSection, context: SectionRenderContext): Promise<string>;
}

export class TemplateRuntime {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly themeRuntime: ThemeRuntime;
  private readonly rendererEngine: RendererEngine;
  private readonly sectionRenderers = new Map<string, SectionRenderer>();
  private readonly assets: SimpleAssetResolver;

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    themeRuntime: ThemeRuntime;
    rendererEngine: RendererEngine;
    assets: SimpleAssetResolver;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.themeRuntime = options.themeRuntime;
    this.rendererEngine = options.rendererEngine;
    this.assets = options.assets;

    const templateEvents = [
      'Template.RenderStarted',
      'Template.SectionRendered',
      'Template.PageRendered',
      'Template.RenderCompleted',
      'Template.RenderFailed',
    ];
    for (const evt of templateEvents) {
      EventRegistry.register(evt);
    }

    this.registerDefaultSectionRenderers();
  }

  private registerDefaultSectionRenderers() {
    this.sectionRenderers.set('Header', {
      type: 'Header',
      render: async (section, context) => {
        const title = (section.props?.title as string) || context.locale;
        return `<header><h1>${title}</h1></header>`;
      },
    });

    this.sectionRenderers.set('Footer', {
      type: 'Footer',
      render: async (section, context) => {
        const copyright = (section.props?.copyright as string) || '';
        return `<footer>${copyright}</footer>`;
      },
    });

    this.sectionRenderers.set('Hero', {
      type: 'Hero',
      render: async (section, context) => {
        const heading = (section.props?.heading as string) || '';
        const text = (section.props?.text as string) || '';
        const imageRef = section.props?.image as { id: string; type: string } | undefined;
        let imageHtml = '';
        if (imageRef) {
          const ref = AssetReference.fromAsset(imageRef as any);
          const url = await context.assets.resolve(ref);
          imageHtml = `<img src="${url}" alt="${heading}" />`;
        }
        return `<section class="hero"><h2>${heading}</h2><p>${text}</p>${imageHtml}</section>`;
      },
    });

    this.sectionRenderers.set('ProductGrid', {
      type: 'ProductGrid',
      render: async (section, context) => {
        const limit = (section.props?.limit as number) || 8;
        return `<section class="product-grid"><p>Products (limit: ${limit})</p></section>`;
      },
    });

    this.sectionRenderers.set('FeatureList', {
      type: 'FeatureList',
      render: async (section, context) => {
        const items = Array.isArray(section.props?.items) ? section.props.items : [];
        const listItems = items.map((item: string) => `<li>${item}</li>`).join('');
        return `<section class="features"><ul>${listItems}</ul></section>`;
      },
    });

    this.sectionRenderers.set('ContactForm', {
      type: 'ContactForm',
      render: async (section, context) => {
        const email = (section.props?.email as string) || '';
        return `<section class="contact"><a href="mailto:${email}">${email}</a></section>`;
      },
    });
  }

  public registerSectionRenderer(renderer: SectionRenderer) {
    this.sectionRenderers.set(renderer.type, renderer);
  }

  public async renderSection(section: RuntimeSection, context: SectionRenderContext): Promise<string> {
    const renderer = this.sectionRenderers.get(section.type);
    if (!renderer) {
      throw new Error(`No section renderer registered for type: ${section.type}`);
    }
    return renderer.render(section, context);
  }

  public async renderPage(
    tenantId: string,
    themeId: string,
    page: RuntimePage,
    layoutTemplate: string,
    correlationId?: string
  ): Promise<string> {
    const cid = correlationId || `tpl_page_${Date.now()}`;
    await this.eventBus.publish({
      eventId: `evt_tpl_start_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Template.RenderStarted',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { pageId: page.id },
    });

    const tokens = {
      primaryColor: '#8b5cf6',
      secondaryColor: '#d946ef',
      backgroundColor: '#050508',
      fontFamily: 'Inter',
      borderRadius: '4px',
    };

    const context: SectionRenderContext = {
      tenantId,
      themeId,
      tokens,
      locale: 'pl_PL',
      currency: 'PLN',
      assets: this.assets,
    };

    const slots: Record<string, { html: string; componentName: string; props: Record<string, any> }> = {};
    const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      if (!section.visible) continue;

      const renderer = this.sectionRenderers.get(section.type);
      if (!renderer) {
        this.logger.warn({
          message: `No section renderer registered for type: ${section.type}`,
          correlationId: cid,
          tenantId,
        });
        continue;
      }

      const renderedHtml = await renderer.render(section, context);
      slots[section.id] = {
        html: renderedHtml,
        componentName: section.type,
        props: section.props,
      };

      await this.eventBus.publish({
        eventId: `evt_tpl_sec_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Template.SectionRendered',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { sectionId: section.id, sectionType: section.type },
      });
    }

    const renderContext: StorefrontRenderContext = {
      tenantId,
      shopName: page.name,
      locale: context.locale,
      currency: context.currency,
      themeId,
      tokens,
      page: {
        title: page.name,
        type: 'home',
        data: {},
      },
    };

    const finalHtml = await this.rendererEngine.renderPage(renderContext, layoutTemplate, slots, cid);

    await this.eventBus.publish({
      eventId: `evt_tpl_done_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Template.PageRendered',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { pageId: page.id },
    });

    return finalHtml;
  }
}
