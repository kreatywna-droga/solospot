import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { ProductRepository } from '@/lib/product/ProductRepository'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const productRepo = new ProductRepository()
    const products = await productRepo.getProductsByStore(session.tenantId, id)

    return NextResponse.json({ success: true, products })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const body = await req.json() as { name: string; description: string; price: number; images: string[] }
    
    const productRepo = new ProductRepository()
    const product = await productRepo.createProduct(session.tenantId, {
      storeId: id,
      name: body.name,
      description: body.description,
      price: body.price,
      images: body.images || [],
    })


    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}