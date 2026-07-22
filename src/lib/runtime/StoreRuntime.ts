import type { StoreRuntimeConfig, RuntimeResult, RuntimeSection } from './RuntimeTypes'
import { RuntimeSectionAdapter } from '../../../packages/runtime-core/src/adapters'

export class StoreRuntime {
  render(config: StoreRuntimeConfig, pageSlug?: string): RuntimeResult {
    const page = config.pages.find((p) => p.slug === (pageSlug ?? '')) || config.pages[0]

    if (!page) {
      throw new Error('No pages found in store configuration')
    }

    const sections = page.sections.map((section) =>
      RuntimeSectionAdapter.toLegacySection(
        RuntimeSectionAdapter.toRuntimeSection(section)
      )
    )

    return {
      storeName: config.storeName,
      page: { ...page, sections },
      theme: config.theme,
      products: config.products,
      navigation: config.navigation,
      seo: config.seo,
      publicationStatus: config.publicationStatus,
    }
  }
}
