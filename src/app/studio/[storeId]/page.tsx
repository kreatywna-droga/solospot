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
 *       ↓ StoreConfig shape (existing)
 *   storeConfigToBuilderDocument()
 *       ↓ BuilderDocument
 *   BuilderApp (BuilderProvider + Shell)
 *       ↓ dispatch(commands)
 *   compile(doc) → StoreConfig
 *       ↓ PATCH /api/stores/[storeId]
 */

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { BuilderApp } from '../../../components/builder/BuilderApp'
import {
  BuilderDocument,
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  BuilderMetadata,
  BuilderTheme,
  SectionNode,
} from '../../../../packages/builder-core/src/BuilderDocument'
import { compile } from '../../../../packages/builder-core/src/BuilderDocument'

// ---------------------------------------------------------------------------
// API types (existing StoreConfig shape from backend)
// ---------------------------------------------------------------------------

interface ApiSection {
  id: string
  type: string
  label: string
  config?: Record<string, unknown>
  order?: number
  parentId?: string | null
  styles?: Record<string, unknown>
  responsive?: Record<string, unknown>
  visible?: boolean
  locked?: boolean
  children?: ApiSection[]
}

interface ApiPage {
  id: string
  name: string
  slug: string
  sections?: ApiSection[]
}

interface ApiStore {
  id: string
  name: string
  slug: string
  domain: string | null
  status: string
  config?: {
    publicationStatus?: string
    branding?: {
      primaryColor?: string
      secondaryColor?: string
      font?: string
      logo?: string
      favicon?: string
    }
    pages?: ApiPage[]
  }
}

// ---------------------------------------------------------------------------
// Converters: ApiStore ↔ BuilderDocument
// ---------------------------------------------------------------------------

function nodeToApiSection(n: SectionNode, order: number): ApiSection {
  return {
    id: n.id,
    type: n.type,
    label: n.label,
    config: n.props,
    styles: n.styles as Record<string, unknown>,
    responsive: n.responsive as Record<string, unknown>,
    visible: n.visible,
    locked: n.locked,
    parentId: n.parentId,
    order: n.order ?? order,
    children: (n.children ?? []).map((child, ci) => nodeToApiSection(child, ci)),
  }
}

function apiSectionToNode(s: ApiSection, i: number, parentId?: string | null): SectionNode {
  return {
    id: s.id,
    type: s.type,
    label: s.label || s.type,
    parentId: s.parentId ?? parentId ?? null,
    props: s.config ?? {},
    styles: (s.styles as any) ?? {},
    responsive: (s.responsive as any) ?? {},
    visible: s.visible !== false,
    locked: s.locked === true,
    order: s.order ?? i,
    children: (s.children ?? []).map((child, ci) => apiSectionToNode(child, ci, s.id)),
  }
}

function apiStoreToBuilderDoc(store: ApiStore): BuilderDocument {
  const branding = store.config?.branding ?? {}

  const metadata: BuilderMetadata = {
    storeName: store.name,
    storeSlug: store.slug,
    locale: 'pl',
    currency: 'PLN',
  }

  const theme: Partial<BuilderTheme> = {
    primaryColor: branding.primaryColor ?? '#7c3aed',
    secondaryColor: branding.secondaryColor ?? '#d946ef',
    font: branding.font ?? 'Inter',
    logo: branding.logo,
    favicon: branding.favicon,
  }

  const apiPages = store.config?.pages ?? []
  const pages = apiPages.map((apiPage, pageIdx) => {
    const sections: SectionNode[] = (apiPage.sections ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s, i) => apiSectionToNode(s, i, null))

    return createBuilderPage({
      id: apiPage.id,
      slug: apiPage.slug,
      name: apiPage.name,
      isHome: pageIdx === 0,
      sections,
    })
  })

  let finalPages = pages
  if (finalPages.length === 0) {
    finalPages = [
      createBuilderPage({
        id: `page_home_${store.id}`,
        slug: '/',
        name: 'Strona główna',
        isHome: true,
        sections: [],
      }),
    ]
  }

  const doc = createBuilderDocument({
    id: store.id,
    tenantId: store.id, // will be replaced when tenant API is available
    metadata,
    theme,
    pages: finalPages,
  })

  return { ...doc, pages: finalPages, isDirty: false }
}

// ---------------------------------------------------------------------------
// Converter: BuilderDocument → StoreConfig patch body
// ---------------------------------------------------------------------------

function builderDocToApiPatch(doc: BuilderDocument): Record<string, unknown> {
  const compiled = compile(doc)
  return {
    config: {
      publicationStatus: compiled.publicationStatus,
      branding: {
        primaryColor: compiled.branding.primaryColor,
        secondaryColor: compiled.branding.secondaryColor,
        font: compiled.branding.font,
        logo: compiled.branding.logo,
        favicon: compiled.branding.favicon,
      },
      pages: doc.pages.map(page => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        sections: page.sections.map((s, idx) => nodeToApiSection(s, idx)),
        seo: page.seo,
      })),
    },
  }
}

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
