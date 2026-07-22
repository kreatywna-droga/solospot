import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { StoreRepository } from '@/lib/store/StoreRepository'
import { ProductRepository } from '@/lib/product/ProductRepository'
import { RuntimeResolver, StoreRuntime } from '@/lib/runtime'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const storeRepo = new StoreRepository()
    const productRepo = new ProductRepository()

    const store = await storeRepo.getStore(id, session.tenantId)
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const products = await productRepo.getProductsByStore(session.tenantId, id)

    const resolver = new RuntimeResolver()
    const runtimeConfig = resolver.resolve(store, products || [])

    const runtime = new StoreRuntime()
    const rendered = runtime.render(runtimeConfig)

    return NextResponse.json({
      success: true,
      message: 'Export API ready. Full HTML export coming in Sprint 10.7.',
      store: {
        name: rendered.storeName,
        pageCount: 1,
        sectionCount: rendered.page.sections.length,
        productCount: rendered.products.length,
      },
      preview: {
        storeName: rendered.storeName,
        theme: rendered.theme,
        pageSlug: rendered.page.slug,
        sections: rendered.page.sections.map((s) => ({ type: s.type, label: s.label })),
      },
    })
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
