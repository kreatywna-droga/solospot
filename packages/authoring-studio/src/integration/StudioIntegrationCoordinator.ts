/**
 * StudioIntegrationCoordinator.ts — PM47 Studio Integration Coordinator (ETAP 1)
 *
 * DECISION-101: Integracja odbywa się wyłącznie przez publiczne API modułów.
 *
 * Cross-module integration coordinator connecting Timeline -> Inspector -> Preview -> Assets -> Production -> Cloud -> Automation -> Enterprise.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { StudioIntegrationContext } from './StudioIntegrationContracts';
import { createStudioIntegrationContext } from './StudioIntegrationContracts';

export interface ModuleCoordinationResult {
  readonly context: StudioIntegrationContext;
  readonly status: 'coordinated' | 'error';
  readonly errors: ReadonlyArray<string>;
}

export function coordinateStudioModules(
  doc: BuilderDocument,
  userId: string = 'user-studio-1'
): ModuleCoordinationResult {
  const context = createStudioIntegrationContext(doc, userId);
  const uninitialized = context.registeredModules.filter((m) => !m.isInitialized);

  if (uninitialized.length > 0) {
    return {
      context,
      status: 'error',
      errors: uninitialized.map((m) => `Module "${m.moduleName}" is uninitialized.`),
    };
  }

  return {
    context,
    status: 'coordinated',
    errors: [],
  };
}
