import { RuntimeResult } from '../RuntimeResult';
import { RuntimePage, RuntimeSection as CoreRuntimeSection } from '../RuntimeSection';
import { RuntimeTheme, RuntimeProduct, RuntimeNavigation, RuntimeSEO } from '../RuntimeContext';
import { RuntimeSectionAdapter } from './RuntimeSectionAdapter';

interface LegacyRuntimeResult {
  readonly storeName: string;
  readonly page: LegacyRuntimePage;
  readonly theme: LegacyRuntimeTheme;
  readonly products: LegacyRuntimeProduct[];
  readonly navigation?: LegacyRuntimeNavigation[];
  readonly seo?: LegacyRuntimeSEO;
  readonly publicationStatus: string;
}

interface LegacyRuntimeTheme {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly font: string;
  readonly logo?: string;
  readonly favicon?: string;
  readonly description?: string;
}

interface LegacyRuntimePage {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly sections: LegacyRuntimeSection[];
}

interface LegacyRuntimeSection {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly config: Record<string, unknown>;
}

interface LegacyRuntimeProduct {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly currency: string;
  readonly images: string[];
}

interface LegacyRuntimeNavigation {
  readonly label: string;
  readonly href: string;
  readonly children?: LegacyRuntimeNavigation[];
}

interface LegacyRuntimeSEO {
  readonly title?: string;
  readonly description?: string;
  readonly ogImage?: string;
}

interface LegacyMetadata {
  readonly products?: LegacyRuntimeProduct[];
  readonly navigation?: LegacyRuntimeNavigation[];
  readonly seo?: LegacyRuntimeSEO;
  readonly publicationStatus?: string;
  readonly storeName?: string;
  readonly template?: string;
}

/**
 * Stateless adapter transforming legacy RuntimeResult to core RuntimeResult.
 *
 * No dependencies on RuntimeEngine, StoreRuntimeEngine, StorefrontRuntime, or resolvers.
 * Pure data transformation only.
 */
export class RuntimeResultAdapter {
  /**
   * Transform legacy RuntimeResult to core RuntimeResult.
   *
   * @param legacy - Legacy runtime result from src/lib/runtime
   * @param tenantId - Tenant identifier (required for core contract)
   * @param storeId - Store identifier (required for core contract)
   * @param version - Runtime version (required for core contract)
   * @param slug - Page slug (required for core contract)
   * @param mode - Runtime mode (LIVE | PREVIEW | EXPORT)
   * @returns Core RuntimeResult
   */
  static toRuntimeCoreResult(
    legacy: LegacyRuntimeResult,
    tenantId: string,
    storeId: string,
    version: string,
    slug: string,
    mode: 'LIVE' | 'PREVIEW' | 'EXPORT' = 'LIVE'
  ): RuntimeResult {
    const coreSections = legacy.page.sections.map(this.mapSection);
    const coreTheme = this.mapTheme(legacy.theme);
    const corePage = this.mapPage(legacy.page, coreSections);
    const coreProducts = legacy.products.map(this.mapProduct);
    const coreNavigation = legacy.navigation?.map((n) => this.mapNavigation(n));
    const coreSeo = legacy.seo ? this.mapSeo(legacy.seo) : undefined;

    return {
      success: true,
      tenantId,
      storeId,
      slug,
      version,
      page: corePage,
      sections: coreSections,
      theme: coreTheme,
      errors: undefined,
      metadata: {
        products: coreProducts,
        navigation: coreNavigation,
        seo: coreSeo,
        publicationStatus: legacy.publicationStatus,
        storeName: legacy.storeName,
      },
      mode,
      renderedAt: undefined,
    };
  }

