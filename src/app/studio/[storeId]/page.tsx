'use client'

/**
 * Studio Page — C6.2
 *
 * Route: /studio/[storeId]
 *
 * Loads the store config from API, converts it to a BuilderDocument,
 * mounts the BuilderApp (full Visual Builder), and wires the Save API.
 *
 * Data flow:
 *   API /api/stores/[storeId]
 *       ↓ StoreConfig shape (existing + tenantId from session)
 *   apiStoreToBuilderDoc()  — see src/lib/builder/studioDoc.ts
 *       ↓ BuilderDocument (document.tenantId = REAL tenant uuid)
 *   BuilderApp (BuilderProvider + Shell)
 *       ↓ dispatch(commands)
 *   builderDocToApiPatch(doc) → StoreConfig
 *       ↓ PATCH /api/stores/[storeId]
 */

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { BuilderApp } from '../../../components/builder/BuilderApp'
import { BuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument'
import {
  ApiStore,
  apiStoreToBuilderDoc,
  builderDocToApiPatch,
} from '@/lib/builder/studioDoc'

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function StudioPage({ params }: { params: Promise<{ storeId: string }> }) {
  const [store, setStore] = useState<ApiStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const { storeId: id } = await params
        setStoreId(id)

        const res = await fetch(`/api/stores/${id}`)
        if (res.status === 403) { setError('Brak dostępu do tego sklepu'); return }
        if (res.status === 401) { setError('Musisz być zalogowany'); return }
        const data = await res.json()
        if (!data.success) { setError(data.error || 'Nie udało się załadować sklepu'); return }
        setStore(data.store)
      } catch {
        setError('Błąd połączenia z serwerem')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  const handleSave = async (doc: BuilderDocument) => {
    const patch = builderDocToApiPatch(doc)
    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Błąd zapisu')
  }

  const handlePublish = async (doc: BuilderDocument) => {
    await handleSave(doc)
    const res = await fetch(`/api/stores/${storeId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish' }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Błąd publikacji')
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Error state
  if (error || !store) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Błąd</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/dashboard/stores"
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full inline-block"
          >
            Powrót do sklepów
          </Link>
        </div>
      </div>
    )
  }

  // Builder
  const initialDocument = apiStoreToBuilderDoc(store)

  return (
    <BuilderApp
      storeId={storeId}
      initialDocument={initialDocument}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  )
}
