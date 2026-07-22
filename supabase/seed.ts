import { getServiceSupabase } from '@/lib/supabase';

const OWNER_EMAIL = 'kreatywna.droga@gmail.com';

const DEMO_STORES = [
  {
    tenantId: 'demo-fashion',
    name: 'Fashion Demo Store',
    slug: 'fashion-demo',
    domain: 'fashion-demo.solospot.pl',
    template: 'fashion-pro',
    description: 'Demo sklep z odzieżą — szablony Fashion Pro',
  },
  {
    tenantId: 'demo-beauty',
    name: 'Beauty Demo Store',
    slug: 'beauty-demo',
    domain: 'beauty-demo.solospot.pl',
    template: 'beauty',
    description: 'Demo sklep kosmetyczny — szablon Beauty',
  },
];

async function seed() {
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();

  console.log('Seeding SoloSpot demo stores...');

  for (const store of DEMO_STORES) {
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', store.tenantId)
      .maybeSingle();

    if (!existingTenant) {
      const { error: tenantError } = await supabase.from('tenants').insert({
        id: store.tenantId,
        owner_email: OWNER_EMAIL,
        package_id: 'starter',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      });

      if (tenantError) {
        console.error(`Failed to create tenant ${store.tenantId}:`, tenantError.message);
        process.exit(1);
      }
      console.log(`Tenant created: ${store.tenantId}`);
    } else {
      console.log(`Tenant already exists: ${store.tenantId}`);
    }

    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('tenant_id', store.tenantId)
      .maybeSingle();

    if (!existingStore) {
      const { error: storeError } = await supabase.from('stores').insert({
        tenant_id: store.tenantId,
        name: store.name,
        slug: store.slug,
        domain: store.domain,
        status: 'ACTIVE',
        config: {
          publicationStatus: 'DRAFT',
          branding: {
            description: store.description,
          },
          template: store.template,
        },
        created_at: now,
        updated_at: now,
      });

      if (storeError) {
        console.error('Failed to create store:', storeError.message);
        process.exit(1);
      }
      console.log(`Store created: ${store.slug}`);
    } else {
      console.log(`Store already exists for tenant: ${store.tenantId}`);
    }
  }

  console.log('Seed complete.');
}

seed();
