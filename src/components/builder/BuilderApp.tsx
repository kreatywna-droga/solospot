'use client'

/**
 * BuilderApp — C16 Studio Shell (Studio 2.0 Entry Point)
 *
 * Public API for Studio/Builder integration.
 * Delegates to the new BuilderShellWithProvider from shell/.
 *
 * Usage:
 *   <BuilderApp storeId={id} initialDocument={doc} onSave={fn} />
 *
 * See also:
 *   BuilderShellWithProvider — the actual Studio 2.0 layout
 *   BuilderShell           — the layout shell
 *   BuilderTopBar          — toolbar
 *   BuilderLeftSidebar     — Pages, Layers, Assets, Components
 *   BuilderBottomBar       — status bar
 */

import { BuilderDocument } from '../../../packages/builder-core/src/BuilderDocument'
import { BuilderShellWithProvider } from './shell/BuilderShell'

export interface BuilderAppProps {
  storeId: string
  /** Initial BuilderDocument loaded from API */
  initialDocument?: BuilderDocument
  onSave?: (doc: BuilderDocument) => Promise<void>
}

export function BuilderApp({ storeId, initialDocument, onSave }: BuilderAppProps) {
  return (
    <BuilderShellWithProvider
      storeId={storeId}
      initialDocument={initialDocument}
      onSave={onSave}
    />
  )
}
