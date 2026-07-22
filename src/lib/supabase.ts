import { createClient } from '@supabase/supabase-js';

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
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Klient używany tylko na Backendzie w API Routes (ma pełny dostęp, omija zabezpieczenia bazy)
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
  return createClient(supabaseUrl, serviceKey);
};

// Test helper exports (stubbed for TS type-checking of mocked calls in tests)
export const mockDb: { [table: string]: any[] } = {};
export const clearMockDb = (): void => {};
export class MockQueryBuilder {
  [key: string]: any;
}

