import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'
import { TemplateInstaller } from '@/lib/template/TemplateInstaller'

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

    const body = await req.json()
    const slug: string = body.templateSlug
    if (!slug) {
      return NextResponse.json({ success: false, error: 'templateSlug is required' }, { status: 400 })
    }

    const installer = new TemplateInstaller()
    const result = await installer.install(session.tenantId, id, slug)

    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    if (err.message?.startsWith('Template not found')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
