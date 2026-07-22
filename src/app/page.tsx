'use client'
// HMR trigger

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Zap, Server, Layers, ShieldCheck, ArrowRight,
  ChevronRight, Menu, X, Sparkles, Box,
  LayoutDashboard, Monitor, Code, Globe, Zap as ZapIcon,
  Database, GitBranch, Shield,
  CreditCard, Truck,
  CheckCircle, HelpCircle, ArrowRight as ArrowRightIcon,
  Star, Target, Users, Shield as ShieldIcon,
  LayoutGrid, Store, BarChart3, Settings2,
  FileCode, Download, Cloud, Cpu, Layers3,
  Circle, ArrowDown, GitMerge, HardDrive, Cpu as CpuIcon,
  Network, Terminal, Activity, Eye, Rocket,
  Package, ShoppingCart, Laptop, Globe2,
  User, Mail, LogOut, ExternalLink
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { supabase } from '@/lib/supabase'

const PARTICLE_COUNT = 300
const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
  id: i,
  size: Math.random() * 5 + 1,
  left: `${Math.random() * 120 - 10}%`,
  top: `${Math.random() * 120 - 10}%`,
  baseOpacity: i % 5 === 0 ? Math.random() * 0.5 + 0.3 : Math.random() * 0.2 + 0.04,
  animateX: Math.random() * 100 + 50,
  animateY: [Math.random() * 30 - 15, Math.random() * 20 - 10, Math.random() * 30 - 15],
  animateOpacity: i % 5 === 0
    ? [0.3, Math.random() * 0.4 + 0.4, Math.random() * 0.3 + 0.2, 0]
    : [0, Math.random() * 0.2 + 0.08, Math.random() * 0.1 + 0.04, 0],
  duration: i % 5 === 0 ? Math.random() * 8 + 6 : Math.random() * 12 + 10,
  delay: Math.random() * 15,
}))

