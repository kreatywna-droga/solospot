import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isSupabaseConfigured = (): boolean => {
  const url = supabaseUrl.toLowerCase();
  const key = supabaseAnonKey.toLowerCase();
  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    !url.includes('dummy') &&
    !url.includes('placeholder') &&
    !key.includes('dummy') &&
    key.length > 10
  );
};

export async function middleware(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || `req_${Date.now()}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-correlation-id', correlationId);

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Skip static assets, next internals, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Admin APIs Guard (/api/admin/*)
  if (pathname.startsWith('/api/admin')) {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const email = session.user.email || '';
    const isAllowedAdmin =
      email.includes('owner') ||
      email.includes('admin') ||
      email.includes('operator') ||
      email.includes('support');

    if (!isAllowedAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
  }

  // 3. Client Dashboard & Store APIs Guard (/api/store/* or /api/stores/*)
  if (pathname.startsWith('/api/store') || pathname.startsWith('/api/stores')) {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      const email = session.user.email || '';
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id, status')
        .eq('owner_email', email)
        .maybeSingle();

      if (!tenant) {
        return NextResponse.json({ success: false, error: 'Forbidden: No tenant associated with this account' }, { status: 403 });
      }

      if (tenant.status === 'SUSPENDED') {
        return NextResponse.json({ success: false, error: 'Forbidden: Tenant account is suspended' }, { status: 403 });
      }

      // Verify cross-tenant access for /api/stores/[storeId]/...
      const pathSegments = pathname.split('/');
      const storesIdx = pathSegments.indexOf('stores');
      if (storesIdx !== -1 && pathSegments.length > storesIdx + 1) {
        const storeId = pathSegments[storesIdx + 1];
        if (storeId && storeId !== 'dashboard' && storeId !== 'settings') {
          const { data: store } = await supabaseAdmin
            .from('stores')
            .select('tenant_id')
            .eq('id', storeId)
            .maybeSingle();

          if (!store || store.tenant_id !== tenant.id) {
            return NextResponse.json({ success: false, error: 'Forbidden: Cross-tenant access attempt' }, { status: 403 });
          }
        }
      }
    }
  }

  // 4. Tenant Domain Routing & Preview Resolution
  const host = request.headers.get('host') || '';
  const cleanHost = host.split(':')[0].toLowerCase();

  // Exclude main platform paths from tenant routing mapping
  const isPlatformPath =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/marketplace');

  if (!isPlatformPath && isSupabaseConfigured()) {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    let resolvedStore = null;

    // A. Subdomain check (e.g., tenant-a.solospot.com, tenant-a.localhost)
    if (
      cleanHost.endsWith('.solospot.com') ||
      cleanHost.endsWith('.solospot.pl') ||
      cleanHost.endsWith('.solospot.io') ||
      cleanHost.endsWith('.localhost')
    ) {
      const parts = cleanHost.split('.');
      if (parts.length > 2 || (parts.length === 2 && cleanHost.endsWith('.localhost'))) {
        const slug = parts[0];
        const { data } = await supabaseAdmin
          .from('stores')
          .select('id, tenant_id, status, name, slug')
          .eq('slug', slug)
          .maybeSingle();
        resolvedStore = data;
      }
    }

    // B. Custom domain check (if no subdomain matched)
    if (!resolvedStore) {
      const { data } = await supabaseAdmin
        .from('stores')
        .select('id, tenant_id, status, name, slug')
        .eq('domain', cleanHost)
        .maybeSingle();
      resolvedStore = data;
    }

    // C. Route rewrite / headers injection
    if (resolvedStore) {
      if (resolvedStore.status === 'SUSPENDED') {
        return new NextResponse('503 Service Unavailable: Storefront Suspended', { status: 503 });
      }

      requestHeaders.set('x-tenant-id', resolvedStore.tenant_id);
      requestHeaders.set('x-store-id', resolvedStore.id);

      // Support rewriting requests dynamically to the storefront runtime engine route: /store/[slug]/...
      // This is a premium architecture feature that hides the internal URLs!
      const newUrl = request.nextUrl.clone();
      const newPathname = pathname === '/' ? '' : pathname;
      newUrl.pathname = `/store/${resolvedStore.slug}${newPathname}`;
      return NextResponse.rewrite(newUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

async function getSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return null;
  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
