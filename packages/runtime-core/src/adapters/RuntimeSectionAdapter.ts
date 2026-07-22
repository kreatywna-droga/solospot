import { RuntimeSection as CoreRuntimeSection } from '../RuntimeSection';

interface LegacyRuntimeSection {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly config: Record<string, unknown>;
}

interface LegacyPageSection {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly config: Record<string, unknown>;
  readonly order: number;
}

/**
 * Stateless adapter transforming legacy PageSection / LegacyRuntimeSection
 * to core RuntimeSection and vice versa.
 *
 * No dependencies on RuntimeEngine, StoreRuntimeEngine, StorefrontRuntime, or resolvers.
 * Pure data transformation only.
 */
export class RuntimeSectionAdapter {
  /**
   * Transform legacy LegacyRuntimeSection to core RuntimeSection.
   *
   * @param legacy - Legacy runtime section (from src/lib/runtime or legacy API)
   * @returns Core RuntimeSection
   */
  static toRuntimeSection(legacy: LegacyRuntimeSection): CoreRuntimeSection {
    return {
      id: legacy.id,
      type: legacy.type,
      label: legacy.label,
      props: legacy.config,
      order: 0,
      visible: true,
    };
  }

  /**
   * Transform legacy PageSection (from Studio/page API) to core RuntimeSection.
   *
   * @param pageSection - Page section from Studio page data
   * @returns Core RuntimeSection
   */
  static toRuntimeSectionFromPageSection(pageSection: LegacyPageSection): CoreRuntimeSection {
    return {
      id: pageSection.id,
      type: pageSection.type,
      label: pageSection.label,
      props: pageSection.config,
      order: pageSection.order,
      visible: true,
    };
  }

  /**
   * Transform core RuntimeSection to legacy LegacyRuntimeSection.
   *
   * TRANSITIONAL COMPATIBILITY ADAPTER.
   * Scheduled for removal after legacy runtime migration.
   *
   * @param core - Core runtime section
   * @returns Legacy RuntimeSection
   */
  static toLegacySection(core: CoreRuntimeSection): LegacyRuntimeSection {
    return {
      id: core.id,
      type: core.type,
      label: core.label,
      config: core.props,
    };
  }

  /**
   * Transform array of legacy LegacyRuntimeSection to core RuntimeSection[].
   *
   * @param legacy - Array of legacy runtime sections
   * @returns Array of core RuntimeSection
   */
  static toRuntimeSections(legacy: LegacyRuntimeSection[]): CoreRuntimeSection[] {
    return legacy.map(this.toRuntimeSection);
  }

  /**
   * Transform array of legacy PageSection to core RuntimeSection[].
   *
   * @param pageSections - Array of page sections from Studio
   * @returns Array of core RuntimeSection
   */
  static toRuntimeSectionsFromPageSections(pageSections: LegacyPageSection[]): CoreRuntimeSection[] {
    return pageSections.map(this.toRuntimeSectionFromPageSection);
  }

  /**
   * Transform array of core RuntimeSection to legacy LegacyRuntimeSection[].
   *
   * TRANSITIONAL COMPATIBILITY ADAPTER.
   * Scheduled for removal after legacy runtime migration.
   *
   * @param core - Array of core runtime sections
   * @returns Array of legacy RuntimeSection
   */
  static toLegacySections(core: CoreRuntimeSection[]): LegacyRuntimeSection[] {
    return core.map(this.toLegacySection);
  }
}