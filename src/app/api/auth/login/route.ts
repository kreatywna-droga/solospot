import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from '@/lib/supabase';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Brak e-maila lub hasła' },
        { status: 400 }
      );
    }

    // Zostawiamy degraded: true bez zmian lokalnie
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        data: {
          user: {
            id: `local-${Date.now()}`,
            email,
          },
        },
        degraded: true,
      });
    }

    // Kluczowe: używamy @supabase/ssr i zapisujemy cookies tak,
    // żeby resolveTenantSession() mogło odczytać sesję po stronie dashboardu.
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
