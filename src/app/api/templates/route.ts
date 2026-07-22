import { NextResponse } from 'next/server'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'

export async function GET() {
  try {
    const registry = new TemplateRegistry()
    const templates = registry.getAll()
    return NextResponse.json({ success: true, templates })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
