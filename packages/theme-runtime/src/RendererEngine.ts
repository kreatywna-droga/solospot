import { z } from 'zod';
import { ThemeRuntime } from './ThemeRuntime';

export const StorefrontRenderContextSchema = z.object({
  tenantId: z.string().min(1),
  shopName: z.string().min(1),
  locale: z.string().min(1),
  currency: z.string().min(1),
  themeId: z.string().min(1),
  tokens: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    backgroundColor: z.string(),
    fontFamily: z.string(),
    borderRadius: z.string(),
  }),
  page: z.object({
    title: z.string(),
    type: z.enum(['home', 'product', 'product_detail', 'products_list', 'cart', 'checkout', 'account']),
    data: z.record(z.string(), z.any()),
  }),
});
export type StorefrontRenderContext = z.infer<typeof StorefrontRenderContextSchema>;

export class RendererEngine {
  private readonly themeRuntime: ThemeRuntime;

  constructor(options: { themeRuntime: ThemeRuntime }) {
    this.themeRuntime = options.themeRuntime;
  }

  /**
   * Renders layout template with variables and components in slots.
   */
  public async renderPage(
    context: StorefrontRenderContext,
    layoutTemplate: string,
    slots: Record<string, { html?: string; componentName?: string; props?: Record<string, unknown> }>,
    correlationId?: string
  ): Promise<string> {
    // 1. Validate Context
    StorefrontRenderContextSchema.parse(context);

    // 2. Generate Design Tokens Style Block
    const tokensStyles = `
<style id="theme-tokens">
  :root {
    --primary-color: ${context.tokens.primaryColor};
    --secondary-color: ${context.tokens.secondaryColor};
    --background-color: ${context.tokens.backgroundColor};
    --font-family: ${context.tokens.fontFamily};
    --border-radius: ${context.tokens.borderRadius};
  }
</style>
    `.trim();

    // 3. Interpolate basic page variables
    let html = layoutTemplate;
    html = html.replace(/<!--\s*tokens_styles\s*-->/g, tokensStyles);
    html = html.replace(/\{\{\s*tokens_styles\s*\}\}/g, tokensStyles);
    html = html.replace(/\{\{\s*page_title\s*\}\}/g, context.page.title);
    html = html.replace(/\{\{\s*shopName\s*\}\}/g, context.shopName);

    // 4. Resolve and render slots
    // Search for all comments matching <!-- slot:name -->
    const slotRegex = /<!--\s*slot:([a-zA-Z0-9_-]+)\s*-->/g;
    let match;
    const replacements: Array<{ placeholder: string; content: string }> = [];

    // Find all matches first to avoid regex execution during async awaits
    const matches: string[] = [];
    while ((match = slotRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    for (const slotName of matches) {
      const slotConfig = slots[slotName];
      const placeholder = `<!-- slot:${slotName} -->`;

      if (slotConfig?.html) {
        replacements.push({ placeholder, content: slotConfig.html });
        continue;
      }

      if (!slotConfig) {
        replacements.push({ placeholder, content: `<!-- slot:${slotName} empty -->` });
        continue;
      }

      try {
        const rendered = await this.themeRuntime.renderComponent(
          context.tenantId,
          slotConfig.componentName as string,
          slotConfig.props as Record<string, unknown>,
          correlationId
        );
        replacements.push({ placeholder, content: rendered });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorContent = `<div class="widget-error"><!-- Widget Render Error: ${errorMessage} --></div>`;
        replacements.push({ placeholder, content: errorContent });
      }
    }

    // Apply replacements
    for (const r of replacements) {
      html = html.replace(r.placeholder, r.content);
    }

    return html;
  }
}
