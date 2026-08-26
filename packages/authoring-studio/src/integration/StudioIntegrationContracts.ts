/**
 * StudioIntegrationContracts.ts & StudioIntegrationContext.ts — PM47 Cross-Module Contracts (ETAP 1)
 *
 * DECISION-101: Integracja odbywa się wyłącznie przez publiczne API modułów.
 *
 * Contracts, context models, and module registry interfaces for studio integration.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';

export type StudioModuleName =
  | 'timeline'
  | 'inspector'
  | 'preview'
  | 'assets'
  | 'production'
  | 'cloud'
  | 'automation'
  | 'enterprise'
  | 'plugins';

export interface StudioModuleDescriptor {
  readonly moduleName: StudioModuleName;
  readonly isInitialized: boolean;
  readonly apiVersion: string;
}

export interface StudioIntegrationContext {
  readonly sessionId: string;
  readonly activeDocument: BuilderDocument;
  readonly activeUserId: string;
  readonly registeredModules: ReadonlyArray<StudioModuleDescriptor>;
}

export function createStudioIntegrationContext(
  doc: BuilderDocument,
  userId: string = 'user-studio-1'
): StudioIntegrationContext {
  const standardModules: StudioModuleDescriptor[] = [
    { moduleName: 'timeline', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'inspector', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'preview', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'assets', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'production', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'cloud', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'automation', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'enterprise', isInitialized: true, apiVersion: '1.0.0' },
    { moduleName: 'plugins', isInitialized: true, apiVersion: '1.0.0' },
  ];

  return {
    sessionId: `studio-session-${Date.now()}`,
    activeDocument: doc,
    activeUserId: userId,
    registeredModules: standardModules,
  };
}
