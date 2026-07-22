// ComponentContext.ts
// C6.3-E: Component Runtime Engine — runtime context for components

import { ComponentRenderContext } from './ComponentTypes';

export const ComponentContextSymbol = Symbol('ComponentContext');

export interface ComponentContextProvider {
  getContext(tenantId: string): ComponentRenderContext;
}
