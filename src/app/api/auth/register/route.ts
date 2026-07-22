import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Brak e-maila lub hasła' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        data: {
          user: {
            id: `local-${Date.now()}`,
            email,
            user_metadata: { name: name || '' },
          },
        },
        degraded: true,
      });
    }

    // Używamy supabase-js po stronie serwera (Next.js), aby ominąć AdBlockery
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        }
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Obsługa zaległych licencji (pending_licenses)
    if (data.user) {
      const adminSupabase = getServiceSupabase();
      
      const { data: pendingLicense, error: pendingError } = await adminSupabase
        .from('pending_licenses')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (pendingLicense && !pendingError) {
        console.log(`[Rejestracja] Znaleziono zaległą licencję dla ${email}. Aktywuję plan: ${pendingLicense.plan}`);
        
        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_plan: pendingLicense.plan,
            subscription_end_date: null
          })
          .eq('id', data.user.id);
          
        if (updateError) {
          console.warn("[Rejestracja] Profil nie został jeszcze utworzony automatycznie. Wykonuję upsert.");
          await adminSupabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email.toLowerCase(),
              name: name || '',
              is_premium: true,
              subscription_plan: pendingLicense.plan
            });
        }
        
        await adminSupabase
          .from('pending_licenses')
          .delete()
          .eq('email', email.toLowerCase());
          
        console.log("[Rejestracja] Licencja pomyślnie przypisana.");
      }
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
