import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { ProductService } from '@/lib/product/ProductService'
import type { CreateProductRequest } from '@/lib/product/ProductTypes'

export async function GET() {
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const productService = new ProductService()
    const products = await productService.listProducts(session.tenantId)

    return NextResponse.json({ success: true, products })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const body: CreateProductRequest = await req.json()
    const productService = new ProductService()
    const product = await productService.createProduct(session.tenantId, body)

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (err: any) {
    if (err.message?.startsWith('Validation failed')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
