// ResponsiveEditor.ts
// C7: Builder Pro — responsive properties per breakpoint

import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { RuntimePage, RuntimeSection } from '../../runtime-core/src/RuntimeSection';
import { ViewportLabel } from './CanvasState';

export type Breakpoint = ViewportLabel;

export interface ResponsiveValue<T> {
  readonly desktop?: T;
  readonly tablet?: T;
  readonly mobile?: T;
}

export interface ResponsiveSectionProps {
  readonly sectionId: string;
  readonly props: Record<string, ResponsiveValue<any>>;
  readonly activeBreakpoint: Breakpoint;
}

export class ResponsiveEditor {
  private readonly breakpoints: ReadonlyArray<Breakpoint> = ['DESKTOP', 'TABLET', 'MOBILE'];
  private activeBreakpoint: Breakpoint = 'DESKTOP';

  public setBreakpoint(breakpoint: Breakpoint): void {
    this.activeBreakpoint = breakpoint;
  }

  public getActiveBreakpoint(): Breakpoint {
    return this.activeBreakpoint;
  }

  public getEffectiveProps(
    sectionId: string,
    baseProps: Record<string, any>,
    responsiveProps: Record<string, ResponsiveValue<any>>
  ): Record<string, any> {
    const effective: Record<string, any> = { ...baseProps };

    for (const [propName, responsiveValue] of Object.entries(responsiveProps)) {
      const breakpointValue = responsiveValue[this.activeBreakpoint.toLowerCase() as keyof ResponsiveValue<any>];
      if (breakpointValue !== undefined) {
        effective[propName] = breakpointValue;
      }
    }

    return effective;
  }

  public setResponsiveProp(
    sectionId: string,
    propName: string,
    value: any,
    breakpoint: Breakpoint
  ): Record<string, ResponsiveValue<any>> {
    return {
      [sectionId]: {
        ...({} as Record<string, ResponsiveValue<any>>),
        [breakpoint.toLowerCase()]: value,
      },
    };
  }

  public exportToStoreConfig(
    pages: ReadonlyArray<RuntimePage>,
    responsiveProps: Map<string, Record<string, ResponsiveValue<any>>>
  ): StoreConfig {
    const updatedPages = pages.map((page) => ({
      ...page,
      sections: page.sections.map((section: RuntimeSection) => {
        const sectionResponsive = responsiveProps.get(section.id);
        if (!sectionResponsive) {
          return section;
        }

        const effectiveProps = this.getEffectiveProps(section.id, section.props, sectionResponsive);
        return { ...section, props: effectiveProps };
      }),
    }));

    return {
      storeId: '',
      storeName: '',
      publicationStatus: 'DRAFT',
      branding: {
        primaryColor: '',
        secondaryColor: '',
        font: '',
      },
      pages: updatedPages,
    };
  }
}
