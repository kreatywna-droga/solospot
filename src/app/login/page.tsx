'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = '/dashboard';
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Logowanie nie powiodło się');
        return;
      }
      if (data?.degraded) {
        setError('Lokalny tryb demo: autoryzacja sesji nie jest dostępna bez poprawnej konfiguracji Supabase (dashboard wymaga sesji).');
        return;
      }
      if (data.data?.session) {
        await supabase.auth.setSession(data.data.session);
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Violet glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[100px] pointer-events-none" />
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">

        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Powrót
        </Link>

        <div className="bg-[#0a0b14] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/50">

          {/* Logo */}
          <div className="mb-8">
            <Logo link={false} size="sm" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2">Zaloguj się do platformy</h1>
          <p className="text-slate-400 text-sm mb-8">Dostęp do panelu klienta i Mission Control.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="twoj@email.pl" required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 hover:opacity-90 transition-all disabled:opacity-50 mt-2">
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Nie masz konta?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Zarejestruj sklep</Link>
          </p>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">
              Nie masz jeszcze sklepu? Załóż go teraz →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
