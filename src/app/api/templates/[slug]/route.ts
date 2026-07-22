import { NextRequest, NextResponse } from 'next/server'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const registry = new TemplateRegistry()
    const template = registry.getBySlug(slug)
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, template })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
