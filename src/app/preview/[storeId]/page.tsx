import { notFound, redirect } from 'next/navigation'
import { StoreRepository } from '@/lib/store/StoreRepository'
import { ProductRepository } from '@/lib/product/ProductRepository'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { RuntimeResolver, StoreRuntime } from '@/lib/runtime'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'

interface Props {
  params: Promise<{ storeId: string }>
}

export default async function PreviewPage({ params }: Props) {
  const { storeId } = await params

  const session = await resolveTenantSession()
  if (!session.isAuthenticated || !session.tenantId) {
    redirect('/login')
  }

  let store, products
  try {
    const storeRepo = new StoreRepository()
    const productRepo = new ProductRepository()
    store = await storeRepo.getStore(storeId, session.tenantId)
    if (!store || !store.config) return notFound()
    products = await productRepo.getProductsByStore(store.tenantId, storeId)
  } catch {
    return notFound()
  }

  const resolver = new RuntimeResolver()
  const runtimeConfig = resolver.resolve(store, products || [])

  const runtime = new StoreRuntime()
  const rendered = runtime.render(runtimeConfig)

  return (
    <div style={{ fontFamily: rendered.theme.font }}>
      <div className="bg-amber-500 text-amber-900 text-center text-xs py-1.5 font-medium tracking-wide">
        PODGLĄD — ten sklep nie jest opublikowany. Widzisz go tylko Ty.
        <a href={`/dashboard/stores/${storeId}`} className="underline ml-2 font-bold">Wróć do edycji</a>
      </div>
      {rendered.page.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          theme={rendered.theme}
          storeName={rendered.storeName}
          products={rendered.products}
          navigation={rendered.navigation}
        />
      ))}
    </div>
  )
}