  /**
   * Transform core RuntimeResult to legacy RuntimeResult.
   *
   * TRANSITIONAL COMPATIBILITY ADAPTER.
   * Scheduled for removal after legacy runtime migration.
   *
   * @param core - Core runtime result
   * @returns Legacy RuntimeResult
   */
  static toLegacyResult(core: RuntimeResult): LegacyRuntimeResult {
    const legacySections = core.sections.map(this.mapSectionToLegacy);
    const legacyTheme = this.mapThemeToLegacy(core.theme);
    const legacyPage = this.mapPageToLegacy(core.page, legacySections);
    const metadata = core.metadata as LegacyMetadata | undefined;
    const legacyProducts = metadata?.products?.map(this.mapProductToLegacy) || [];
    const legacyNavigation = metadata?.navigation?.map((n) => this.mapNavigationToLegacy(n)) || [];
    const legacySeo = metadata?.seo ? this.mapSeoToLegacy(metadata.seo) : undefined;

    return {
      storeName: (metadata?.storeName as string) || core.page.name,
      page: legacyPage,
      theme: legacyTheme,
      products: legacyProducts,
      navigation: legacyNavigation,
      seo: legacySeo,
      publicationStatus: (metadata?.publicationStatus as string) || 'DRAFT',
    };
  }

  // --- Legacy → Core mappers ---

  private static mapSection(legacy: LegacyRuntimeSection): CoreRuntimeSection {
    return RuntimeSectionAdapter.toRuntimeSection(legacy);
  }

  private static mapTheme(legacy: LegacyRuntimeTheme): RuntimeTheme {
    return {
      primaryColor: legacy.primaryColor,
      secondaryColor: legacy.secondaryColor,
      font: legacy.font,
      logo: legacy.logo,
      favicon: legacy.favicon,
      description: legacy.description,
    };
  }

  private static mapPage(legacy: LegacyRuntimePage, sections: CoreRuntimeSection[]): RuntimePage {
    return {
      id: legacy.id,
      slug: legacy.slug,
      name: legacy.name,
      sections,
    };
  }

  private static mapProduct(legacy: LegacyRuntimeProduct): RuntimeProduct {
    return {
      id: legacy.id,
      name: legacy.name,
      description: legacy.description,
      price: legacy.price,
      currency: legacy.currency,
      images: [...legacy.images],
    };
  }

  private static mapNavigation(legacy: LegacyRuntimeNavigation): RuntimeNavigation {
    return {
      label: legacy.label,
      href: legacy.href,
      children: legacy.children?.map((c) => this.mapNavigation(c)),
    };
  }

  private static mapSeo(legacy: LegacyRuntimeSEO): RuntimeSEO {
    return {
      title: legacy.title,
      description: legacy.description,
      ogImage: legacy.ogImage,
      canonicalUrl: undefined,
      robots: undefined,
      jsonLdSchema: undefined,
    };
  }

  // --- Core → Legacy mappers (transitional) ---

  private static mapSectionToLegacy(core: CoreRuntimeSection): LegacyRuntimeSection {
    return RuntimeSectionAdapter.toLegacySection(core);
  }

  private static mapThemeToLegacy(core: RuntimeTheme): LegacyRuntimeTheme {
    return {
      primaryColor: core.primaryColor,
      secondaryColor: core.secondaryColor,
      font: core.font,
      logo: core.logo,
      favicon: core.favicon,
      description: core.description,
    };
  }

  private static mapPageToLegacy(core: RuntimePage, sections: LegacyRuntimeSection[]): LegacyRuntimePage {
    return {
      id: core.id,
      slug: core.slug,
      name: core.name,
      sections,
    };
  }

  private static mapProductToLegacy(core: RuntimeProduct): LegacyRuntimeProduct {
    return {
      id: core.id,
      name: core.name,
      description: core.description,
      price: core.price,
      currency: core.currency,
      images: [...core.images],
    };
  }

  private static mapNavigationToLegacy(core: RuntimeNavigation): LegacyRuntimeNavigation {
    return {
      label: core.label,
      href: core.href,
      children: core.children?.map((c) => this.mapNavigationToLegacy(c)),
    };
  }

  private static mapSeoToLegacy(core: RuntimeSEO): LegacyRuntimeSEO {
    return {
      title: core.title,
      description: core.description,
      ogImage: core.ogImage,
    };
  }
}