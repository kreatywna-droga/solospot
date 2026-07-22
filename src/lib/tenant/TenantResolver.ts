import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { TenantSession } from './TenantContext';
import { TenantRepository } from './TenantRepository';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function resolveTenantSession(): Promise<TenantSession> {
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      userId: '',
      email: '',
      tenantId: null,
      tenant: null,
      isAuthenticated: false,
    };
  }

  const email = session.user.email ?? '';
  const tenantRepo = new TenantRepository();
  const allTenants = await tenantRepo.getAllTenants();
  const matchingTenant = allTenants.find(
    (t) => t.ownerEmail.toLowerCase() === email.toLowerCase()
  ) ?? null;

  let store = null;
  if (matchingTenant) {
    store = await tenantRepo.getStoreByTenant(matchingTenant.id);
  }

  return {
    userId: session.user.id,
    email,
    tenantId: matchingTenant?.id ?? null,
    tenant: matchingTenant
      ? {
          id: matchingTenant.id,
          ownerEmail: matchingTenant.ownerEmail,
          packageId: matchingTenant.packageId,
          status: matchingTenant.status,
          createdAt: matchingTenant.createdAt,
          store: store
            ? { id: store.id, name: store.name, status: store.status }
            : null,
        }
      : null,
    isAuthenticated: true,
  };
}
