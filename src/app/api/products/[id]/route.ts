import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { ProductService } from '@/lib/product/ProductService'
import type { UpdateProductRequest } from '@/lib/product/ProductTypes'

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

    const productService = new ProductService()
    const product = await productService.getProduct(session.tenantId, id)

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    if (err.message === 'Product not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const body: UpdateProductRequest = await req.json()
    const productService = new ProductService()
    const product = await productService.updateProduct(session.tenantId, id, body)

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    if (err.message === 'Product not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    }
    if (err.message?.startsWith('Validation failed')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await resolveTenantSession()
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 })
    }

    const productService = new ProductService()
    await productService.deleteProduct(session.tenantId, id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'Product not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