function Nav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDrawerOpen(false)
    window.location.reload()
  }

  const links = [
    { label: 'Architektura', href: '#architecture' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Studio', href: '#studio' },
    { label: 'Runtime', href: '#runtime' },
    { label: 'Export', href: '#export' },
    { label: 'Mission Control', href: '#mission-control' },
    { label: 'Cennik', href: '#pricing' },
  ]

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#000000] shadow-lg shadow-violet-500/5' : 'bg-[#000000]/70 backdrop-blur-md'}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 w-[40%] h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]"
          animate={{ left: ['-30%', '130%'] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatDelay: 2 }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size="md" />
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href} className="text-sm font-semibold text-white hover:text-violet-400 transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm font-semibold text-violet-400 hover:text-white px-4 py-2 transition-colors flex items-center gap-1.5 bg-violet-500/5 rounded-full border border-violet-500/20">
              <User className="w-4 h-4" /> Panel
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-white hover:text-violet-400 px-4 py-2 transition-colors">Zaloguj</Link>
          )}
          
          {!user && (
            <Link href="/register" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm rounded-full transition-all hover:shadow-lg hover:shadow-violet-500/30">
              Rozpocznij <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Desktop Menu/Drawer Trigger Button */}
          <button 
            onClick={() => setDrawerOpen(true)} 
            className="p-2 text-slate-400 hover:text-white border border-white/10 hover:border-violet-500/30 rounded-full transition-colors bg-white/5 flex items-center justify-center cursor-pointer"
            title="Otwórz menu boczne"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile Menu Button - opens drawer directly */}
        <button 
          onClick={() => setDrawerOpen(true)} 
          className="md:hidden p-2 text-slate-400 hover:text-white border border-white/10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Drawer Side Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
          />
        )}

        {drawerOpen && (
          <motion.div
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#080911]/95 backdrop-blur-2xl border-l border-white/10 z-50 shadow-2xl p-6 flex flex-col justify-between pointer-events-auto text-left"
          >
              {/* Drawer Content */}
              <div className="overflow-y-auto flex-1 pr-1">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <Logo size="sm" />
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Session Info Card */}
                <div className="mt-8 mb-8">
                  {user ? (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zalogowano jako</p>
                          <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-violet-500/20 text-center"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Przejdź do Panelu
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-300 hover:text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Wyloguj się
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-sm text-slate-400 mb-4">Uzyskaj dostęp do swojego panelu e-commerce</p>
                      <div className="flex gap-3">
                        <Link
                          href="/login"
                          onClick={() => setDrawerOpen(false)}
                          className="flex-1 py-3 border border-white/10 hover:border-violet-500/30 text-white hover:bg-white/5 font-bold text-sm rounded-xl transition-all text-center"
                        >
                          Zaloguj się
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setDrawerOpen(false)}
                          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm rounded-xl transition-all text-center"
                        >
                          Zarejestruj
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">Nawigacja</p>
                  {links.map(l => (
                    <a
                      key={l.label}
                      href={l.href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                    >
                      {l.label}
                    </a>
                  ))}
                  <a
                    href="#faq"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                  >
                    Najczęstsze pytania (FAQ)
                  </a>
                </div>

                {/* Help & Support */}
                <div className="space-y-1 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">Pomoc i dokumentacja</p>
                  <a
                    href="https://docs.solospot.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <span>Dokumentacja platformy</span>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href="mailto:support@solospot.pl"
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <span>Centrum Pomocy</span>
                    <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>
                </div>

                {/* Contact Info */}
                <div className="space-y-1 px-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Szybki kontakt</p>
                  <div className="text-xs text-slate-400 space-y-2">
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-violet-400" />
                      <a href="mailto:kontakt@solospot.pl" className="hover:text-white transition-colors">kontakt@solospot.pl</a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-violet-400 font-bold">Tel:</span>
                      <span className="text-slate-300">+48 123 456 789</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer (Social Media) */}
              <div className="pt-6 border-t border-white/5 bg-[#080911]/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">© 2026 SoloSpot</span>
                <div className="flex gap-4">
                  <a href="https://facebook.com/solospot" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-violet-400 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  <a href="https://instagram.com/solospot" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-fuchsia-400 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                  <a href="https://twitter.com/solospot" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  </a>
                  <a href="https://github.com/solospot" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-16">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-transparent to-transparent" />
      <div 
        className="absolute inset-x-0 top-16 bottom-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:80px_80px]"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%)' }}
      />
      <div className="absolute left-0 top-0 w-[40vw] h-full pointer-events-none overflow-hidden">
        {mounted && particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              top: p.top,
              opacity: p.baseOpacity,
            }}
            animate={{
              x: [0, p.animateX],
              y: [0, ...p.animateY],
              opacity: p.animateOpacity,
            }}
            transition={{
              repeat: Infinity,
              duration: p.duration,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {/* POŚWIATA WCHODZĄCA POD NAPISY */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[90vw] h-[70vh] bg-gradient-to-l from-violet-600/20 via-fuchsia-600/15 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute right-0 top-16 w-full lg:w-[95vw] h-[calc(100vh-4rem)] pointer-events-none select-none overflow-hidden">
        {/* ZABEZPIECZONY OBECNY STAN (MŁODZIEŻOWY):
        <img
          src="/hero-store.png"
          alt=""
          className="w-full h-full object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,black_22%)]"
          aria-hidden
        />
        */}
        {/* ZABEZPIECZONY STAN (POWAŻNY / INFRASTRUKTURA):
        <img
          src="/hero-store-serious.png"
          alt=""
          className="w-full h-full object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,black_22%)]"
          aria-hidden
        />
        */}
        {/* ZABEZPIECZONY STAN (TWORZENIE / KUPNO SKLEPU I APLIKACJI - BEZ EFEKTÓW):
        <img
          src="/hero-store-builder.png"
          alt=""
          className="w-full h-full object-contain object-right [mask-image:linear-gradient(to_right,transparent_0%,black_45%,black_85%,transparent_100%)]"
          aria-hidden
        />
        */}
        {/* ULUBIONY STAN (SKLEP / KREATOR Z CZARNYM TŁEM I Falami Światła pod napisami) - ZACHOWANY JAKO KOPIA ZAPASOWA:
        <div className="w-full h-full flex justify-end">
          <img
            src="/hero-store-builder-black-glow.png"
            alt=""
            className="h-full w-auto object-contain mix-blend-lighten [mask-image:linear-gradient(to_right,transparent_0%,black_25%)] scale-110 origin-right"
            aria-hidden
          />
        </div>
        */}
        {/* NOWA ANIMACJA 3D E-COMMERCE */}
        <div className="w-full h-full flex justify-end items-center relative">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/hero-store-builder-black-glow.png"
            className="w-full h-full object-contain object-right mix-blend-lighten [mask-image:linear-gradient(to_right,transparent_0%,transparent_20%,black_40%)] translate-x-[9.5%]"
            aria-hidden
          >
            <source src="/hero_video.mp4" type="video/mp4" />
          </video>
        </div>





        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#050508]/10 to-[#050508]/30" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#000000] to-transparent" />
      </div>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32 flex items-center">
        <div className="relative max-w-4xl lg:-translate-x-20 xl:-translate-x-32">
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/25 mb-8">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">Commerce Operating System</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="w-full max-w-[900px] text-5xl md:text-6xl xl:text-7xl font-black text-white mb-6 leading-[1.0] tracking-[-0.06em]">
              Zbuduj to sam.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 block md:whitespace-nowrap py-1.5 -my-1.5">Wdróż system operacyjny</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 block py-1.5 -my-1.5">dla e-commerce.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg text-slate-300 mb-10 leading-relaxed max-w-lg">
              SoloSpot to platforma wielodostępowa do tworzenia, hostowania i skalowania produktów e-commerce.
              Marketplace gotowych biznesów. Studio konfiguracji bez kodu. Runtime Engine wykonujący JSON na żywo.
              Eksport HTML na dowolny hosting. Zero vendor lock-in.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/register"
                className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold rounded-full hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105">
                Zbuduj swój system <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard"
                className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-white font-medium rounded-full transition-all">
                Otwórz Mission Control <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FlowStepsSection() {
  const flowSteps = [
    { id: 1, label: 'Marketplace', icon: Store, desc: 'Wybierz gotowy model biznesowy', color: 'from-violet-500 to-fuchsia-500' },
    { id: 2, label: 'Kup lub Zbuduj', icon: Package, desc: 'Zainstaluj szablon lub skonfiguruj od zera', color: 'from-fuchsia-500 to-pink-500' },
    { id: 3, label: 'Studio', icon: LayoutDashboard, desc: 'Konfiguruj wizualnie: strony, sekcje, motyw, SEO', color: 'from-pink-500 to-red-500' },
    { id: 4, label: 'Publish', icon: Rocket, desc: 'Jednym kliknięciem na platformie SoloSpot', color: 'from-red-500 to-orange-500' },
    { id: 5, label: 'Hosting', icon: Globe2, desc: 'Edge CDN, SSL, domeny — zarządzane automatycznie', color: 'from-orange-500 to-amber-500' },
    { id: 6, label: 'Export HTML', icon: FileCode, desc: 'Eksportuj statyczne pliki. Hostuj gdzie chcesz.', color: 'from-amber-500 to-emerald-500' },
  ]

  return (
    <section className="relative py-20 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent -translate-y-1/2 hidden md:block" />
        <div className="relative flex flex-wrap md:flex-nowrap items-start justify-center gap-8 lg:gap-12">
          {flowSteps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center relative z-10 w-[140px] md:w-32"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl shadow-violet-500/20 relative z-10 hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <div className="mt-4 text-center w-full">
                <p className="font-bold text-white text-sm">{step.label}</p>
                <p className="text-slate-500 text-xs mt-1 leading-normal">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StackPanel() {
  const stackLayers = [
    { icon: ShieldCheck, label: 'Identyfikacja i auth', color: 'text-emerald-400', desc: 'Multi-tenant auth, SSO, SAML, OIDC' },
    { icon: Server, label: 'Silnik tenantów', color: 'text-violet-400', desc: 'Provisioning, izolacja, orkiestracja zdarzeń' },
    { icon: Box, label: 'Marketplace', color: 'text-fuchsia-400', desc: 'Rejestr szablonów, revenue share, wersjonowanie' },
    { icon: Layers, label: 'Runtime Engine', color: 'text-amber-400', desc: 'JSON → React → HTML/Edge, zero build' },
    { icon: Zap, label: 'Silnik handlowy', color: 'text-pink-400', desc: 'Płatności, zamówienia, podatki, wysyłka, zapasy' },
    { icon: Sparkles, label: 'Mission Control', color: 'text-cyan-400', desc: 'Monitoring, deploy, audyt, zarządzanie platformą' },
  ]

  return (
    <section className="px-6 pt-10 pb-24 lg:pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/15 to-amber-500/15 rounded-3xl blur-3xl" />
          <div className="relative bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider text-center mb-8">Stos platformy — 6 warstw</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stackLayers.map((layer, i) => (
                <motion.div key={layer.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <layer.icon className={`w-4 h-4 ${layer.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-200 block">{layer.label}</span>
                    <span className="text-xs text-slate-500">{layer.desc}</span>
                  </div>
                  <span className="ml-auto text-xs font-mono text-slate-600 bg-white/5 px-2 py-1 rounded-md flex-shrink-0">L{i + 1}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlatformArchitecture() {
  const tiers = [
    {
      title: 'Podstawowa infrastruktura',
      description: 'Platforma wielodostępowa z identyfikacją, provisioningiem i orkiestracją zdarzeń.',
      items: ['Silnik wielodostępowy', 'Auth i tożsamość', 'System zdarzeń', 'Izolacja tenantów', 'Oś audytu'],
      gradient: 'from-violet-500/10 to-fuchsia-500/10',
      border: 'border-violet-500/20',
    },
    {
      title: 'Silnik handlowy',
      description: 'Pełne przetwarzanie płatności, zarządzanie zamówieniami i obliczanie podatków/wysyłki.',
      items: ['Silnik płatności', 'Przetwarzanie zamówień', 'Silnik podatkowy', 'Silnik wysyłki', 'Zapasy'],
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
    },
    {
      title: 'System szablonów',
      description: 'Instalowalne pakiety biznesowe. Moda, Uroda, Gastronomia, Cyfrowe — każdy z produktami i brandingiem.',
      items: ['Rejestr szablonów', 'Zasiewanie produktów', 'Silnik motywów', 'System brandingu', 'API Marketplace'],
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Silnik wykonawczy',
      description: 'Renderuje konfigurację sklepu w działające strony. JSON → komponenty React → HTML.',
      items: ['Resolver wykonawczy', 'Renderer sekcji', 'Środowisko sklepu', 'Tryb podglądu', 'API eksportu'],
      gradient: 'from-pink-500/10 to-rose-500/10',
      border: 'border-pink-500/20',
    },
  ]
  return (
    <section id="architecture" className="pt-72 pb-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
          <Layers className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">Architektura platformy</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Zbudowana pod skalę,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">zaprojektowana dla produktów.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Cztery zintegrowane warstwy, które współpracują, aby tworzyć, wdrażać i zarządzać produktami cyfrowego handlu.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {tiers.map((tier, i) => (
          <div key={i} className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-3/4 h-3/4 blur-[120px] rounded-full opacity-50`}
                style={{
                  background: i === 0 ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' :
                              i === 1 ? 'linear-gradient(135deg, #f59e0b, #ea580c)' :
                              i === 2 ? 'linear-gradient(135deg, #10b981, #14b8a6)' :
                                        'linear-gradient(135deg, #ec4899, #f43f5e)'
                }}
              />
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border ${tier.border} bg-gradient-to-br ${tier.gradient} p-8`}>
              <h3 className="text-lg font-bold text-white mb-2">{tier.title}</h3>
              <p className="text-sm text-slate-400 mb-6">{tier.description}</p>
              <div className="flex flex-wrap gap-2">
                {tier.items.map((item) => (
                  <span key={item} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MarketplaceSection() {
  const steps = [
    { number: '01', title: 'Przeglądaj Marketplace', desc: '4 kategorie: Moda, Uroda, Gastronomia, Cyfrowe. Każdy szablon to gotowy biznes: produkty, motyw, sekcje, SEO.', icon: Store },
    { number: '02', title: 'Kup licencję', desc: 'Jednorazowa opłata (199–399 PLN) lub subskrypcja. Natychmiastowy dostęp do pakietu JSON + assets.', icon: CreditCard },
    { number: '03', title: 'Provisioning automatyczny', desc: 'Platforma tworzy tenant, izolowaną bazę, wstrzykuje dane, generuje klucze API. 30 sekund.', icon: CpuIcon },
    { number: '04', title: 'Lądujesz w Studio', desc: 'Gotowy sklep otwiera się w builderze. Wszystko skonfigurowane. Edytujesz tylko to, co chcesz.', icon: LayoutDashboard },
    { number: '05', title: 'Publikuj / Eksportuj', desc: 'Wdróż na platformie (Edge CDN, SSL, domeny) lub wyeksportuj HTML na własny hosting.', icon: Rocket },
  ]

  return (
    <section id="marketplace" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 mb-6">
          <Box className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase">Marketplace</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Nie kupujesz szablonu.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">Kupujesz gotowy biznes.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-xl mx-auto">
          Każdy produkt w Marketplace to kompletny pakiet: baza produktów, motyw, sekcje, konfiguracja płatności/wysyłki, SEO.
          Instalacja = provisioning tenantu w 30 sekund.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-fuchsia-500/30 to-amber-500/30 -translate-x-1/2 hidden lg:block" />
        <div className="space-y-16">
          {steps.map((step, i) => (
            <motion.div key={step.number} initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex items-start gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
              <div className={`flex-1 lg:w-1/2 ${i % 2 === 1 ? 'lg:pl-16' : 'lg:pr-16'} lg:pt-4`}>
                <div className="relative">
                  <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border-4 border-[#000000] z-10 hidden lg:block" />
                  <div className={`bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 ${i % 2 === 1 ? 'ml-12' : 'mr-12'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-black text-violet-400/50 font-mono">{step.number}</span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-fuchsia-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 lg:w-1/2">
                <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                  <div className="relative w-full h-full bg-[#0a0f1a] rounded-xl border border-white/5 flex items-center justify-center">
                    {i === 0 && (
                      <div className="text-center p-8">
                        <Store className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-500 text-lg">Marketplace: 4 kategorie, 12+ szablonów</p>
                        <p className="text-slate-700 text-sm mt-2">Fashion Pro • Beauty • Restaurant • Digital</p>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="text-center p-8">
                        <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-500 text-lg">Checkout: Stripe / 1Koszyk / Przelewy24</p>
                        <p className="text-slate-700 text-sm mt-2">Licencja jednorazowa lub subskrypcja</p>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="text-center p-8">
                        <CpuIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-500 text-lg">Provisioning: tenant + DB + klucze API</p>
                        <p className="text-slate-700 text-sm mt-2">~30 sekund • Zero konfiguracji ręcznej</p>
                      </div>
                    )}
                    {i === 3 && (
                      <div className="text-center p-8">
                        <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-500 text-lg">Studio: gotowy sklep do edycji</p>
                        <p className="text-slate-700 text-sm mt-2">Strony • Sekcje • Motyw • Produkty • SEO</p>
                      </div>
                    )}
                    {i === 4 && (
                      <div className="text-center p-8">
                        <div className="flex gap-4 justify-center">
                          <div className="p-4 bg-violet-500/20 rounded-xl">
                            <Rocket className="w-8 h-8 text-violet-400" />
                          </div>
                          <div className="p-4 bg-emerald-500/20 rounded-xl">
                            <FileCode className="w-8 h-8 text-emerald-400" />
                          </div>
                        </div>
                        <p className="text-slate-500 text-lg mt-4">Publish na platformie LUB Export HTML</p>
                        <p className="text-slate-700 text-sm mt-2">Edge CDN • SSL • Domeny • Dowolny hosting</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link href="/dashboard/templates"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all">
          Przeglądaj Marketplace <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

function StudioSection() {
  const workflowSteps = [
    { id: 1, label: 'Nowy sklep', desc: 'Z Marketplace lub pusty tenant', icon: Plus },
    { id: 2, label: 'Wybór Template', desc: 'Fashion Pro, Beauty, Restaurant, Digital...', icon: Package },
    { id: 3, label: 'Edycja w Studio', desc: 'Strony • Sekcje • Motyw • Produkty • SEO', icon: LayoutDashboard },
    { id: 4, label: 'Live Preview', desc: 'Podgląd na żywo w czasie rzeczywistym', icon: Eye },
    { id: 5, label: 'Publikacja', desc: 'Edge deploy + SSL + domena w sekundach', icon: Rocket },
  ]

  const tabs = ['Strony', 'Sekcje', 'Motyw', 'Produkty', 'SEO', 'Publikuj']

  return (
    <section id="studio" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
          <LayoutDashboard className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">Studio Builder</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Konfigurujesz w <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">Studio.</span>
          <br />Publikujesz w sekundy.
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Wizualny builder dla Commerce OS. Zero kodu. Deklaratywna konfiguracja JSON.
          Każda zmiana natychmiast widoczna w Live Preview.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        <div className="space-y-6">
          <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Workflow</h3>
            <div className="space-y-4">
              {workflowSteps.map((step, i) => (
                <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{step.label}</p>
                    <p className="text-xs text-slate-500">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Zakładki Studio</h3>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab, i) => (
                <span key={tab} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  i === 0 ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}>
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#000000]/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 text-center text-xs text-slate-500 font-mono">studio.solospot.local</div>
              <div className="w-24 h-6 bg-emerald-500/20 rounded border border-emerald-500/30 flex items-center justify-center">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live
                </span>
              </div>
            </div>
            <div className="p-8 h-[500px] flex items-center justify-center">
              <div className="w-full max-w-2xl mx-auto">
                <div className="bg-[#0a0f1a] rounded-2xl border border-white/5 p-8 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                  <div className="text-center z-10">
                    <Monitor className="w-20 h-20 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-500 text-lg">Live Preview — rzeczywisty sklep</p>
                    <p className="text-slate-700 text-sm mt-2">Wybierz sekcję z lewego panelu w Studio</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-violet-500/5 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RuntimeEngineSection() {
  const pipeline = [
    { stage: 'INPUT', label: 'Konfiguracja JSON', desc: 'Strony, sekcje, motyw, produkty, SEO, płatności, wysyłka', icon: FileCode, color: 'text-violet-400', bg: 'from-violet-500/20 to-fuchsia-500/20' },
    { stage: 'RESOLVE', label: 'Resolver wykonawczy', desc: 'Rozwiązuje zależności, ładuje szablony, wstrzykuje dane tenantów', icon: GitMerge, color: 'text-fuchsia-400', bg: 'from-fuchsia-500/20 to-pink-500/20' },
    { stage: 'RENDER', label: 'Renderer sekcji', desc: 'Mapuje typy na komponenty React, SSR + CSR hydration', icon: LayoutGrid, color: 'text-pink-400', bg: 'from-pink-500/20 to-red-500/20' },
    { stage: 'RUNTIME', label: 'Środowisko sklepu', desc: 'Koszyk, checkout, konto, płatności — gotowe moduły biznesowe', icon: Store, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' },
    { stage: 'EXPORT', label: 'Eksport HTML/Static', desc: 'Generuje statyczne pliki + assets do CDN/Edge', icon: FileCode, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
    { stage: 'EDGE', label: 'Runtime Edge', desc: 'Vercel Edge, Cloudflare Workers, V8 Isolates', icon: Cloud, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-500/20' },
  ]

  const techSpecs = [
    { label: 'Zero build time', value: 'Konfiguracja interpretowana w runtime' },
    { label: 'Cold start', value: '< 50ms na Edge (V8 Isolates)' },
    { label: 'Bundle size', value: '~45KB gzipped (shared runtime)' },
    { label: 'Multi-tenant', value: '1 instancja = ∞ tenantów, izolacja na poziomie DB' },
    { label: 'Schema', value: 'JSON Schema + TypeScript types (source of truth)' },
    { label: 'Extensibility', value: 'Custom sections via Component Registry' },
  ]

  return (
    <section id="runtime" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
          <Cpu className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold tracking-widest text-pink-400 uppercase">Runtime Engine</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Silnik wykonawczy:<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-red-400 to-orange-400">JSON → Sklep na żywo.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Zero buildów. Zero deployów. Konfiguracja JSON jest interpretowana w czasie rzeczywistym.
          Sklep działa natychmiast po zapisie. To nie generator stron — to runtime engine.
        </p>
      </div>

      <div className="relative mb-20">
        <div className="absolute left-1/2 top-1/2 w-px h-3/4 bg-gradient-to-b from-violet-500/30 via-fuchsia-500/30 to-amber-500/30 -translate-x-1/2 -translate-y-1/2 hidden lg:block" />
        <div className="grid lg:grid-cols-6 gap-4">
          {pipeline.map((step, i) => (
            <motion.div key={step.stage} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="relative">
              <div className={`relative bg-gradient-to-br ${step.bg} border border-white/10 rounded-2xl p-6 h-full flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{step.stage}</span>
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.label}</h3>
                <p className="text-sm text-slate-400 flex-1">{step.desc}</p>
                {i < pipeline.length - 1 && (
                  <div className="absolute right-0 top-1/2 w-4 h-4 -translate-y-1/2 translate-x-1/2 hidden lg:block">
                    <ArrowRight className="w-4 h-4 text-violet-500/50" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-12">
        <h3 className="text-lg font-bold text-white mb-8 text-center">Specyfikacja techniczna</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {techSpecs.map((spec, i) => (
            <motion.div key={spec.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-2xl font-black text-white mb-1">{spec.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{spec.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HTMLExportSection() {
  const features = [
    { icon: FileCode, title: 'Statyczny HTML/CSS/JS', desc: 'Czyste pliki — bez Node.js, bez bazy, bez kontenerów. Działają wszędzie.' },
    { icon: Globe, title: 'Edge/CDN Ready', desc: 'Optymalizowane pod cache: TTFB < 50ms globalnie. Vercel, Netlify, Cloudflare, AWS S3+CF.' },
    { icon: ZapIcon, title: 'Hydration opcjonalny', desc: 'Dodaj interaktywność (koszyk, filtry) przez lekki layer — lub zostaw czysty HTML.' },
    { icon: ShieldIcon, title: 'Bezpieczeństwo by design', desc: 'Brak backendu = brak powierzchni ataku. Płatności w iframe/checkout providera.' },
    { icon: HardDrive, title: 'Wersjonowanie i rollback', desc: 'Każdy eksport to wersja. Powrót do dowolnej wersji jednym kliknięciem.' },
    { icon: Terminal, title: 'CLI / CI/CD Native', desc: 'solospot export --store fashion-pro --output ./dist --cdn cloudflare. Gotowe do pipeline.' },
  ]

  const comparison = [
    { feature: 'Hosting', traditional: 'Vendor lock-in (Shopify, Wix)', soloSpot: 'Dowolny: Vercel, Netlify, CF Pages, AWS, VPS, on-premise' },
    { feature: 'Backend', traditional: 'Wymagany, zarządzany przez vendor', soloSpot: 'Opcjonalny (hydration) / Brak (static)' },
    { feature: 'Skalowanie', traditional: 'Limity planu, upgrade kosztowny', soloSpot: 'Edge CDN skaluje automatycznie, zero kosztów' },
    { feature: 'Właśność danych', traditional: 'Zamknięte API, eksport ograniczony', soloSpot: 'Pełna własność plików, bazy, kodu' },
    { feature: 'Koszt', traditional: '% od obrotu + abonament', soloSpot: 'Stały abonament za platformę, 0% od transakcji' },
    { feature: 'Compliance', traditional: 'Dane u vendor', soloSpot: 'Dane u Ciebie (GDPR, PCI DSS friendly)' },
  ]

  return (
    <section id="export" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <Download className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">HTML Export</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Eksportuj na<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">dowolny hosting.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          To nie jest feature. To produkt. SoloSpot nie zamyka Cię w vendor lock-in.
          Eksportuj sklep jako statyczne pliki i hostuj gdzie chcesz. Pełna suwerenność.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all">
              <f.icon className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 lg:p-12 mb-16">
        <h3 className="text-2xl font-bold text-white mb-8 text-center">Porównanie: SaaS vs SoloSpot Export</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Cecha</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tradycyjny SaaS</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">SoloSpot Export</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c, i) => (
                <tr key={c.feature} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                  <td className="px-6 py-4 font-medium text-white">{c.feature}</td>
                  <td className="px-6 py-4 text-slate-400">{c.traditional}</td>
                  <td className="px-6 py-4 text-emerald-300 font-medium">{c.soloSpot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-[#000000] rounded-2xl p-8 max-w-2xl mx-auto border border-white/10">
          <div className="flex items-center gap-3 justify-center mb-4">
            <Terminal className="w-6 h-6 text-emerald-400" />
            <span className="text-lg font-bold text-white">Przykład komendy eksportu</span>
          </div>
          <div className="bg-[#050508] rounded-xl p-4 font-mono text-sm text-emerald-300 text-left overflow-x-auto">
            <span className="text-slate-500">$ </span><span className="text-white">solospot export</span> <span className="text-violet-400">--store</span> <span className="text-amber-400">fashion-pro</span> <span className="text-violet-400">--output</span> <span className="text-amber-400">./dist</span> <span className="text-violet-400">--cdn</span> <span className="text-amber-400">cloudflare</span> <span className="text-violet-400">--hydrate</span> <span className="text-amber-400">cart,filters</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function MissionControlSection() {
  const metrics = [
    { label: 'Aktywni tenantów', value: '1,247', change: '+12%', icon: Users, color: 'text-violet-400', trend: 'up' },
    { label: 'Zamówienia / 24h', value: '3,891', change: '+8%', icon: ShoppingCart, color: 'text-emerald-400', trend: 'up' },
    { label: 'Przychód platformy', value: '284k PLN', change: '+23%', icon: CreditCard, color: 'text-amber-400', trend: 'up' },
    { label: 'Uptime', value: '99.99%', change: '0%', icon: ShieldIcon, color: 'text-cyan-400', trend: 'neutral' },
    { label: 'Eksporty / tydzień', value: '89', change: '+34%', icon: Download, color: 'text-emerald-400', trend: 'up' },
    { label: 'Provisioning time', value: '28s', change: '-15%', icon: CpuIcon, color: 'text-violet-400', trend: 'up' },
  ]

  const tenants = [
    { name: 'Fashion Store Pro', domain: 'fashion.demo.wf', plan: 'Pro', status: 'active', revenue: '12.4k', health: 98, lastDeploy: '2h ago' },
    { name: 'Beauty Lab', domain: 'beauty.demo.wf', plan: 'Business', status: 'active', revenue: '8.7k', health: 100, lastDeploy: '1d ago' },
    { name: 'Restaurant Hub', domain: 'food.demo.wf', plan: 'Enterprise', status: 'active', revenue: '45.2k', health: 99, lastDeploy: '4h ago' },
    { name: 'Digital Goods', domain: 'digital.demo.wf', plan: 'Starter', status: 'trial', revenue: '1.2k', health: 87, lastDeploy: '6h ago' },
    { name: 'Home & Decor', domain: 'home.demo.wf', plan: 'Pro', status: 'active', revenue: '19.8k', health: 95, lastDeploy: '12h ago' },
  ]

  const events = [
    { time: '2 min temu', type: 'deploy', message: 'fashion.demo.wf — v2.4.1 deployed to Edge', status: 'success' },
    { time: '5 min temu', type: 'provision', message: 'New tenant: beauty-lab-pro — provisioned in 26s', status: 'success' },
    { time: '12 min temu', type: 'export', message: 'restaurant-hub — HTML export completed (2.4MB)', status: 'success' },
    { time: '18 min temu', type: 'alert', message: 'Payment webhook latency spike (Stripe) — auto-recovered', status: 'warning' },
    { time: '35 min temu', type: 'scale', message: 'Edge nodes scaled: 12 → 18 (Black Friday prep)', status: 'info' },
    { time: '1h temu', type: 'provision', message: 'Tenant fashion-pro-v2 — template installed', status: 'success' },
  ]

  return (
    <section id="mission-control" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Mission Control</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Centrum dowodzenia<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">platformy.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Pełna obserwowalność: tenantów, provisioningu, deployów, eksportów, płatności, zdarzeń, logów audytu.
          Zarządzasz platformą z jednego miejsca.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <span className="text-xs text-slate-400">{m.label}</span>
            </div>
            <div className="text-2xl font-black text-white">{m.value}</div>
            <div className={`text-xs font-medium mt-1 ${m.trend === 'up' ? 'text-emerald-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
              {m.change} vs tydzień temu
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Dzierżawy na platformie</h3>
            <Link href="/mission-control/tenants" className="text-sm text-violet-400 hover:text-violet-300 font-medium">Zarządzaj wszystkimi</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {['Sklep', 'Domena', 'Plan', 'Status', 'Health', 'Przychód / msc', 'Ostatni deploy'].map(h => (
                    <th key={h} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{t.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{t.domain}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.plan === 'Enterprise' ? 'bg-purple-500/20 text-purple-400' :
                        t.plan === 'Business' ? 'bg-blue-500/20 text-blue-400' :
                        t.plan === 'Pro' ? 'bg-violet-500/20 text-violet-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{t.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-sm ${
                        t.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {t.status === 'active' ? 'Aktywny' : 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all`} style={{ width: `${t.health}%` }} />
                        </div>
                        <span className="text-xs font-mono text-slate-400 w-10">{t.health}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-white">{t.revenue}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">{t.lastDeploy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Strumień zdarzeń platformy</h3>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {events.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${e.status === 'success' ? 'bg-emerald-500/20' : e.status === 'warning' ? 'bg-amber-500/20' : 'bg-cyan-500/20'}`}>
                    {e.type === 'deploy' && <Rocket className="w-4 h-4 text-emerald-400" />}
                    {e.type === 'provision' && <Package className="w-4 h-4 text-violet-400" />}
                    {e.type === 'export' && <Download className="w-4 h-4 text-emerald-400" />}
                    {e.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {e.type === 'scale' && <Activity className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{e.message}</p>
                    <p className="text-xs text-slate-500 font-mono">{e.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Status platformy</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'API Gateway', status: 'operational', latency: '12ms' },
                { label: 'Runtime Engine', status: 'operational', latency: '8ms' },
                { label: 'Edge CDN', status: 'operational', latency: '23ms' },
                { label: 'Payment Engine', status: 'degraded', latency: '145ms' },
                { label: 'Database (Primary)', status: 'operational', latency: '4ms' },
                { label: 'Event Bus', status: 'operational', latency: '2ms' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{s.label}</span>
                    <span className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.latency} p95</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhySoloSpotSection() {
  const pillars = [
    {
      icon: Zap,
      title: 'Time-to-market: godziny, nie miesiące',
      desc: 'Zainstaluj szablon z Marketplace → provisioning automatyczny (30s) → edycja w Studio → publish. Pierwsze zamówienie tego samego dnia.',
      metric: '~2h od zera do live',
    },
    {
      icon: ShieldCheck,
      title: 'Izolacja tenantów na poziomie infrastruktury',
      desc: 'Każdy sklep to oddzielny tenant z własną bazą, plikami, kluczami API, konfiguracją. Zero wycieków danych między sklepami. Architektura Enterprise.',
      metric: '100% izolacja',
    },
    {
      icon: Layers,
      title: 'Platforma, nie generator stron',
      desc: 'Masz silnik płatności, zamówień, podatków, wysyłki, zapasów, B2B, hurtowni. To e-commerce operating system, nie CMS.',
      metric: '6 warstw platformy',
    },
    {
      icon: Box,
      title: 'Gotowe modele biznesowe w Marketplace',
      desc: 'Moda, Uroda, Gastronomia, Cyfrowe — każdy szablon to produkt, produkty, motyw, sekcje, SEO, konfiguracja płatności/wysyłki.',
      metric: '12+ szablonów gotowych',
    },
    {
      icon: Globe,
      title: 'Eksport HTML = wolność hostingu',
      desc: 'Hostuj na Vercel, Netlify, Cloudflare, AWS, własnym serwerze. Zero vendor lock-in. Pełna suwerenność danych i kodu.',
      metric: 'Dowolny hosting',
    },
    {
      icon: Settings2,
      title: 'Multi-tenant by design',
      desc: 'Jedna instancja platformy obsługuje tysiące sklepów. Skalujemy pionowo (infra), Ty rosniesz poziomo (biznes).',
      metric: '∞ tenantów / instancja',
    },
  ]

  return (
    <section id="why" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Dlaczego SoloSpot</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Nie budujemy sklepów.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">Budujemy system operacyjny dla e-commerce.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          SoloSpot to infrastruktura klasy Enterprise dla produktów e-commerce. Wielodostępna, rozszerzalna, bez vendor lock-in.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group relative p-6 bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-violet-500/30 transition-all">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 group-hover:border-violet-500/30 transition-all">
                <p.icon className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 mb-4">{p.desc}</p>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 inline-block">
                {p.metric}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function IntegrationsSection() {
  const categories = [
    { name: 'Płatności', icon: CreditCard, items: ['Stripe', '1Koszyk', 'Przelewy24', 'PayPal', 'Apple Pay', 'Google Pay'], color: 'from-violet-500 to-fuchsia-500' },
    { name: 'Wysyłka i logistyka', icon: Truck, items: ['InPost', 'DPD', 'DHL', 'Poczta Polska', 'FedEx', 'UPS'], color: 'from-amber-500 to-orange-500' },
    { name: 'ERP i magazyn', icon: Database, items: ['Subiekt GT', 'Enova', 'Comarch', 'SAP Business One', 'Microsoft Dynamics', 'BaseLinker'], color: 'from-emerald-500 to-teal-500' },
    { name: 'Marketing i analityka', icon: BarChart3, items: ['Google Analytics 4', 'Meta Pixel', 'TikTok Pixel', 'Klaviyo', 'Mailchimp', 'PostHog'], color: 'from-pink-500 to-rose-500' },
    { name: 'Rozwój i CI/CD', icon: GitBranch, items: ['GitHub Actions', 'GitLab CI', 'Vercel', 'Netlify', 'Cloudflare Pages', 'Docker'], color: 'from-cyan-500 to-blue-500' },
    { name: 'Tożsamość i bezpieczeństwo', icon: Shield, items: ['Auth0', 'Clerk', 'Supabase Auth', 'NextAuth', 'OAuth 2.0 / OIDC', 'SAML/SSO'], color: 'from-indigo-500 to-purple-500' },
  ]

  return (
    <section id="integrations" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">Ekosystem integracji</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Połączony z Twoim<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">ekosystemem.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          SoloSpot nie zastępuje Twoich narzędzi — integruje się z nimi. Płatności, wysyłka, ERP, marketing, CI/CD, tożsamość.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <cat.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">{cat.name}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <span key={item} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 hover:border-violet-500/30 hover:text-white transition-all">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-2">Brakuje Ci integracji?</h3>
          <p className="text-slate-400 mb-6">Mamy otwarte API i webhook system. Zbuduj własną integrację lub daj nam znać — dodamy ją do roadmapy.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all">
            Dokumentacja API <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const tiers = [
    {
      name: 'Starter',
      subtitle: 'Dla indywidualnych twórców',
      price: '0',
      period: 'PLN / mc',
      description: 'Jeden sklep. Podstawowa platforma. Bez limitów produktów.',
      capabilities: ['1 tenant (sklep)', 'Do 100 zamówień/mc', 'Marketplace szablonów', 'Studio Builder', 'HTML Export', 'Wsparcie email (48h)'],
      cta: 'Rozpocznij za darmo',
      popular: false,
      gradient: 'from-violet-500/10 to-fuchsia-500/10',
      border: 'border-violet-500/20',
      buttonGradient: 'from-violet-600 via-fuchsia-600 to-pink-600',
    },
    {
      name: 'Pro',
      subtitle: 'Dla rosnących biznesów',
      price: '299',
      period: 'PLN / mc',
      description: 'Bez limitów zamówień. Mission Control. API & Webhooks.',
      capabilities: ['Do 5 tenantów', 'Nieograniczone zamówienia', 'Wszystkie szablony Pro', 'Mission Control', 'API & Webhooks', 'Priorytetowe wsparcie (4h)', 'Własna domena'],
      cta: 'Wybierz Pro',
      popular: true,
      gradient: 'from-violet-500/20 to-fuchsia-500/20',
      border: 'border-violet-500/40',
      buttonGradient: 'from-violet-600 via-fuchsia-600 to-pink-600',
    },
    {
      name: 'Business',
      subtitle: 'Dla zespołów i agencji',
      price: '799',
      period: 'PLN / mc',
      description: 'Wiele sklepów. Współpraca zespołowa. Zaawansowane uprawnienia.',
      capabilities: ['Do 20 tenantów', 'Współpraca zespołowa', 'Role i uprawnienia', 'Audit Log', 'SSO / SAML', 'Dedykowany Success Manager', 'SLA 99.9%'],
      cta: 'Wybierz Business',
      popular: false,
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      buttonGradient: 'from-amber-600 via-orange-600 to-red-600',
    },
    {
      name: 'Enterprise',
      subtitle: 'Dla dużych organizacji',
      price: 'Custom',
      period: '',
      description: 'Pełna kontrola. Hosting on-premise / VPC. Własny runtime.',
      capabilities: ['Nielimitowane tenanty', 'Hosting on-premise / VPC', 'Własny runtime', 'Custom SLA', 'Dedykowany inżynier', 'Code escrow', 'Audyt bezpieczeństwa'],
      cta: 'Skontaktuj się',
      popular: false,
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
      buttonGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/20 mb-6">
          <Star className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Cennik platformy</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Płacisz za platformę,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">nie za liczbę produktów.</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Wszystkie plany zawierają dostęp do Marketplace, Studio, Runtime Engine, HTML Export.
          Różnią się skalą: liczba tenantów, wsparcie, SLA, możliwości Enterprise.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, i) => (
          <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`relative rounded-3xl p-8 bg-gradient-to-br ${tier.gradient} border ${tier.border} flex flex-col ${tier.popular ? 'ring-2 ring-violet-500/50 scale-105 z-10' : ''}`}>
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded-full">
                Najpopularniejszy
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">{tier.subtitle}</span>
              </div>
              <p className="text-sm text-slate-400">{tier.description}</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">{tier.price}</span>
                <span className="text-slate-500">{tier.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {tier.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className={`group flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all ${tier.buttonGradient} hover:shadow-2xl hover:shadow-violet-500/30`}>
              {tier.cta} <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <p className="text-slate-500 mb-4">Wszystkie ceny netto. Faktura VAT 23%. Anuluj w dowolnej chwili. Bez ukrytych opłat.</p>
        <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all">
          Szczegółowe porównanie planów <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

function FAQSection() {
  const faqs = [
    { q: 'Czy SoloSpot to kolejny SaaS do sklepów (jak Shopify/Wix)?', a: 'Nie. SaaS zamyka Cię w ich ekosystemie. SoloSpot to Commerce Operating System: masz platformę wielodostępową do uruchamiania własnych produktów e-commerce, ale eksportujesz je jako statyczne pliki HTML i hostujesz gdzie chcesz. Zero vendor lock-in.' },
    { q: 'Jak wygląda migracja z Shopify / WooCommerce / Shoper?', a: 'Zapewniamy narzędzia do migracji produktów, zamówień, klientów. Dla planów Business+ dedykowany inżynier przeprowadza migrację end-to-end. Dane zostają Twoje — eksportujesz je w dowolnej chwili.' },
    { q: 'Czy muszę hostować u Was?', a: 'Nie. Dzięki HTML Export wyeksportujesz sklep jako statyczne pliki i postawisz na Vercel, Netlify, Cloudflare Pages, AWS S3+CloudFront, własnym serwerze, on-premise. Masz pełną kontrolę nad hostingiem i danymi.' },
    { q: 'Jak działa model wielodostępny (multi-tenant)?', a: 'Jedna instancja platformy obsługuje tysiące sklepów. Każdy tenant ma izolowaną bazę danych (PostgreSQL schema lub oddzielna DB), pliki, klucze API, konfigurację. Zmiany w jednym sklepie nie wpływają na inne. To architektura Enterprise, nie shared hosting.' },
    { q: 'Jak wygląda obsługa płatności?', a: 'Platforma ma wbudowany Payment Engine z adapterami: Stripe, 1Koszyk, Przelewy24, PayPal, BLIK. Konfigurujesz klucze API w panelu — resztę obsługujemy my (webhooki, statusy, zwroty, rozliczenia, split payments).' },
    { q: 'Czy mogę tworzyć i sprzedawać własne szablony?', a: 'Tak. System szablonów jest otwarty. Tworzysz pakiet JSON z definicją stron, sekcji, motywu, produktów, brandingu. Możesz sprzedawać w Marketplace SoloSpot (revenue share 70/30) lub dystrybuować prywatnie.' },
    { q: 'Jak wygląda skalowalność na Black Friday?', a: 'Runtime Engine działa na Edge (Vercel Edge, Cloudflare Workers, V8 Isolates). Skaluje się automatycznie do milionów requestów. Baza danych (Supabase/PostgreSQL) skaluje pionowo i poziomo. Platforma obsługuje Black Friday bez konfiguracji.' },
    { q: 'Jakie są koszty transakcyjne?', a: 'SoloSpot nie pobiera prowizji od transakcji. Płacisz tylko stały abonament za platformę + prowizje providera płatności (Stripe: ~2.9% + 1.20 PLN, 1Koszyk: wedle cennika). Żadnych % od obrotu.' },
    { q: 'Czy platforma obsługuje B2B / hurtownię?', a: 'Tak. Silnik handlowy obsługuje: grupy cenowe, ceny hurtowe, minimalne ilości zamówienia (MOQ), faktury VAT, limity kredytowe, zapytania ofertowe, cykle rozliczeniowe. Konfigurujesz to w Studio bez kodu.' },
    { q: 'Jak wygląda wsparcie techniczne?', a: 'Starter: email (48h). Pro: priorytetowe email + czat (4h). Business: dedykowany Success Manager, Slack Connect, telefon. Enterprise: dedykowany inżynier, code review, SLA 99.9%, audyt bezpieczeństwa, code escrow.' },
  ]
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <section id="faq" className="py-32 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-500/10 border border-slate-500/20 mb-6">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">FAQ</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          Pytania o platformę?<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">Mamy odpowiedzi.</span>
        </h2>
        <p className="text-xl text-slate-400">
          Nie znalazłeś odpowiedzi? <Link href="/contact" className="text-violet-400 hover:text-violet-300 underline">Napisz do nas</Link>
        </p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="bg-[#080c18]/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left"
              aria-expanded={openIndex === i}
            >
              <span className="text-lg font-medium text-white pr-10">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            </button>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 border-t border-white/5">
                <p className="text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-amber-500/15 rounded-3xl blur-xl" />
        <div className="relative bg-[#080c18] border border-violet-500/15 rounded-3xl p-16 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-[60px]" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">
            Gotowy wdrożyć<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">
              Commerce Operating System?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 relative z-10 max-w-lg mx-auto">
            Stwórz sklep w minutach. Wdróż natychmiast. Skaluj bez ograniczeń. Eksportuj gdzie chcesz.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/register" className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold rounded-full hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105">
              Zbuduj swój system <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-violet-500/30 text-slate-300 hover:text-white hover:bg-white/5 font-medium rounded-full transition-all">
              Otwórz Mission Control
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-violet-500/10 py-12 px-6 bg-[#000000]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <Logo size="sm" />
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-500">
          {[['Architektura','#architecture'],['Marketplace','#marketplace'],['Studio','#studio'],['Runtime','#runtime'],['Export','#export'],['Mission Control','#mission-control'],['Cennik','#pricing'],['Rejestracja','/register']].map(([label,href])=>(
            href.startsWith('#') ? (
              <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
            ) : (
              <Link key={label} href={href} className="hover:text-white transition-colors">{label}</Link>
            )
          ))}
        </div>
        <p className="text-xs text-slate-700">© {new Date().getFullYear()} SoloSpot. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  )
}

export default function SoloSpotLanding() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-violet-500/30">
      <Nav />
      <Hero />
      <FlowStepsSection />
      <StackPanel />
      <MetricsBar />
      <PlatformArchitecture />
      <MarketplaceSection />
      <StudioSection />
      <RuntimeEngineSection />
      <HTMLExportSection />
      <MissionControlSection />
      <WhySoloSpotSection />
      <IntegrationsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}

function Plus({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function AlertTriangle({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function MetricsBar() {
  const metrics = [
    { value: '4', label: 'Kategorie w Marketplace', icon: Box, color: 'text-violet-400' },
    { value: '6', label: 'Warstw platformy', icon: Layers, color: 'text-fuchsia-400' },
    { value: 'JSON', label: 'Konfiguracja deklaratywna', icon: FileCode, color: 'text-amber-400' },
    { value: '100%', label: 'Izolacja tenantów', icon: ShieldCheck, color: 'text-emerald-400' },
  ]
  return (
    <section className="mt-24 lg:mt-32 py-20 lg:py-24 border-y border-violet-500/10 bg-[#06080f]">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
            <m.icon className={`w-6 h-6 ${m.color} mx-auto mb-3`} />
            <div className="text-3xl font-black text-white mb-1">{m.value}</div>
            <div className="text-sm text-slate-500">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}




