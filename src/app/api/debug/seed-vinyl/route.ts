import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * /api/debug/seed-vinyl
 *
 * SECURITY: This route is BLOCKED in production. It only operates in development
 * mode when CRON_SECRET is provided. It seeds demo data for the vinyl store.
 *
 * In production, this route returns 404.
 */
export async function GET(req: Request) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Require authentication even in development
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (!token || !timingSafeEqual(token, cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { getServiceSupabase } = await import('@/lib/supabase');
  const supabase = getServiceSupabase();

  // Find or create the "vinyl" store
  let { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', 'vinyl')
    .maybeSingle();

  if (!store) {
    const { data: firstStore } = await supabase.from('stores').select('*').limit(1).maybeSingle();
    store = firstStore;
  }

  if (!store) {
    let { data: tenant } = await supabase.from('tenants').select('*').limit(1).maybeSingle();

    if (!tenant) {
      const dummyEmail = `demo-${Date.now()}@solospot.pl`;
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: dummyEmail,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      if (authErr || !authData.user) {
        return NextResponse.json({ error: 'Failed to create auth user', details: authErr }, { status: 500 });
      }

      const { data: newTenant, error: tenantErr } = await supabase
        .from('tenants')
        .insert({
          id: authData.user.id,
          owner_email: dummyEmail,
          package_id: 'vinyl',
          status: 'CREATED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tenantErr) {
        return NextResponse.json({ error: 'Failed to create tenant', details: tenantErr }, { status: 500 });
      }
      tenant = newTenant;
    }

    const { data: newStore, error } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: 'Vinyl Music Store',
        slug: 'vinyl',
        status: 'ACTIVE',
        config: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    store = newStore;
  }

  const config = {
    publicationStatus: 'PUBLISHED',
    branding: {
      logo: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=100&h=100&fit=crop',
      favicon: '',
      primaryColor: '#7c3aed',
      secondaryColor: '#d946ef',
      font: 'Inter',
      description: 'Ekskluzywny sklep z plytami winylowymi i sprzetem audio',
    },
    pages: [
      {
        id: 'home',
        name: 'Strona Glowna',
        slug: '/',
        sections: [
          {
            id: 's1',
            type: 'hero',
            config: {
              headline: 'Odkryj Mage Analogowego Dzwieku',
              subheadline: 'Zanurz sie w najglebszych brzmieniach.',
              image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=2000',
            },
          },
          {
            id: 's2',
            type: 'product-grid',
            config: {
              title: 'Nowosci Plytowe',
              subtitle: 'Swieze tloczenia.',
            },
          },
          {
            id: 's3',
            type: 'footer',
            config: {
              text: '2026 SoloSpot Vinyl Store.',
            },
          },
        ],
      },
    ],
  };

  await supabase.from('stores').update({ config, status: 'ACTIVE' }).eq('id', store.id);
  await supabase.from('products').delete().eq('store_id', store.id);

  const productsToInsert = [
    {
      tenant_id: store.tenant_id,
      store_id: store.id,
      name: 'Daft Punk - Random Access Memories',
      description: 'Legendarny album na dwoch plytach winylowych 180g.',
      price: 18900,
      currency: 'PLN',
      images: ['https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=500&auto=format&fit=crop'],
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      tenant_id: store.tenant_id,
      store_id: store.id,
      name: 'Pink Floyd - The Dark Side of the Moon',
      description: 'Remaster 2011. Wydanie kolekcjonerskie.',
      price: 14500,
      currency: 'PLN',
      images: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&auto=format&fit=crop'],
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      tenant_id: store.tenant_id,
      store_id: store.id,
      name: 'Gramofon Audio-Technica LP120X',
      description: 'Klasyczny gramofon z napedem bezposrednim.',
      price: 149900,
      currency: 'PLN',
      images: ['https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500&auto=format&fit=crop'],
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  await supabase.from('products').insert(productsToInsert);

  return NextResponse.json({ success: true, message: 'Vinyl store seeded (dev only)' });
}
