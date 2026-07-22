'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, ArrowLeft, Mail, Lock, User, Building2, CheckCircle2 } from 'lucide-react';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '0 zł/mies.', desc: '1 sklep, do 50 zamówień', backendId: 'starter' },
  { id: 'pro', name: 'Pro', price: '299 zł/mies.', desc: '3 sklepy, nielimitowane zamówienia', backendId: 'standard' },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState('starter');
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [done, setDone] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const selectedPlan = PLANS.find(p => p.id === plan);
      const packageId = selectedPlan?.backendId || 'starter';
      const storeName = form.company || `Sklep ${form.name}`;

      // 1. Create auth user
      const authRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
      });
      const authData = await authRes.json();
      if (!authRes.ok) {
        setError(authData.error || 'Rejestracja nie powiodła się');
        setLoading(false);
        return;
      }
      setDemoMode(Boolean(authData.degraded));

      // 2. Auto-login (dev mode auto-confirms)
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      // 3. Register tenant
      const tenantRes = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: form.email, packageId, storeName }),
      });
      const tenantData = await tenantRes.json();
      if (!tenantRes.ok) {
        setError(tenantData.error || 'Nie udało się utworzyć konta platformy');
        setLoading(false);
        return;
      }
      setDemoMode(Boolean(tenantData.degraded) || Boolean(authData.degraded));

      // 4. If paid plan — initiate checkout
      if (packageId !== 'starter') {
        const checkoutRes = await fetch('/api/onboarding/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: tenantData.tenantId, packageId }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) {
          setError(checkoutData.error || 'Nie udało się zainicjować płatności');
          setLoading(false);
          return;
        }
        setCheckoutUrl(checkoutData.paymentUrl);
        setDone(true);
      } else {
        // Starter — redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#060b14] text-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Konto gotowe!</h1>
          <p className="text-slate-400 mb-8">
            {checkoutUrl
              ? 'Za chwilę zostaniesz przekierowany do bramki płatności.'
              : 'Twój sklep jest w trakcie provisioningu.'}
          </p>
          {checkoutUrl ? (
            <a href={checkoutUrl}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full">
              Przejdź do płatności
            </a>
          ) : (
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-full">
              Otwórz Dashboard
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10">

        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Powrót
        </Link>

        <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-white text-lg tracking-tight">WEB<span className="text-cyan-400">FACTOR</span></span>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-500'}`}>
                  {s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? 'text-white' : 'text-slate-600'}`}>
                  {s === 1 ? 'Plan' : 'Dane konta'}
                </span>
                {s < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-black text-white mb-2">Wybierz plan</h1>
              <p className="text-slate-400 text-sm mb-6">Możesz zmienić plan w każdej chwili.</p>
              {demoMode && (
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                  Tryb lokalny jest aktywny, więc mail nie zostanie wysłany. To konto działa jako demo bez realnego SMTP.
                </div>
              )}
              <div className="space-y-3 mb-8">
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setPlan(p.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      plan === p.id
                        ? 'border-cyan-500/50 bg-cyan-500/5'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{p.name}</span>
                        {p.id === 'pro' && <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full font-bold">POPULARNY</span>}
                      </div>
                      <span className="text-xs text-slate-500">{p.desc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{p.price}</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        plan === p.id ? 'border-cyan-500 bg-cyan-500' : 'border-white/20'}`}>
                        {plan === p.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Dalej →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-black text-white mb-2">Dane konta</h1>
              <p className="text-slate-400 text-sm mb-6">Plan: <span className="text-cyan-400 font-bold">{PLANS.find(p => p.id === plan)?.name}</span></p>
              {demoMode && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                  Tryb lokalny: nie wyślemy maila i konto jest tworzone w wersji demo.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Imię</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Jan" required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Firma</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                        placeholder="Mój Sklep" required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="twoj@firma.pl" required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hasło</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 8 znaków" required minLength={8}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                    ← Wstecz
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                    {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Masz już konto?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Zaloguj się</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
