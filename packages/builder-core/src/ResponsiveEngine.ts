// ResponsiveEngine.ts
// C7.6: Builder Pro — responsive engine

import { BuilderDocument, SectionNode } from './BuilderDocument';
import { BuilderCommand } from './BuilderCommands';
import { CanvasState, ViewportLabel } from './CanvasState';

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

export class ResponsiveEngine {
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
    responsiveProps: Record<string, Record<string, ResponsiveValue<any>>>
  ): Record<string, any> {
    const effective: Record<string, any> = { ...baseProps };

    const sectionResponsive = responsiveProps[sectionId];
    if (!sectionResponsive) {
      return effective;
    }

    for (const [propName, breakpointValue] of Object.entries(sectionResponsive)) {
      const value = breakpointValue[this.activeBreakpoint.toLowerCase() as keyof ResponsiveValue<any>];
      if (value !== undefined) {
        effective[propName] = value;
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
}
