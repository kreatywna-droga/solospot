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
  nodeToApiSection,
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
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.store) {
            setStore(data.store)
            return
          }
        }

        // Offline / demo store (GET 401 or missing): restore last local save
        // written by handleSave when PATCH fails. Without this, reload drops
        // all edits and falls back to the hardcoded single-Hero demo.
        try {
          const localRaw = localStorage.getItem(`solospot_store_${id}`)
          if (localRaw) {
            const localDoc = JSON.parse(localRaw) as BuilderDocument
            if (localDoc?.pages?.length) {
              const branding = localDoc.theme ?? {}
              setStore({
                id: localDoc.id || id,
                name: localDoc.metadata?.storeName || 'SoloSpot Visual Builder',
                slug: localDoc.metadata?.storeSlug || id,
                domain: null,
                status: 'ACTIVE',
                tenantId: localDoc.tenantId || 'tenant-demo',
                config: {
                  publicationStatus: 'DRAFT',
                  branding: {
                    primaryColor: branding.primaryColor ?? '#7c3aed',
                    secondaryColor: branding.secondaryColor ?? '#f1f5f9',
                    font: branding.font ?? 'Inter',
                    logo: branding.logo,
                    favicon: branding.favicon,
                  },
                  pages: localDoc.pages.map((page) => ({
                    id: page.id,
                    name: page.name,
                    slug: page.slug,
                    sections: page.sections.map((s, idx) => nodeToApiSection(s, idx)),
                  })),
                },
              })
              return
            }
          }
        } catch {
          // corrupt local save — fall through to demo fallback
        }

        // Standalone / Offline / Demo fallback for Studio
        const fallbackStore: ApiStore = {
          id: id || 'demo-store',
          name: 'SoloSpot Visual Builder',
          slug: id || 'demo-store',
          domain: null,
          status: 'ACTIVE',
          tenantId: 'tenant-demo',
          config: {
            publicationStatus: 'DRAFT',
            branding: {
              primaryColor: '#7c3aed',
              secondaryColor: '#f1f5f9',
              font: 'Inter',
            },
            pages: [
              {
                id: 'page-home',
                name: 'Strona Główna',
                slug: '/',
                sections: [
                  {
                    id: 'sec-hero-init',
                    type: 'hero',
                    label: 'Hero',
                    config: {
                      title: 'SoloSpot Visual Builder v2.0',
                      subtitle: 'Biblioteka gotowych doświadczeń, sekcji i interakcji z podglądem na żywo',
                      cta: 'Rozpocznij zakupy',
                    },
                    order: 0,
                    visible: true,
                  },
                ],
              },
            ],
          },
        }
        setStore(fallbackStore)
      } catch {
        // Fallback store on network error as well
        setStore({
          id: storeId || 'demo-store',
          name: 'SoloSpot Visual Builder',
          slug: storeId || 'demo-store',
          domain: null,
          status: 'ACTIVE',
          tenantId: 'tenant-demo',
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params, storeId])

  const handleSave = async (doc: BuilderDocument) => {
    try {
      const patch = builderDocToApiPatch(doc)
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`solospot_store_${storeId}`, JSON.stringify(doc))
        }
        return
      }
      const data = await res.json()
      if (!data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`solospot_store_${storeId}`, JSON.stringify(doc))
        }
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`solospot_store_${storeId}`, JSON.stringify(doc))
      }
    }
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
      <div className="h-screen bg-[#121214] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Error state
  if (error || !store) {
    return (
      <div className="h-screen bg-[#121214] flex items-center justify-center">
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
