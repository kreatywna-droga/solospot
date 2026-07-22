import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { ProductRepository } from '@/lib/product/ProductRepository'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const { id, productId } = await params
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const productRepo = new ProductRepository()
    await productRepo.deleteProduct(productId, session.tenantId)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    if (err.message === 'Product not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}