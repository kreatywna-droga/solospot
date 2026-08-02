import { notFound, redirect } from 'next/navigation'
import { StoreRepository } from '@/lib/store/StoreRepository'
import { renderStore } from '@/lib/runtime'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'
import { generateThemeCssVars } from '@/lib/tenant/TenantTheme'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'

interface Props {
  params: Promise<{ storeId: string }>
}

/**
 * PreviewPage — authenticated preview of an unpublished store.
 *
 * Migrated to the unified renderStore() pipeline (Sprint 6 Step 5):
 *   - renderStore({ slug, mode: 'PREVIEW' }) → DefaultRuntimePipeline primary,
 *     legacy RuntimeResolver as fallback only.
 *   - Same SectionRenderer contract as the public store page.
 */
export default async function PreviewPage({ params }: Props) {
  const { storeId } = await params

  const session = await resolveTenantSession()
  if (!session.isAuthenticated || !session.tenantId) {
    redirect('/login')
  }

  // Resolve slug from the store owned by the current tenant.
  let slug: string
  try {
    const storeRepo = new StoreRepository()
    const store = await storeRepo.getStore(storeId, session.tenantId)
    if (!store || !store.config) return notFound()
    slug = store.slug
  } catch {
    return notFound()
  }

  const result = await renderStore({ slug, mode: 'PREVIEW', noCache: true })

  if (!result) return notFound()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ten sklep nie jest jeszcze opublikowany</h1>
          <p className="text-slate-500">Właściciel sklepu nie zakończył jeszcze konfiguracji.</p>
        </div>
      </div>
    )
  }

  const cssVars = generateThemeCssVars({
    primary: result.theme.primaryColor,
    secondary: result.theme.secondaryColor,
  })

  return (
    <div style={{ fontFamily: result.theme.font, ...cssVars }}>
      <div className="bg-amber-500 text-amber-900 text-center text-xs py-1.5 font-medium tracking-wide">
        PODGLĄD — ten sklep nie jest opublikowany. Widzisz go tylko Ty.
        <a href={`/dashboard/stores/${storeId}`} className="underline ml-2 font-bold">Wróć do edycji</a>
      </div>
      {result.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={{ id: section.id, type: section.type, label: section.label, config: section.props }}
          theme={{
            primaryColor: result.theme.primaryColor,
            secondaryColor: result.theme.secondaryColor,
            font: result.theme.font,
            logo: result.theme.logo,
            favicon: result.theme.favicon,
            description: result.theme.description,
          }}
          storeName={result.storeName}
          products={result.products}
          navigation={result.navigation}
        />
      ))}
    </div>
  )
}

