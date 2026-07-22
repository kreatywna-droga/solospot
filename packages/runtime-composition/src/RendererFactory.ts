import { StoreRenderer, RendererFactory as RendererFactoryInterface } from '../../runtime-core/src/RuntimeEngine';

export interface RendererFactory extends RendererFactoryInterface {}

export interface RendererConstructor {
  new (...args: unknown[]): StoreRenderer;
}

export function createRendererFactory(
  rendererConstructors: Map<string, RendererConstructor>
): RendererFactory {
  return {
    createRenderer(themeId: string, version: string, settings: Record<string, unknown>): StoreRenderer {
      const Constructor = rendererConstructors.get(themeId);
      if (!Constructor) {
        throw new Error(`No renderer constructor registered for theme: ${themeId}`);
      }
      return new Constructor();
    },
  };
}