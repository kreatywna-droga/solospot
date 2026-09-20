'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Zap, Server, Layers, ShieldCheck, ArrowRight,
  ChevronRight, Menu, X, Sparkles, Box,
  LayoutDashboard, Monitor, Code, Globe,
  Database, GitBranch, Shield,
  CreditCard, Truck,
  CheckCircle, HelpCircle,
  Star, Target, Users,
  LayoutGrid, Store, BarChart3, Settings2,
  FileCode, Download, Cloud, Cpu, Layers3,
  Circle, ArrowDown, GitMerge, HardDrive,
  Network, Terminal, Activity, Eye, Rocket,
  Package, ShoppingCart, Laptop, Globe2,
  User, Mail, LogOut, ExternalLink, Search, Play
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { supabase } from '@/lib/supabase'
import { CinematicScrollHero } from '@/components/home/CinematicScrollHero'
import { SectionProgressIndicator } from '@/components/home/SectionProgressIndicator'

function Nav() {
  const [mounted, setMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    if (!mounted) return

    supabase.auth.getSession().then((res: any) => {
      setUser(res?.data?.session?.user ?? null)
    })

    const authSub = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })
    const subscription = authSub?.data?.subscription

    return () => subscription?.unsubscribe()
  }, [mounted])

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
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#080B10]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/40'
            : 'bg-[#080B10]/60 backdrop-blur-md border-b border-white/[0.04]'
        }`}
      >
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" />
          </Link>

          {/* Centered Minimalist Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs sm:text-sm font-medium text-[#B8B1A7] hover:text-[#F5F1EA] transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right Area: Search, Auth, CTA & Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Icon Trigger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#B8B1A7] hover:text-[#F5F1EA] hover:bg-white/[0.04] transition-colors"
              title="Szukaj w SoloSpot"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Auth / Dashboard link */}
            {user ? (
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-medium text-[#F5F1EA] hover:text-[#F2C27F] px-4 py-2 transition-colors flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-full border border-white/[0.08]"
              >
                <User className="w-4 h-4 text-[#D9A86C]" /> Panel
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-[#F5F1EA] hover:text-white px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all"
              >
                Zaloguj się
              </Link>
            )}

            {/* Primary Champagne Gold CTA */}
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] font-bold text-xs sm:text-sm rounded-full shadow-md shadow-[#D9A86C]/20 hover:shadow-lg hover:shadow-[#D9A86C]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Rozpocznij</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#080B10]" />
            </Link>

            {/* Drawer Menu Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center text-[#B8B1A7] hover:text-white transition-all cursor-pointer"
              title="Menu platformy"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide Drawer Side Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 pointer-events-auto"
          />
        )}

        {drawerOpen && (
          <motion.div
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#080B10] border-l border-white/10 z-50 shadow-2xl p-6 flex flex-col justify-between pointer-events-auto text-left"
          >
            {/* Drawer Content */}
            <div className="overflow-y-auto flex-1 pr-1">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
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
                  <div className="p-5 rounded-2xl bg-[#0D1118] border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#D9A86C]/20 flex items-center justify-center text-[#F2C27F] flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-[#77736D] font-bold uppercase tracking-wider">Zalogowano jako</p>
                        <p className="text-sm font-semibold text-[#F5F1EA] truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#D9A86C]/20 text-center"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Przejdź do Panelu
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-[#B8B1A7] hover:text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Wyloguj się
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#0D1118] border border-white/10 text-center">
                    <p className="text-sm text-[#B8B1A7] mb-4">Uzyskaj dostęp do swojego panelu e-commerce</p>
                    <div className="flex gap-3">
                      <Link
                        href="/login"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-3 border border-white/10 hover:border-[#D9A86C]/40 text-[#F5F1EA] hover:bg-white/5 font-bold text-sm rounded-xl transition-all text-center"
                      >
                        Zaloguj się
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-3 bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] font-bold text-sm rounded-xl transition-all text-center shadow-md shadow-[#D9A86C]/20"
                      >
                        Zarejestruj
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="space-y-2 mb-8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#77736D] mb-3 px-3">Menu nawigacyjne</p>

                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#F5F1EA] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#D9A86C]/30 rounded-xl transition-all group"
                >
                  <User className="w-4 h-4 text-[#D9A86C] group-hover:text-[#F2C27F] transition-colors" />
                  <span>Panel użytkownika</span>
                </Link>

                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#B8B1A7] hover:text-[#F5F1EA] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-[#F2C27F]" />
                    <span>Dokumentacja platformy</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    setHelpModalOpen(true)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#B8B1A7] hover:text-[#F5F1EA] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#D9A86C]" />
                    <span>Centrum Pomocy</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30">Formularz</span>
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 px-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#77736D] mb-3">Szybki kontakt</p>
                <div className="text-xs text-[#B8B1A7] space-y-2">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#D9A86C]" />
                    <a href="mailto:kreatywna.droga@gmail.com" className="hover:text-white transition-colors">kreatywna.droga@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-white/5 bg-[#080B10] flex items-center justify-between">
              <span className="text-[10px] text-[#77736D]">© {new Date().getFullYear()} SoloSpot</span>
              <a href="mailto:kreatywna.droga@gmail.com" className="text-xs text-[#B8B1A7] hover:text-[#F2C27F] transition-colors flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Napisz do nas
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Help Center Contact Form Modal */}
      <HelpCenterModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </>
  )
}

function FlowStepsSection() {
  const flowSteps = [
    { id: 1, label: 'Marketplace', icon: Store, desc: 'Wybierz gotowy model biznesowy', color: 'from-[#D9A86C] to-[#F2C27F]' },
    { id: 2, label: 'Kup lub Zbuduj', icon: Package, desc: 'Zainstaluj szablon lub skonfiguruj od zera', color: 'from-[#F2C27F] to-[#F6D7AA]' },
    { id: 3, label: 'Studio', icon: LayoutDashboard, desc: 'Konfiguruj wizualnie: strony, sekcje, motyw, SEO', color: 'from-[#D9A86C] to-[#B8B1A7]' },
    { id: 4, label: 'Publish', icon: Rocket, desc: 'Jednym kliknięciem na platformie SoloSpot', color: 'from-[#F2C27F] to-[#D9A86C]' },
    { id: 5, label: 'Hosting', icon: Globe2, desc: 'Edge CDN, SSL, domeny — zarządzane automatycznie', color: 'from-[#F6D7AA] to-[#D9A86C]' },
    { id: 6, label: 'Export HTML', icon: FileCode, desc: 'Eksportuj statyczne pliki. Hostuj gdzie chcesz.', color: 'from-[#D9A86C] to-[#10b981]' },
  ]

  return (
    <section id="features" className="relative py-24 px-6 max-w-7xl mx-auto overflow-hidden bg-[#080B10]">
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D9A86C]/30 to-transparent -translate-y-1/2 hidden md:block" />
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
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl shadow-[#D9A86C]/10 relative z-10 hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-7 h-7 text-[#080B10]" />
              </div>
              <div className="mt-4 text-center w-full">
                <p className="font-bold text-[#F5F1EA] text-sm">{step.label}</p>
                <p className="text-[#77736D] text-xs mt-1 leading-normal">{step.desc}</p>
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
    { icon: ShieldCheck, label: 'Identyfikacja i auth', color: 'text-[#F2C27F]', desc: 'Multi-tenant auth, SSO, SAML, OIDC' },
    { icon: Server, label: 'Silnik tenantów', color: 'text-[#D9A86C]', desc: 'Provisioning, izolacja, orkiestracja zdarzeń' },
    { icon: Box, label: 'Marketplace', color: 'text-[#F6D7AA]', desc: 'Rejestr szablonów, revenue share, wersjonowanie' },
    { icon: Layers, label: 'Runtime Engine', color: 'text-[#F2C27F]', desc: 'JSON → React → HTML/Edge, zero build' },
    { icon: Zap, label: 'Silnik handlowy', color: 'text-[#D9A86C]', desc: 'Płatności, zamówienia, podatki, wysyłka, zapasy' },
    { icon: Sparkles, label: 'Mission Control', color: 'text-[#F6D7AA]', desc: 'Monitoring, deploy, audyt, zarządzanie platformą' },
  ]

  return (
    <section id="stack" className="px-6 pt-10 pb-24 lg:pb-32 bg-[#080B10]">
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-r from-[#D9A86C]/10 via-[#F2C27F]/10 to-transparent rounded-3xl blur-3xl" />
          <div className="relative bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10">
            <div className="text-xs sm:text-sm font-bold text-[#D9A86C] uppercase tracking-[0.2em] text-center mb-8">
              Stos platformy — 6 warstw
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stackLayers.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D9A86C]/30 hover:bg-white/[0.05] transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <layer.icon className={`w-4 h-4 ${layer.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#F5F1EA] block">{layer.label}</span>
                    <span className="text-xs text-[#77736D]">{layer.desc}</span>
                  </div>
                  <span className="ml-auto text-xs font-mono text-[#77736D] bg-white/5 px-2 py-1 rounded-md flex-shrink-0">L{i + 1}</span>
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
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10 hover:border-[#D9A86C]/30',
    },
    {
      title: 'Silnik handlowy',
      description: 'Pełne przetwarzanie płatności, zarządzanie zamówieniami i obliczanie podatków/wysyłki.',
      items: ['Silnik płatności', 'Przetwarzanie zamówień', 'Silnik podatkowy', 'Silnik wysyłki', 'Zapasy'],
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10 hover:border-[#D9A86C]/30',
    },
    {
      title: 'System szablonów',
      description: 'Instalowalne pakiety biznesowe. Moda, Uroda, Gastronomia, Cyfrowe — każdy z produktami i brandingiem.',
      items: ['Rejestr szablonów', 'Zasiewanie produktów', 'Silnik motywów', 'System brandingu', 'API Marketplace'],
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10 hover:border-[#D9A86C]/30',
    },
    {
      title: 'Silnik wykonawczy',
      description: 'Renderuje konfigurację sklepu w działające strony. JSON → komponenty React → HTML.',
      items: ['Resolver wykonawczy', 'Renderer sekcji', 'Środowisko sklepu', 'Tryb podglądu', 'API eksportu'],
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10 hover:border-[#D9A86C]/30',
    },
  ]
  return (
    <section id="architecture" className="pt-24 pb-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <Layers className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Architektura platformy</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Zbudowana pod skalę,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            zaprojektowana dla produktów.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          Cztery zintegrowane warstwy, które współpracują, aby tworzyć, wdrażać i zarządzać produktami cyfrowego handlu.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {tiers.map((tier, i) => (
          <div key={i} className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border ${tier.border} bg-gradient-to-br ${tier.gradient} p-8 backdrop-blur-sm transition-all`}
            >
              <h3 className="text-lg font-bold text-[#F5F1EA] mb-2">{tier.title}</h3>
              <p className="text-sm text-[#B8B1A7] mb-6">{tier.description}</p>
              <div className="flex flex-wrap gap-2">
                {tier.items.map((item) => (
                  <span key={item} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-[#F5F1EA]">
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
    { number: '03', title: 'Provisioning automatyczny', desc: 'Platforma tworzy tenant, izolowaną bazę, wstrzykuje dane, generuje klucze API. 30 sekund.', icon: Cpu },
    { number: '04', title: 'Lądujesz w Studio', desc: 'Gotowy sklep otwiera się w builderze. Wszystko skonfigurowane. Edytujesz tylko to, co chcesz.', icon: LayoutDashboard },
    { number: '05', title: 'Publikuj / Eksportuj', desc: 'Wdróż na platformie (Edge CDN, SSL, domeny) lub wyeksportuj HTML na własny hosting.', icon: Rocket },
  ]

  return (
    <section id="marketplace" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <Box className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Marketplace</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Nie kupujesz szablonu.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            Kupujesz gotowy biznes.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-xl mx-auto">
          Każdy produkt w Marketplace to kompletny pakiet: baza produktów, motyw, sekcje, konfiguracja płatności/wysyłki, SEO.
          Instalacja = provisioning tenantu w 30 sekund.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#D9A86C]/30 via-[#F2C27F]/20 to-transparent -translate-x-1/2 hidden lg:block" />
        <div className="space-y-16">
          {steps.map((step, i) => (
            <motion.div key={step.number} initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex items-start gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
              <div className={`flex-1 lg:w-1/2 ${i % 2 === 1 ? 'lg:pl-16' : 'lg:pr-16'} lg:pt-4`}>
                <div className="relative">
                  <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#D9A86C] border-4 border-[#080B10] z-10 hidden lg:block" />
                  <div className={`bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 ${i % 2 === 1 ? 'ml-12' : 'mr-12'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-black text-[#D9A86C]/60 font-mono">{step.number}</span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-[#F2C27F]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#F5F1EA] mb-2">{step.title}</h3>
                    <p className="text-[#B8B1A7]">{step.desc}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 lg:w-1/2">
                <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                  <div className="relative w-full h-full bg-[#080B10] rounded-xl border border-white/5 flex items-center justify-center">
                    {i === 0 && (
                      <div className="text-center p-8">
                        <Store className="w-16 h-16 mx-auto mb-4 text-[#77736D]" />
                        <p className="text-[#B8B1A7] text-lg">Marketplace: 4 kategorie, 12+ szablonów</p>
                        <p className="text-[#77736D] text-sm mt-2">Fashion Pro • Beauty • Restaurant • Digital</p>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="text-center p-8">
                        <CreditCard className="w-16 h-16 mx-auto mb-4 text-[#77736D]" />
                        <p className="text-[#B8B1A7] text-lg">Checkout: Stripe / 1Koszyk / Przelewy24</p>
                        <p className="text-[#77736D] text-sm mt-2">Licencja jednorazowa lub subskrypcja</p>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="text-center p-8">
                        <Cpu className="w-16 h-16 mx-auto mb-4 text-[#77736D]" />
                        <p className="text-[#B8B1A7] text-lg">Provisioning: tenant + DB + klucze API</p>
                        <p className="text-[#77736D] text-sm mt-2">~30 sekund • Zero konfiguracji ręcznej</p>
                      </div>
                    )}
                    {i === 3 && (
                      <div className="text-center p-8">
                        <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-[#77736D]" />
                        <p className="text-[#B8B1A7] text-lg">Studio: gotowy sklep do edycji</p>
                        <p className="text-[#77736D] text-sm mt-2">Strony • Sekcje • Motyw • Produkty • SEO</p>
                      </div>
                    )}
                    {i === 4 && (
                      <div className="text-center p-8">
                        <div className="flex gap-4 justify-center">
                          <div className="p-4 bg-[#D9A86C]/20 rounded-xl">
                            <Rocket className="w-8 h-8 text-[#F2C27F]" />
                          </div>
                          <div className="p-4 bg-emerald-500/20 rounded-xl">
                            <FileCode className="w-8 h-8 text-emerald-400" />
                          </div>
                        </div>
                        <p className="text-[#B8B1A7] text-lg mt-4">Publish na platformie LUB Export HTML</p>
                        <p className="text-[#77736D] text-sm mt-2">Edge CDN • SSL • Domeny • Dowolny hosting</p>
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D9A86C]/30 rounded-full text-sm font-medium text-[#F5F1EA] transition-all">
          Przeglądaj Marketplace <ArrowRight className="w-4 h-4 text-[#D9A86C]" />
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
    <section id="studio" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <LayoutDashboard className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Studio Builder</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Konfigurujesz w <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">Studio.</span>
          <br />Publikujesz w sekundy.
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          Wizualny builder dla Commerce OS. Zero kodu. Deklaratywna konfiguracja JSON.
          Każda zmiana natychmiast widoczna w Live Preview.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        <div className="space-y-6">
          <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-[#F5F1EA] mb-4">Workflow</h3>
            <div className="space-y-4">
              {workflowSteps.map((step, i) => (
                <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#D9A86C]/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#D9A86C]/20 border border-[#D9A86C]/30 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-[#F2C27F]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F5F1EA]">{step.label}</p>
                    <p className="text-xs text-[#77736D]">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-[#F5F1EA] mb-4">Zakładki Studio</h3>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab, i) => (
                <span key={tab} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  i === 0 ? 'bg-[#D9A86C]/20 text-[#F2C27F] border border-[#D9A86C]/30' : 'text-[#77736D] hover:text-[#F5F1EA] hover:bg-white/5'
                }`}>
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#080B10]/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 text-center text-xs text-[#77736D] font-mono">studio.solospot.local</div>
              <div className="w-24 h-6 bg-emerald-500/20 rounded border border-emerald-500/30 flex items-center justify-center">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live
                </span>
              </div>
            </div>
            <div className="p-8 h-[500px] flex items-center justify-center">
              <div className="w-full max-w-2xl mx-auto">
                <div className="bg-[#080B10] rounded-2xl border border-white/5 p-8 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                  <div className="text-center z-10">
                    <Monitor className="w-20 h-20 mx-auto mb-4 text-[#77736D]" />
                    <p className="text-[#B8B1A7] text-lg">Live Preview — rzeczywisty sklep</p>
                    <p className="text-[#77736D] text-sm mt-2">Wybierz sekcję z lewego panelu w Studio</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#D9A86C]/5 to-transparent" />
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
    { stage: 'INPUT', label: 'Konfiguracja JSON', desc: 'Strony, sekcje, motyw, produkty, SEO, płatności, wysyłka', icon: FileCode, color: 'text-[#F2C27F]', bg: 'from-white/[0.04] to-white/[0.01]' },
    { stage: 'RESOLVE', label: 'Resolver wykonawczy', desc: 'Rozwiązuje zależności, ładuje szablony, wstrzykuje dane tenantów', icon: GitMerge, color: 'text-[#D9A86C]', bg: 'from-white/[0.04] to-white/[0.01]' },
    { stage: 'RENDER', label: 'Renderer sekcji', desc: 'Mapuje typy na komponenty React, SSR + CSR hydration', icon: LayoutGrid, color: 'text-[#F6D7AA]', bg: 'from-white/[0.04] to-white/[0.01]' },
    { stage: 'RUNTIME', label: 'Środowisko sklepu', desc: 'Koszyk, checkout, konto, płatności — gotowe moduły biznesowe', icon: Store, color: 'text-[#F2C27F]', bg: 'from-white/[0.04] to-white/[0.01]' },
    { stage: 'EXPORT', label: 'Eksport HTML/Static', desc: 'Generuje statyczne pliki + assets do CDN/Edge', icon: FileCode, color: 'text-emerald-400', bg: 'from-white/[0.04] to-white/[0.01]' },
    { stage: 'EDGE', label: 'Runtime Edge', desc: 'Vercel Edge, Cloudflare Workers, V8 Isolates', icon: Cloud, color: 'text-[#D9A86C]', bg: 'from-white/[0.04] to-white/[0.01]' },
  ]

  const techSpecs = [
    { label: 'Zero build time', value: 'Konfiguracja w runtime' },
    { label: 'Cold start', value: '< 50ms na Edge' },
    { label: 'Bundle size', value: '~45KB gzipped' },
    { label: 'Multi-tenant', value: '∞ tenantów / DB' },
    { label: 'Schema', value: 'JSON Schema + TS' },
    { label: 'Extensibility', value: 'Custom components' },
  ]

  return (
    <section id="runtime" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <Cpu className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Runtime Engine</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Silnik wykonawczy:<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            JSON → Sklep na żywo.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          Zero buildów. Zero deployów. Konfiguracja JSON jest interpretowana w czasie rzeczywistym.
          Sklep działa natychmiast po zapisie. To nie generator stron — to runtime engine.
        </p>
      </div>

      <div className="relative mb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {pipeline.map((step, i) => (
            <motion.div key={step.stage} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="relative">
              <div className={`relative bg-gradient-to-br ${step.bg} border border-white/10 hover:border-[#D9A86C]/30 rounded-2xl p-6 h-full flex flex-col transition-all`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black text-[#77736D] uppercase tracking-wider">{step.stage}</span>
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#F5F1EA] mb-2">{step.label}</h3>
                <p className="text-sm text-[#B8B1A7] flex-1">{step.desc}</p>
                {i < pipeline.length - 1 && (
                  <div className="absolute right-0 top-1/2 w-4 h-4 -translate-y-1/2 translate-x-1/2 hidden lg:block">
                    <ArrowRight className="w-4 h-4 text-[#D9A86C]/40" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-12">
        <h3 className="text-lg font-bold text-[#F5F1EA] mb-8 text-center">Specyfikacja techniczna</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {techSpecs.map((spec, i) => (
            <motion.div key={spec.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <p className="text-2xl font-black text-[#F2C27F] mb-1">{spec.value}</p>
              <p className="text-xs text-[#77736D] uppercase tracking-wider">{spec.label}</p>
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
    { icon: Zap, title: 'Hydration opcjonalny', desc: 'Dodaj interaktywność (koszyk, filtry) przez lekki layer — lub zostaw czysty HTML.' },
    { icon: Shield, title: 'Bezpieczeństwo by design', desc: 'Brak backendu = brak powierzchni ataku. Płatności w iframe/checkout providera.' },
    { icon: HardDrive, title: 'Wersjonowanie i rollback', desc: 'Każdy eksport to wersja. Powrót do dowolnej wersji jednym kliknięciem.' },
    { icon: Terminal, title: 'CLI / CI/CD Native', desc: 'solospot export --store fashion-pro --output ./dist --cdn cloudflare. Gotowe do pipeline.' },
  ]

  const comparison = [
    { feature: 'Hosting', traditional: 'Vendor lock-in (Shopify, Wix)', soloSpot: 'Dowolny: Vercel, Netlify, CF Pages, AWS, VPS, on-premise' },
    { feature: 'Backend', traditional: 'Wymagany, zarządzany przez vendor', soloSpot: 'Opcjonalny (hydration) / Brak (static)' },
    { feature: 'Skalowanie', traditional: 'Limity planu, upgrade kosztowny', soloSpot: 'Edge CDN skaluje automatycznie, zero kosztów' },
    { feature: 'Własność danych', traditional: 'Zamknięte API, eksport ograniczony', soloSpot: 'Pełna własność plików, bazy, kodu' },
    { feature: 'Koszt', traditional: '% od obrotu + abonament', soloSpot: 'Stały abonament za platformę, 0% od transakcji' },
    { feature: 'Compliance', traditional: 'Dane u vendor', soloSpot: 'Dane u Ciebie (GDPR, PCI DSS friendly)' },
  ]

  return (
    <section id="export" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <Download className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">HTML Export</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Eksportuj na<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            dowolny hosting.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          To nie jest feature. To produkt. SoloSpot nie zamyka Cię w vendor lock-in.
          Eksportuj sklep jako statyczne pliki i hostuj gdzie chcesz. Pełna suwerenność.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#D9A86C]/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-[#D9A86C]/20 group-hover:border-[#D9A86C]/30 transition-all">
              <f.icon className="w-6 h-6 text-[#F2C27F]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F1EA] mb-2">{f.title}</h3>
            <p className="text-sm text-[#B8B1A7]">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#0D1118]/90 border border-white/10 rounded-2xl p-8 lg:p-12 mb-16">
        <h3 className="text-2xl font-bold text-[#F5F1EA] mb-8 text-center">Porównanie: SaaS vs SoloSpot Export</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-xs font-bold text-[#77736D] uppercase tracking-wider">Cecha</th>
                <th className="px-6 py-3 text-xs font-bold text-[#77736D] uppercase tracking-wider">Tradycyjny SaaS</th>
                <th className="px-6 py-3 text-xs font-bold text-[#D9A86C] uppercase tracking-wider">SoloSpot Export</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c, i) => (
                <tr key={c.feature} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="px-6 py-4 font-medium text-[#F5F1EA]">{c.feature}</td>
                  <td className="px-6 py-4 text-[#77736D]">{c.traditional}</td>
                  <td className="px-6 py-4 text-[#F2C27F] font-medium">{c.soloSpot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-[#0D1118] rounded-2xl p-8 max-w-2xl mx-auto border border-white/10">
          <div className="flex items-center gap-3 justify-center mb-4">
            <Terminal className="w-6 h-6 text-[#D9A86C]" />
            <span className="text-lg font-bold text-[#F5F1EA]">Przykład komendy eksportu</span>
          </div>
          <div className="bg-[#080B10] rounded-xl p-4 font-mono text-sm text-[#F2C27F] text-left overflow-x-auto">
            <span className="text-[#77736D]">$ </span><span className="text-white">solospot export</span> <span className="text-[#D9A86C]">--store</span> <span className="text-[#F6D7AA]">fashion-pro</span> <span className="text-[#D9A86C]">--output</span> <span className="text-[#F6D7AA]">./dist</span> <span className="text-[#D9A86C]">--cdn</span> <span className="text-[#F6D7AA]">cloudflare</span> <span className="text-[#D9A86C]">--hydrate</span> <span className="text-[#F6D7AA]">cart,filters</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function MissionControlSection() {
  const [realTenants, setRealTenants] = useState<any[]>([])
  const [realEvents, setRealEvents] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, eRes] = await Promise.all([
          fetch('/api/mission-control/tenants'),
          fetch('/api/mission-control/events'),
        ])
        const tData = await tRes.json()
        const eData = await eRes.json()
        if (tData?.tenants) setRealTenants(tData.tenants)
        if (eData?.events) setRealEvents(eData.events)
      } catch {
        // Fallback handled safely
      }
    }
    loadData()
  }, [])

  const defaultTenants = [
    { name: 'Fashion Store Pro', domain: 'fashion.solospot.pl', plan: 'Pro', status: 'active', revenue: '12.4k PLN', health: 98, lastDeploy: '2h temu' },
    { name: 'Beauty Lab', domain: 'beauty.solospot.pl', plan: 'Business', status: 'active', revenue: '8.7k PLN', health: 100, lastDeploy: '1d temu' },
    { name: 'Restaurant Hub', domain: 'food.solospot.pl', plan: 'Enterprise', status: 'active', revenue: '45.2k PLN', health: 99, lastDeploy: '4h temu' },
    { name: 'Digital Goods', domain: 'digital.solospot.pl', plan: 'Starter', status: 'trial', revenue: '1.2k PLN', health: 87, lastDeploy: '6h temu' },
  ]

  const tenantsList = realTenants.length > 0
    ? realTenants.map(t => ({
        name: t.store?.name || t.id,
        domain: t.store?.domain || `${t.store?.slug || 'sklep'}.solospot.pl`,
        plan: (t.packageId || 'Pro').toUpperCase(),
        status: t.status === 'ACTIVE' ? 'active' : 'trial',
        revenue: `${((t.revenue || 0) / 100).toFixed(1)}k PLN`,
        health: t.health || 99,
        lastDeploy: t.lastEvent ? new Date(t.lastEvent.timestamp).toLocaleTimeString('pl-PL') : '1h temu',
      }))
    : defaultTenants

  const eventsList = realEvents.length > 0
    ? realEvents.slice(0, 6).map(e => ({
        time: new Date(e.timestamp).toLocaleTimeString('pl-PL'),
        type: e.eventType?.includes('deploy') ? 'deploy' : e.eventType?.includes('provision') ? 'provision' : 'export',
        message: `${e.tenantId} — ${e.eventType}`,
        status: 'success',
      }))
    : [
        { time: '2 min temu', type: 'deploy', message: 'fashion-pro — deployment complete (Edge CDN)', status: 'success' },
        { time: '5 min temu', type: 'provision', message: 'New tenant: beauty-lab-pro — provisioned in 26s', status: 'success' },
        { time: '12 min temu', type: 'export', message: 'restaurant-hub — HTML export completed', status: 'success' },
        { time: '18 min temu', type: 'alert', message: 'Payment webhook latency check — auto-recovered', status: 'warning' },
        { time: '35 min temu', type: 'scale', message: 'Edge nodes scaled automatically', status: 'info' },
      ]

  const metrics = [
    { label: 'Aktywni najemcy', value: realTenants.length > 0 ? String(realTenants.length) : '1,247', change: '+12%', icon: Users, color: 'text-[#F2C27F]', trend: 'up' },
    { label: 'Zamówienia / 24h', value: '3,891', change: '+8%', icon: ShoppingCart, color: 'text-emerald-400', trend: 'up' },
    { label: 'Przychód platformy', value: '284k PLN', change: '+23%', icon: CreditCard, color: 'text-[#D9A86C]', trend: 'up' },
    { label: 'Uptime', value: '99.99%', change: '0%', icon: Shield, color: 'text-[#F6D7AA]', trend: 'neutral' },
    { label: 'Eksporty / tydzień', value: '89', change: '+34%', icon: Download, color: 'text-emerald-400', trend: 'up' },
    { label: 'Provisioning time', value: '28s', change: '-15%', icon: Cpu, color: 'text-[#D9A86C]', trend: 'up' },
  ]

  return (
    <section id="mission-control" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <BarChart3 className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Mission Control</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Centrum dowodzenia<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            platformy.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          Pełna obserwowalność: tenantów, provisioningu, deployów, eksportów, płatności, zdarzeń, logów audytu.
          Zarządzasz platformą z jednego miejsca.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <span className="text-xs text-[#77736D]">{m.label}</span>
            </div>
            <div className="text-2xl font-black text-[#F5F1EA]">{m.value}</div>
            <div className={`text-xs font-medium mt-1 ${m.trend === 'up' ? 'text-emerald-400' : m.trend === 'down' ? 'text-red-400' : 'text-[#77736D]'}`}>
              {m.change} vs tydzień temu
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#F5F1EA]">Dzierżawy na platformie</h3>
            <Link href="/mission-control/tenants" className="text-sm text-[#D9A86C] hover:text-[#F2C27F] font-medium">Zarządzaj wszystkimi</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {['Sklep', 'Domena', 'Plan', 'Status', 'Health', 'Przychód / msc', 'Ostatni deploy'].map(h => (
                    <th key={h} className="px-6 py-3 text-xs font-bold text-[#77736D] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenantsList.map((t) => (
                  <tr key={t.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#F5F1EA]">{t.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#B8B1A7] font-mono">{t.domain}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30">{t.plan}</span>
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
                          <div className={`h-full bg-gradient-to-r from-[#D9A86C] to-emerald-400 transition-all`} style={{ width: `${t.health}%` }} />
                        </div>
                        <span className="text-xs font-mono text-[#77736D] w-10">{t.health}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[#F5F1EA]">{t.revenue}</td>
                    <td className="px-6 py-4 text-xs text-[#77736D] font-mono">{t.lastDeploy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F5F1EA]">Strumień zdarzeń platformy</h3>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {eventsList.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#D9A86C]/30 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#D9A86C]/10 border border-[#D9A86C]/20">
                    {e.type === 'deploy' && <Rocket className="w-4 h-4 text-[#F2C27F]" />}
                    {e.type === 'provision' && <Package className="w-4 h-4 text-[#D9A86C]" />}
                    {e.type === 'export' && <Download className="w-4 h-4 text-emerald-400" />}
                    {e.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {e.type === 'scale' && <Activity className="w-4 h-4 text-[#F6D7AA]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F5F1EA]">{e.message}</p>
                    <p className="text-xs text-[#77736D] font-mono">{e.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[#F5F1EA] mb-4">Status platformy</h3>
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
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#F5F1EA]">{s.label}</span>
                    <span className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                  <div className="text-xs text-[#77736D] mt-1">{s.latency} p95</div>
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
    <section id="why" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <Target className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Dlaczego SoloSpot</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Nie budujemy sklepów.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            Budujemy system operacyjny dla e-commerce.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          SoloSpot to infrastruktura klasy Enterprise dla produktów e-commerce. Wielodostępna, rozszerzalna, bez vendor lock-in.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group relative p-6 bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-[#D9A86C]/30 transition-all">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-[#D9A86C]/20 group-hover:border-[#D9A86C]/30 transition-all">
                <p.icon className="w-6 h-6 text-[#F2C27F]" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F1EA] mb-2">{p.title}</h3>
              <p className="text-sm text-[#B8B1A7] mb-4">{p.desc}</p>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-[#F2C27F] inline-block">
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
    { name: 'Płatności', icon: CreditCard, items: ['Stripe', '1Koszyk', 'Przelewy24', 'PayPal', 'Apple Pay', 'Google Pay'], color: 'from-[#D9A86C] to-[#F2C27F]' },
    { name: 'Wysyłka i logistyka', icon: Truck, items: ['InPost', 'DPD', 'DHL', 'Poczta Polska', 'FedEx', 'UPS'], color: 'from-[#F2C27F] to-[#F6D7AA]' },
    { name: 'ERP i magazyn', icon: Database, items: ['Subiekt GT', 'Enova', 'Comarch', 'SAP Business One', 'Microsoft Dynamics', 'BaseLinker'], color: 'from-[#D9A86C] to-[#B8B1A7]' },
    { name: 'Marketing i analityka', icon: BarChart3, items: ['Google Analytics 4', 'Meta Pixel', 'TikTok Pixel', 'Klaviyo', 'Mailchimp', 'PostHog'], color: 'from-[#F6D7AA] to-[#D9A86C]' },
    { name: 'Rozwój i CI/CD', icon: GitBranch, items: ['GitHub Actions', 'GitLab CI', 'Vercel', 'Netlify', 'Cloudflare Pages', 'Docker'], color: 'from-[#F2C27F] to-[#D9A86C]' },
    { name: 'Tożsamość i bezpieczeństwo', icon: Shield, items: ['Auth0', 'Clerk', 'Supabase Auth', 'NextAuth', 'OAuth 2.0 / OIDC', 'SAML/SSO'], color: 'from-[#D9A86C] to-[#F2C27F]' },
  ]

  return (
    <section id="integrations" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <GitBranch className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Ekosystem integracji</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Połączony z Twoim<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            ekosystemem.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          SoloSpot nie zastępuje Twoich narzędzi — integruje się z nimi. Płatności, wysyłka, ERP, marketing, CI/CD, tożsamość.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#D9A86C]/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <cat.icon className="w-5 h-5 text-[#080B10]" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F1EA]">{cat.name}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <span key={item} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#B8B1A7] hover:border-[#D9A86C]/40 hover:text-white transition-all">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <div className="bg-[#0D1118] border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-[#F5F1EA] mb-2">Brakuje Ci integracji?</h3>
          <p className="text-[#B8B1A7] mb-6">Mamy otwarte API i webhook system. Zbuduj własną integrację lub daj nam znać — dodamy ją do roadmapy.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D9A86C]/30 rounded-full text-sm font-medium text-[#F5F1EA] transition-all">
            Dokumentacja API <ArrowRight className="w-4 h-4 text-[#D9A86C]" />
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
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10',
      buttonGradient: 'bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F1EA]',
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
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-[#D9A86C]/50 ring-1 ring-[#D9A86C]/30',
      buttonGradient: 'bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] shadow-lg shadow-[#D9A86C]/20',
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
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10',
      buttonGradient: 'bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F1EA]',
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
      gradient: 'from-[#0D1118] to-[#141820]',
      border: 'border-white/10',
      buttonGradient: 'bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F1EA]',
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6 max-w-7xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <Star className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Cennik platformy</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Płacisz za platformę,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            nie za liczbę produktów.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7] max-w-2xl mx-auto">
          Wszystkie plany zawierają dostęp do Marketplace, Studio, Runtime Engine, HTML Export.
          Różnią się skalą: liczba tenantów, wsparcie, SLA, możliwości Enterprise.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, i) => (
          <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`relative rounded-3xl p-8 bg-gradient-to-br ${tier.gradient} border ${tier.border} flex flex-col ${tier.popular ? 'scale-105 z-10' : ''}`}>
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] text-xs font-bold rounded-full shadow-md">
                Najpopularniejszy
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#F5F1EA]">{tier.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[#F2C27F]">{tier.subtitle}</span>
              </div>
              <p className="text-sm text-[#77736D]">{tier.description}</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#F5F1EA]">{tier.price}</span>
                <span className="text-[#77736D]">{tier.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {tier.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-[#B8B1A7]">
                  <CheckCircle className="w-5 h-5 text-[#D9A86C] flex-shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className={`group flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${tier.buttonGradient}`}>
              {tier.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <p className="text-[#77736D] mb-4">Wszystkie ceny netto. Faktura VAT 23%. Anuluj w dowolnej chwili. Bez ukrytych opłat.</p>
        <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D9A86C]/30 rounded-full text-sm font-medium text-[#F5F1EA] transition-all">
          Szczegółowe porównanie planów <ArrowRight className="w-4 h-4 text-[#D9A86C]" />
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
    <section id="faq" className="py-32 px-6 max-w-4xl mx-auto bg-[#080B10]">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-6">
          <HelpCircle className="w-4 h-4 text-[#D9A86C]" />
          <span className="text-xs font-bold tracking-[0.2em] text-[#D9A86C] uppercase">FAQ</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 tracking-tight">
          Pytania o platformę?<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
            Mamy odpowiedzi.
          </span>
        </h2>
        <p className="text-xl text-[#B8B1A7]">
          Nie znalazłeś odpowiedzi? <Link href="/contact" className="text-[#F2C27F] hover:text-[#F6D7AA] underline">Napisz do nas</Link>
        </p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="bg-[#0D1118]/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left"
              aria-expanded={openIndex === i}
            >
              <span className="text-lg font-medium text-[#F5F1EA] pr-10">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#77736D]"
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
                <p className="text-[#B8B1A7] leading-relaxed">{faq.a}</p>
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
    <section id="cta" className="py-32 px-6 bg-[#080B10]">
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#D9A86C]/20 via-[#F2C27F]/20 to-transparent rounded-3xl blur-xl" />
        <div className="relative bg-[#0D1118] border border-white/10 rounded-3xl p-16 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-r from-[#D9A86C]/15 to-[#F2C27F]/15 blur-[60px]" />
          <h2 className="text-4xl md:text-5xl font-bold text-[#F5F1EA] mb-6 relative z-10">
            Gotowy wdrożyć<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              Commerce Operating System?
            </span>
          </h2>
          <p className="text-xl text-[#B8B1A7] mb-10 relative z-10 max-w-lg mx-auto">
            Stwórz sklep w minutach. Wdróż natychmiast. Skaluj bez ograniczeń. Eksportuj gdzie chcesz.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/register" className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] font-bold rounded-full shadow-xl shadow-[#D9A86C]/25 hover:shadow-2xl hover:shadow-[#D9A86C]/40 transition-all hover:scale-105">
              Zbuduj swój system <ArrowRight className="w-5 h-5 text-[#080B10] group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-[#D9A86C]/30 text-[#F5F1EA] hover:bg-white/5 font-medium rounded-full transition-all">
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
    <footer className="border-t border-white/[0.08] py-12 px-6 bg-[#080B10]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <Logo size="sm" />
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-[#77736D]">
          {[['Architektura','#architecture'],['Marketplace','#marketplace'],['Studio','#studio'],['Runtime','#runtime'],['Export','#export'],['Mission Control','#mission-control'],['Cennik','#pricing'],['Rejestracja','/register']].map(([label,href])=>(
            href.startsWith('#') ? (
              <a key={label} href={href} className="hover:text-[#F5F1EA] transition-colors">{label}</a>
            ) : (
              <Link key={label} href={href} className="hover:text-[#F5F1EA] transition-colors">{label}</Link>
            )
          ))}
        </div>
        <p className="text-xs text-[#77736D]">© {new Date().getFullYear()} SoloSpot. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  )
}

export default function SoloSpotLanding() {
  return (
    <div className="min-h-screen bg-[#080B10] text-[#F5F1EA] selection:bg-[#D9A86C]/30">
      <Nav />
      <SectionProgressIndicator />
      <CinematicScrollHero />
      <FlowStepsSection />
      <StackPanel />
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

function HelpCenterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
        setName('')
        setEmail('')
        setSubject('')
        setMessage('')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Wystąpił błąd podczas wysyłania.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Błąd połączenia z serwerem.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0D1118] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D9A86C] to-[#F2C27F] flex items-center justify-center text-[#080B10] shadow-lg shadow-[#D9A86C]/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F5F1EA]">Centrum Pomocy</h3>
              <p className="text-xs text-[#77736D]">Ściana Formularza Kontaktowego</p>
            </div>
          </div>

          <p className="text-xs text-[#F2C27F] bg-[#D9A86C]/10 border border-[#D9A86C]/20 rounded-xl p-3 my-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#D9A86C] flex-shrink-0" />
            <span>Wszystkie pytania trafiają bezpośrednio do zespołu na adres: <strong className="text-white font-mono">kreatywna.droga@gmail.com</strong></span>
          </p>

          {status === 'success' ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Wiadomość została wysłana!</h4>
              <p className="text-sm text-slate-300">
                Dziękujemy za kontakt. Twoje zgłoszenie zostało przekazane na skrzynkę <strong className="text-emerald-400">kreatywna.droga@gmail.com</strong>. Odpowiemy najszybciej jak to możliwe.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-all"
              >
                Wyślij kolejne zgłoszenie
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#B8B1A7] uppercase tracking-wider mb-1.5">Imię i nazwisko</label>
                <input
                  type="text"
                  required
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#080B10] border border-white/10 focus:border-[#D9A86C] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#77736D] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B8B1A7] uppercase tracking-wider mb-1.5">Twój adres e-mail</label>
                <input
                  type="email"
                  required
                  placeholder="jan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080B10] border border-white/10 focus:border-[#D9A86C] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#77736D] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B8B1A7] uppercase tracking-wider mb-1.5">Temat zapytania</label>
                <input
                  type="text"
                  required
                  placeholder="Wdrożenie platformy / Pomoc techniczna"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#080B10] border border-white/10 focus:border-[#D9A86C] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#77736D] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B8B1A7] uppercase tracking-wider mb-1.5">Treść wiadomości</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Opisz swoje pytanie lub problem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#080B10] border border-white/10 focus:border-[#D9A86C] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#77736D] outline-none transition-all resize-none"
                />
              </div>

              {status === 'error' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-3.5 bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#D9A86C]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {status === 'submitting' ? (
                  <span>Wysyłanie do Centrum Pomocy...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-[#080B10]" />
                    <span>Wyślij wiadomość do kreatywna.droga@gmail.com</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
