import { notFound } from 'next/navigation'
import { StoreRepository } from '@/lib/store/StoreRepository'
import { ProductRepository } from '@/lib/product/ProductRepository'
import { RuntimeResolver, StoreRuntime } from '@/lib/runtime'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const storeRepo = new StoreRepository()
    const store = await storeRepo.getStoreBySlug(slug)
    if (!store) return { title: 'Sklep' }
    const resolver = new RuntimeResolver()
    const config = resolver.resolve(store, [])
    return {
      title: config.seo?.title || config.storeName,
      description: config.seo?.description || config.theme.description,
    }
  } catch {
    return { title: 'Sklep' }
  }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params

  let store, products
  try {
    const storeRepo = new StoreRepository()
    const productRepo = new ProductRepository()

    store = await storeRepo.getStoreBySlug(slug)
    if (!store || !store.config) return notFound()

    const resolver = new RuntimeResolver()
    const status = (store.config as any)?.publicationStatus

    if (!resolver.isPubliclyAccessible(status) && !resolver.canRender(status)) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Ten sklep nie jest jeszcze opublikowany</h1>
            <p className="text-slate-500">Właściciel sklepu nie zakończył jeszcze konfiguracji.</p>
          </div>
        </div>
      )
    }

    products = await productRepo.getProductsByStore(store.tenantId, store.id)
  } catch {
    return notFound()
  }

  const resolver = new RuntimeResolver()
  const runtimeConfig = resolver.resolve(store, products || [])

  const runtime = new StoreRuntime()
  const rendered = runtime.render(runtimeConfig)

  return (
    <div style={{ fontFamily: rendered.theme.font }}>
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
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="/dashboard"
          className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-xs text-slate-600 shadow-lg hover:shadow-xl transition-shadow"
        >
          Powered by SoloSpot
        </a>
      </div>
    </div>
  )
}
