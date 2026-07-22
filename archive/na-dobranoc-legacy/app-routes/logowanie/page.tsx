'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState({ text: '', isError: false });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { supabase } = await import('@/lib/supabase');
      
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        localStorage.setItem('naDobranoc_user', JSON.stringify({ email: data.user.email }));
        router.push('/dashboard');
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Wystąpił błąd podczas rejestracji');
        }

        const signUpData = resData.data;
        // Supabase might require email confirmation, but let's assume auto-confirm or login for now
        if (signUpData.session) {
          localStorage.setItem('naDobranoc_user', JSON.stringify({ email: signUpData.user?.email }));
          router.push('/dashboard');
        } else {
          setError('Konto utworzone. Sprawdź swoją skrzynkę e-mail, by potwierdzić adres.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Wystąpił błąd autoryzacji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage({ text: 'Wpisz swój adres e-mail.', isError: true });
      return;
    }
    setIsLoading(true);
    setResetMessage({ text: '', isError: false });
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-hasla',
      });
      if (error) throw error;
      setResetMessage({ text: 'Link do resetu hasła został wysłany! Sprawdź pocztę (również folder SPAM).', isError: false });
      setResetEmail('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setResetMessage({ text: message || 'Wystąpił błąd podczas wysyłania linku.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] flex items-center justify-center p-6 relative overflow-hidden selection:bg-purple-500/30">
      {/* Tło Premium */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[800px] bg-purple-900/15 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[800px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none z-0" />

      <button onClick={() => router.back()} className="absolute top-8 left-8 md:top-12 md:left-12 inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group z-20 font-medium">
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Powrót
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#111118]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_0_100px_rgba(168,85,247,0.1)] relative overflow-hidden">
          {/* Ozdobny gradient na górze karty */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-50" />

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isLogin ? 'Witaj ponownie' : 'Dołącz do nas'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Zaloguj się, aby zarządzać swoją licencją i urządzeniami.' : 'Stwórz konto i ciesz się spokojnymi wieczorami.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Imię" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                placeholder="Adres e-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowResetModal(true)} className="text-xs text-purple-400 hover:text-pink-400 transition-colors">Zapomniałeś hasła?</button>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors mt-2 group disabled:opacity-70">
              {isLoading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Stwórz konto')} 
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>



          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              {isLogin ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-white font-bold hover:text-purple-400 transition-colors"
              >
                {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
              </button>
            </p>
          </div>

        </div>
      </motion.div>

      {/* Modal resetowania hasła */}
      {showResetModal && (
        <div className="fixed top-0 left-0 w-full h-[100dvh] z-[99999] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-md" style={{ position: 'fixed' }}>
          <div className="bg-[#111118] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-[90vw] sm:max-w-sm w-full shadow-2xl relative mx-auto my-auto">
            <button 
              onClick={() => setShowResetModal(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white p-2 text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Resetowanie hasła</h3>
            <p className="text-sm text-slate-400 mb-6">Podaj e-mail powiązany z Twoim kontem, aby otrzymać link resetujący.</p>
            
            <form onSubmit={handleResetPassword}>
              <div className="relative mb-4">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  placeholder="Adres e-mail" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              {resetMessage.text && (
                <div className={`mb-4 p-3 rounded-xl text-sm text-center ${resetMessage.isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                  {resetMessage.text}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Wysyłanie...' : 'Wyślij link'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
