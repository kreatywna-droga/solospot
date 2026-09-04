let createClientFn: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  createClientFn = require('@supabase/supabase-js').createClient;
} catch {
  createClientFn = () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ error: null }),
      }),
    },
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

/**
 * Zwraca true tylko gdy zmienne środowiskowe wskazują na prawdziwy projekt Supabase.
 * Używaj tego guardu przed jakimkolwiek zapytaniem do bazy w środowisku dev/test.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const placeholderPatterns = ['placeholder', 'dummy', 'dev-', 'local-only'];
  const isPlaceholder = (val: string) =>
    placeholderPatterns.some(p => val.toLowerCase().includes(p));
  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    !isPlaceholder(url) &&
    !isPlaceholder(key)
  );
};

// Klient używany po stronie przeglądarki (bezpieczny, z ograniczeniami RLS)
export const supabase = createClientFn(supabaseUrl, supabaseAnonKey);

// Klient używany tylko na Backendzie w API Routes (ma pełny dostęp, omija zabezpieczenia bazy)
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
  return createClientFn(supabaseUrl, serviceKey);
};

// Test helper exports (stubbed for TS type-checking of mocked calls in tests)
export const mockDb: { [table: string]: any[] } = {};
export const clearMockDb = (): void => {};
export class MockQueryBuilder {
  [key: string]: any;
}

