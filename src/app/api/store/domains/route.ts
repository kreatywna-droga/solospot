import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId || !session.tenant?.store?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No store associated with this account' }, { status: 403 });
    }

    const storeId = session.tenant.store.id;
    const supabase = getServiceSupabase();

    const { data: store, error } = await supabase
      .from('stores')
      .select('slug, domain')
      .eq('id', storeId)
      .maybeSingle();

    if (error || !store) {
      throw new Error(`Store not found: ${error?.message || ''}`);
    }

    return NextResponse.json({
      success: true,
      primaryDomain: `${store.slug}.solospot.pl`,
      customDomain: store.domain || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId || !session.tenant?.store?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No store associated with this account' }, { status: 403 });
    }

    const storeId = session.tenant.store.id;
    const body = await req.json();
    const { domain } = body;

    // Validate domain format (allow null/empty to clear custom domain)
    let cleanDomain = domain ? domain.trim().toLowerCase() : null;
    if (cleanDomain && !/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}$/i.test(cleanDomain)) {
      return NextResponse.json({ success: false, error: 'Invalid domain format' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('stores')
      .update({
        domain: cleanDomain,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to update custom domain: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      customDomain: cleanDomain,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
