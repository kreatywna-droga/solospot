import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getServiceSupabase();

  // Znajdź Twój sklep "vinyl"
  let { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', 'vinyl')
    .maybeSingle();

  if (!store) {
    // Jeśli nie znalazł po slug, weź po prostu pierwszy sklep z bazy
    const { data: firstStore } = await supabase.from('stores').select('*').limit(1).maybeSingle();
    store = firstStore;
  }

  // MAGIA: Jeśli uzytkownik nie ma ABSOLUTNIE ZADNEGO sklepu, stworzmy go dla niego!
  if (!store) {
    let { data: tenant } = await supabase.from('tenants').select('*').limit(1).maybeSingle();
    
    if (!tenant) {
      // Create a valid auth user first
      const dummyEmail = `demo-${Date.now()}@solospot.pl`;
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: dummyEmail,
        password: 'TestPassword123!',
        email_confirm: true
      });
      
      if(authErr || !authData.user) return NextResponse.json({ error: 'Błąd tworzenia użytkownika Auth', details: authErr }, { status: 500 });
      
      const { data: newTenant, error: tenantErr } = await supabase.from('tenants').insert({
        id: authData.user.id,
        owner_email: dummyEmail,
        package_id: 'vinyl',
        status: 'CREATED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();
      
      if(tenantErr) return NextResponse.json({ error: 'Błąd tworzenia testowego konta', details: tenantErr }, { status: 500 });
      tenant = newTenant;
    }
    
    const { data: newStore, error } = await supabase.from('stores').insert({
      tenant_id: tenant.id,
      name: 'Vinyl Music Store',
      slug: 'vinyl',
      status: 'ACTIVE',
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();
    
    if(error) return NextResponse.json({ error: 'Błąd tworzenia sklepu' }, { status: 500 });
    store = newStore;
  }

  // Budowanie ekskluzywnego, gotowego designu i sekcji
  const config = {
    publicationStatus: 'PUBLISHED',
    branding: {
      logo: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=100&h=100&fit=crop',
      favicon: '',
      primaryColor: '#7c3aed',
      secondaryColor: '#d946ef',
      font: 'Inter',
      description: 'Ekskluzywny sklep z płytami winylowymi i sprzętem audio',
    },
    pages: [
      {
        id: 'home',
        name: 'Strona Główna',
        slug: '/',
        sections: [
          {
            id: 's1',
            type: 'hero',
            config: {
              headline: 'Odkryj Magię Analogowego Dźwięku',
              subheadline: 'Zanurz się w najgłębszych brzmieniach. Największa kolekcja rzadkich płyt winylowych oraz sprzętu audiofilskiego w Polsce.',
              image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=2000'
            }
          },
          {
            id: 's2',
            type: 'product-grid',
            config: {
              title: 'Nowości Płytowe',
              subtitle: 'Świeże tłoczenia, które musisz usłyszeć na swoim gramofonie.'
            }
          },
          {
            id: 's3',
            type: 'footer',
            config: {
              text: '© 2026 SoloSpot Vinyl Store. Wszelkie prawa zastrzeżone.'
            }
          }
        ]
      }
    ]
  };

  // Nadpisz konfigurację sklepu w bazie
  await supabase.from('stores').update({ config, status: 'ACTIVE' }).eq('id', store.id);

  // Wyczyść ewentualne stare produkty z tego sklepu, by nie robić śmietnika
  await supabase.from('products').delete().eq('store_id', store.id);

  // Przygotuj nowe sztuczne produkty
  const productsToInsert = [
    {
      id: crypto.randomUUID(),
      tenant_id: store.tenant_id,
      store_id: store.id,
      name: 'Daft Punk - Random Access Memories',
      description: 'Legendarny album na dwóch płytach winylowych 180g. Poczuj głębię basu w analogowym wydaniu.',
      price: 18900,
      currency: 'PLN',
      images: ['https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=500&auto=format&fit=crop'],
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      tenant_id: store.tenant_id,
      store_id: store.id,
      name: 'Pink Floyd - The Dark Side of the Moon',
      description: 'Remaster 2011. Wydanie kolekcjonerskie w formacie Gatefold wraz z plakatami i wlepkami.',
      price: 14500,
      currency: 'PLN',
      images: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&auto=format&fit=crop'],
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      tenant_id: store.tenant_id,
      store_id: store.id,
      name: 'Gramofon Audio-Technica LP120X',
      description: 'Klasyczny gramofon z napędem bezpośrednim i wbudowanym przedwzmacniaczem na złącze USB.',
      price: 149900,
      currency: 'PLN',
      images: ['https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500&auto=format&fit=crop'],
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await supabase.from('products').insert(productsToInsert);

  return NextResponse.json({ success: true, message: 'Sklep Vinyl został zbudowany i zasilony danymi!' });
}
