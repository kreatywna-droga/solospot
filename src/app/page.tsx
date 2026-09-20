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
        <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <Logo size="md" />

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
    <section id="features" className="relative py-20 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D9A86C] block mb-2">
            PROSTY PROCES
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Jak to działa<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              w SoloSpot.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {flowSteps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex flex-col p-4 rounded-2xl bg-[#0D1118]/85 border border-white/10 backdrop-blur-md hover:border-[#D9A86C]/30 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md shadow-[#D9A86C]/10 mb-3 group-hover:scale-105 transition-transform`}>
                <step.icon className="w-5 h-5 text-[#080B10]" />
              </div>
              <p className="font-bold text-[#F5F1EA] text-xs sm:text-sm">{step.label}</p>
              <p className="text-[#77736D] text-[11px] mt-1 leading-snug">{step.desc}</p>
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
    { icon: Sparkles, label: 'Mission Control', color: 'text-[#F6D7AA]', desc: 'Monitoring, deploy, audyt, platforma' },
  ]

  return (
    <section id="stack" className="relative py-20 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D9A86C] block mb-2">
            WARSTWY ARCHITEKTURY
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Stos platformy.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              6 warstw technologii.
            </span>
          </h2>
        </div>
        <div className="relative bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stackLayers.map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#D9A86C]/30 hover:bg-white/[0.05] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <layer.icon className={`w-3.5 h-3.5 ${layer.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[#F5F1EA] block">{layer.label}</span>
                  <span className="text-[11px] text-[#77736D] leading-tight block">{layer.desc}</span>
                </div>
                <span className="text-[10px] font-mono text-[#77736D] bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">L{i + 1}</span>
              </motion.div>
            ))}
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
    <section id="architecture" className="relative py-20 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <Layers className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Architektura platformy</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Zbudowana pod skalę,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              zaprojektowana dla produktów.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Cztery zintegrowane warstwy, które współpracują, aby tworzyć, wdrażać i zarządzać produktami cyfrowego handlu.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl border ${tier.border} bg-[#0D1118]/85 p-5 backdrop-blur-md transition-all`}
            >
              <h3 className="text-sm sm:text-base font-bold text-[#F5F1EA] mb-1.5">{tier.title}</h3>
              <p className="text-xs text-[#B8B1A7] mb-4 leading-relaxed">{tier.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {tier.items.map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-[#F5F1EA]">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MarketplaceSection() {
  const steps = [
    { number: '01', title: 'Przeglądaj Marketplace', desc: '4 kategorie: Moda, Uroda, Gastronomia, Cyfrowe. Każdy szablon to gotowy biznes: produkty, motyw, sekcje, SEO.', icon: Store, tag: '12+ szablonów' },
    { number: '02', title: 'Kup licencję', desc: 'Jednorazowa opłata (199–399 PLN) lub subskrypcja. Natychmiastowy dostęp do pakietu JSON + assets.', icon: CreditCard, tag: 'Stripe / P24 / 1Koszyk' },
    { number: '03', title: 'Provisioning automatyczny', desc: 'Platforma tworzy tenant, izolowaną bazę, wstrzykuje dane, generuje klucze API. 30 sekund.', icon: Cpu, tag: '~30 sekund' },
    { number: '04', title: 'Lądujesz w Studio', desc: 'Gotowy sklep otwiera się w builderze. Wszystko skonfigurowane. Edytujesz tylko to, co chcesz.', icon: LayoutDashboard, tag: 'Zero kodu' },
    { number: '05', title: 'Publikuj / Eksportuj', desc: 'Wdróż na platformie (Edge CDN, SSL, domeny) lub wyeksportuj HTML na własny hosting.', icon: Rocket, tag: 'Edge CDN / Export' },
  ]

  return (
    <section id="marketplace" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <Box className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Marketplace</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Nie kupujesz szablonu.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              Kupujesz gotowy biznes.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Każdy produkt w Marketplace to kompletny pakiet: baza produktów, motyw, sekcje, konfiguracja płatności i wysyłki, SEO. Instalacja to provisioning tenantu w 30 sekund.
          </p>
        </div>

        <div className="space-y-3.5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 hover:border-[#D9A86C]/30 rounded-2xl p-5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-[#D9A86C]/40 transition-colors">
                  <step.icon className="w-5 h-5 text-[#F2C27F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#F5F1EA] flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#D9A86C]">{step.number}</span>
                      {step.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#D9A86C] flex-shrink-0">
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#B8B1A7] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard/templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D9A86C]/30 rounded-full text-xs sm:text-sm font-medium text-[#F5F1EA] transition-all"
          >
            <span>Przeglądaj Marketplace</span>
            <ArrowRight className="w-4 h-4 text-[#D9A86C]" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function StudioSection() {
  const workflowSteps = [
    { id: 1, label: 'Nowy sklep', desc: 'Z Marketplace lub czysty tenant', icon: Plus },
    { id: 2, label: 'Wybór Template', desc: 'Fashion Pro, Beauty, Restaurant, Digital', icon: Package },
    { id: 3, label: 'Edycja w Studio', desc: 'Strony • Sekcje • Motyw • Produkty • SEO', icon: LayoutDashboard },
    { id: 4, label: 'Live Preview', desc: 'Podgląd w czasie rzeczywistym', icon: Eye },
    { id: 5, label: 'Publikacja', desc: 'Edge deploy + SSL + domena w sekundach', icon: Rocket },
  ]

  const tabs = ['Strony', 'Sekcje', 'Motyw', 'Produkty', 'SEO', 'Publikuj']

  return (
    <section id="studio" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <LayoutDashboard className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Studio Builder</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Konfigurujesz w <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">Studio.</span>
            <br />Publikujesz w sekundy.
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Wizualny builder dla Commerce OS. Zero kodu. Deklaratywna konfiguracja JSON. Każda zmiana jest natychmiast widoczna w podglądzie Live Preview.
          </p>
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-[11px] text-[#77736D] font-mono ml-2">studio.solospot.local</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="w-2.5 h-2.5" /> LIVE
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  i === 0
                    ? 'bg-[#D9A86C]/20 text-[#F2C27F] border border-[#D9A86C]/30'
                    : 'text-[#77736D] bg-white/[0.02] border border-white/[0.06]'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#D9A86C]/30 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[#D9A86C]/15 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-3.5 h-3.5 text-[#F2C27F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[#F5F1EA] block">{step.label}</span>
                  <span className="text-[11px] text-[#77736D] block truncate">{step.desc}</span>
                </div>
                <span className="text-[10px] font-mono text-[#77736D]">0{i + 1}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RuntimeEngineSection() {
  const pipeline = [
    { stage: 'INPUT', label: 'Konfiguracja JSON', desc: 'Strony, sekcje, motyw, produkty, SEO', icon: FileCode, color: 'text-[#F2C27F]' },
    { stage: 'RESOLVE', label: 'Resolver wykonawczy', desc: 'Rozwiązuje zależności, ładuje szablony, wstrzykuje dane', icon: GitMerge, color: 'text-[#D9A86C]' },
    { stage: 'RENDER', label: 'Renderer sekcji', desc: 'Mapuje typy na komponenty React, SSR + CSR hydration', icon: LayoutGrid, color: 'text-[#F6D7AA]' },
    { stage: 'RUNTIME', label: 'Środowisko sklepu', desc: 'Koszyk, checkout, konto, płatności', icon: Store, color: 'text-[#F2C27F]' },
    { stage: 'EXPORT', label: 'Eksport HTML/Static', desc: 'Generuje statyczne pliki + assets do CDN/Edge', icon: FileCode, color: 'text-emerald-400' },
    { stage: 'EDGE', label: 'Runtime Edge', desc: 'Vercel Edge, Cloudflare Workers, V8 Isolates', icon: Cloud, color: 'text-[#D9A86C]' },
  ]

  const techSpecs = [
    { label: 'Zero build time', value: 'W runtime' },
    { label: 'Cold start', value: '< 50ms' },
    { label: 'Bundle size', value: '~45KB' },
    { label: 'Multi-tenant', value: '∞ / DB' },
    { label: 'Schema', value: 'TS + JSON' },
    { label: 'Extensibility', value: 'Custom' },
  ]

  return (
    <section id="runtime" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <Cpu className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Runtime Engine</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Silnik wykonawczy:<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              JSON → Sklep na żywo.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Zero buildów. Zero deployów. Konfiguracja JSON jest interpretowana w czasie rzeczywistym. Sklep działa natychmiast po zapisie.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {pipeline.map((step, i) => (
            <motion.div
              key={step.stage}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 hover:border-[#D9A86C]/30 rounded-2xl p-4 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#77736D] uppercase tracking-wider">{step.stage}</span>
                <step.icon className={`w-4 h-4 ${step.color}`} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F1EA] mb-1">{step.label}</h3>
              <p className="text-[11px] text-[#77736D] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-[#D9A86C] uppercase tracking-[0.2em] mb-4">Specyfikacja techniczna</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {techSpecs.map((spec) => (
              <div key={spec.label} className="p-2.5 bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-base sm:text-lg font-black text-[#F2C27F]">{spec.value}</p>
                <p className="text-[10px] text-[#77736D] uppercase tracking-wider mt-0.5">{spec.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HTMLExportSection() {
  const features = [
    { icon: FileCode, title: 'Statyczny HTML/CSS/JS', desc: 'Czyste pliki — bez Node.js, bez bazy, bez kontenerów. Działają wszędzie.' },
    { icon: Globe, title: 'Edge/CDN Ready', desc: 'Optymalizowane pod cache: TTFB < 50ms globalnie. Vercel, Netlify, Cloudflare, AWS.' },
    { icon: Zap, title: 'Hydration opcjonalny', desc: 'Dodaj interaktywność (koszyk, filtry) przez lekki layer — lub zostaw czysty HTML.' },
    { icon: Shield, title: 'Bezpieczeństwo by design', desc: 'Brak backendu = brak powierzchni ataku. Płatności w bezpiecznym iframe.' },
    { icon: HardDrive, title: 'Wersjonowanie i rollback', desc: 'Każdy eksport to wersja. Powrót do dowolnej wersji jednym kliknięciem.' },
    { icon: Terminal, title: 'CLI / CI/CD Native', desc: 'solospot export --store fashion-pro --output ./dist. Gotowe do pipeline.' },
  ]

  const comparison = [
    { feature: 'Hosting', traditional: 'Vendor lock-in (Shopify, Wix)', soloSpot: 'Dowolny: Vercel, CF Pages, AWS' },
    { feature: 'Backend', traditional: 'Zarządzany przez vendor', soloSpot: 'Opcjonalny (hydration) / Brak' },
    { feature: 'Skalowanie', traditional: 'Limity planu, upgrade', soloSpot: 'Edge CDN skaluje automatycznie' },
    { feature: 'Własność', traditional: 'Zamknięte API, ograniczony', soloSpot: 'Pełna własność plików i kodu' },
    { feature: 'Koszt', traditional: '% od obrotu + abonament', soloSpot: 'Stały abonament, 0% transakcji' },
  ]

  return (
    <section id="export" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <Download className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">HTML Export</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Eksportuj na<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              dowolny hosting.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            SoloSpot nie zamyka Cię w vendor lock-in. Eksportuj sklep jako statyczne pliki i hostuj gdzie chcesz. Pełna suwerenność.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 hover:border-[#D9A86C]/30 rounded-2xl p-4 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-[#F2C27F]" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F1EA] mb-1">{f.title}</h3>
              <p className="text-[11px] text-[#B8B1A7] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-6">
          <h3 className="text-xs font-bold text-[#D9A86C] uppercase tracking-[0.2em] mb-4">SaaS vs SoloSpot Export</h3>
          <div className="space-y-2 text-xs">
            {comparison.map((c) => (
              <div key={c.feature} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-[#F5F1EA]">{c.feature}</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#77736D] line-through sm:no-underline">{c.traditional}</span>
                  <span className="text-[#F2C27F] font-medium">{c.soloSpot}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-[#D9A86C]">
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Native</span>
          </div>
          <div className="bg-[#080B10] rounded-xl p-3 font-mono text-xs text-[#F2C27F] overflow-x-auto">
            <span className="text-[#77736D]">$ </span>solospot export --store fashion-pro --cdn cloudflare
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
    { name: 'Fashion Store Pro', domain: 'fashion.solospot.pl', plan: 'Pro', status: 'active', revenue: '12.4k PLN', health: 98 },
    { name: 'Beauty Lab', domain: 'beauty.solospot.pl', plan: 'Business', status: 'active', revenue: '8.7k PLN', health: 100 },
    { name: 'Restaurant Hub', domain: 'food.solospot.pl', plan: 'Enterprise', status: 'active', revenue: '45.2k PLN', health: 99 },
    { name: 'Digital Goods', domain: 'digital.solospot.pl', plan: 'Starter', status: 'trial', revenue: '1.2k PLN', health: 87 },
  ]

  const tenantsList = realTenants.length > 0
    ? realTenants.map(t => ({
        name: t.store?.name || t.id,
        domain: t.store?.domain || `${t.store?.slug || 'sklep'}.solospot.pl`,
        plan: (t.packageId || 'Pro').toUpperCase(),
        status: t.status === 'ACTIVE' ? 'active' : 'trial',
        revenue: `${((t.revenue || 0) / 100).toFixed(1)}k PLN`,
        health: t.health || 99,
      }))
    : defaultTenants

  const eventsList = realEvents.length > 0
    ? realEvents.slice(0, 4).map(e => ({
        time: new Date(e.timestamp).toLocaleTimeString('pl-PL'),
        type: e.eventType?.includes('deploy') ? 'deploy' : e.eventType?.includes('provision') ? 'provision' : 'export',
        message: `${e.tenantId} — ${e.eventType}`,
      }))
    : [
        { time: '2m', type: 'deploy', message: 'fashion-pro — deployment complete (Edge CDN)' },
        { time: '5m', type: 'provision', message: 'New tenant: beauty-lab-pro — provisioned in 26s' },
        { time: '12m', type: 'export', message: 'restaurant-hub — HTML export completed' },
      ]

  const metrics = [
    { label: 'Aktywni najemcy', value: realTenants.length > 0 ? String(realTenants.length) : '1,247', icon: Users, color: 'text-[#F2C27F]' },
    { label: 'Zamówienia / 24h', value: '3,891', icon: ShoppingCart, color: 'text-emerald-400' },
    { label: 'Przychód platformy', value: '284k PLN', icon: CreditCard, color: 'text-[#D9A86C]' },
    { label: 'Uptime', value: '99.99%', icon: Shield, color: 'text-[#F6D7AA]' },
    { label: 'Eksporty / tydz.', value: '89', icon: Download, color: 'text-emerald-400' },
    { label: 'Provisioning', value: '28s', icon: Cpu, color: 'text-[#D9A86C]' },
  ]

  return (
    <section id="mission-control" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <BarChart3 className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Mission Control</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Centrum dowodzenia<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              platformy.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Pełna obserwowalność: tenantów, provisioningu, deployów, eksportów, płatności i logów. Zarządzasz platformą z jednego miejsca.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl p-3.5"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                <span className="text-[11px] text-[#77736D] truncate">{m.label}</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-[#F5F1EA]">{m.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <h3 className="text-xs font-bold text-[#D9A86C] uppercase tracking-[0.2em]">Dzierżawy na platformie</h3>
            <Link href="/mission-control/tenants" className="text-xs text-[#D9A86C] hover:text-[#F2C27F] font-medium">Wszystkie →</Link>
          </div>
          <div className="space-y-2">
            {tenantsList.slice(0, 3).map((t) => (
              <div key={t.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div>
                  <span className="font-semibold text-[#F5F1EA] block">{t.name}</span>
                  <span className="text-[11px] text-[#77736D] font-mono">{t.domain}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#F2C27F] font-mono font-medium block">{t.revenue}</span>
                  <span className="text-[10px] text-emerald-400">● {t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-[#F5F1EA]">Strumień zdarzeń</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <div className="space-y-2">
            {eventsList.map((e, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] text-xs">
                <span className="text-[10px] font-mono text-[#D9A86C] bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">{e.time}</span>
                <span className="text-[#B8B1A7] text-[11px] leading-tight truncate">{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function WhySoloSpotSection() {
  const pillars = [
    { icon: Zap, title: 'Time-to-market: godziny, nie miesiące', desc: 'Szablon z Marketplace → provisioning (30s) → edycja w Studio → publish. Pierwsze zamówienie tego samego dnia.', metric: '~2h do live' },
    { icon: ShieldCheck, title: 'Izolacja tenantów na poziomie infra', desc: 'Każdy sklep to oddzielny tenant z własną bazą, plikami, kluczami API. Zero wycieków danych.', metric: '100% izolacja' },
    { icon: Layers, title: 'Platforma, nie generator stron', desc: 'Silnik płatności, zamówień, podatków, wysyłki, zapasów, B2B. E-commerce OS, nie prosty CMS.', metric: '6 warstw' },
    { icon: Box, title: 'Gotowe modele biznesowe', desc: 'Moda, Uroda, Gastronomia, Cyfrowe — produkty, motyw, sekcje, SEO, konfiguracja handlowa.', metric: '12+ modeli' },
    { icon: Globe, title: 'Eksport HTML = wolność hostingu', desc: 'Hostuj na Vercel, Netlify, Cloudflare, AWS lub własnym serwerze. Pełna suwerenność kodu.', metric: 'Dowolny host' },
    { icon: Settings2, title: 'Multi-tenant by design', desc: 'Jedna instancja platformy obsługuje tysiące sklepów. Skalujemy infrastrukturę pod Twój wzrost.', metric: '∞ skala' },
  ]

  return (
    <section id="why" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <Target className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Dlaczego SoloSpot</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Nie budujemy sklepów.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              Budujemy system operacyjny.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            SoloSpot to infrastruktura klasy Enterprise dla nowoczesnego handlu. Wielodostępna, rozszerzalna i pozbawiona vendor lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 hover:border-[#D9A86C]/30 rounded-2xl p-4 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:border-[#D9A86C]/40 transition-colors">
                <p.icon className="w-4 h-4 text-[#F2C27F]" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F1EA] mb-1">{p.title}</h3>
              <p className="text-[11px] text-[#B8B1A7] leading-relaxed mb-3">{p.desc}</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#F2C27F] border border-white/10 inline-block">
                {p.metric}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function IntegrationsSection() {
  const categories = [
    { name: 'Płatności', icon: CreditCard, items: ['Stripe', '1Koszyk', 'P24', 'BLIK', 'Apple Pay'] },
    { name: 'Wysyłka i logistyka', icon: Truck, items: ['InPost', 'DPD', 'DHL', 'FedEx', 'UPS'] },
    { name: 'ERP i magazyn', icon: Database, items: ['Subiekt GT', 'BaseLinker', 'Comarch', 'Enova'] },
    { name: 'Marketing i analityka', icon: BarChart3, items: ['GA4', 'Meta Pixel', 'TikTok Pixel', 'Klaviyo'] },
    { name: 'CI/CD i hosting', icon: GitBranch, items: ['GitHub Actions', 'Vercel', 'Cloudflare Pages'] },
    { name: 'Tożsamość i auth', icon: Shield, items: ['Supabase Auth', 'Auth0', 'Clerk', 'OAuth 2.0'] },
  ]

  return (
    <section id="integrations" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <GitBranch className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Ekosystem integracji</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Połączony z Twoim<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              ekosystemem.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            SoloSpot integruje się z Twoimi narzędziami: płatności, logistyka, ERP, marketing i tożsamość.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 hover:border-[#D9A86C]/30 rounded-2xl p-4 transition-all"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <cat.icon className="w-3.5 h-3.5 text-[#F2C27F]" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F1EA]">{cat.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((item) => (
                  <span key={item} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#B8B1A7]">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#F5F1EA] block">Brakuje Ci integracji?</span>
            <span className="text-[11px] text-[#77736D] block">Mamy otwarte API i webhooki.</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-[#F5F1EA] transition-all"
          >
            <span>Dokumentacja</span>
            <ArrowRight className="w-3 h-3 text-[#D9A86C]" />
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
      subtitle: 'Dla twórców',
      price: '0',
      period: 'PLN / mc',
      description: 'Jeden sklep. Podstawowa platforma.',
      capabilities: ['1 tenant (sklep)', 'Do 100 zamówień/mc', 'Studio Builder', 'HTML Export'],
      cta: 'Zacznij za darmo',
      popular: false,
    },
    {
      name: 'Pro',
      subtitle: 'Najczęściej wybierany',
      price: '299',
      period: 'PLN / mc',
      description: 'Bez limitów. Mission Control. API & Webhooks.',
      capabilities: ['Do 5 tenantów', 'Brak limitów zamówień', 'Mission Control', 'API & Webhooks', 'Własna domena'],
      cta: 'Wybierz Pro',
      popular: true,
    },
    {
      name: 'Business',
      subtitle: 'Dla zespołów',
      price: '799',
      period: 'PLN / mc',
      description: 'Wiele sklepów. Współpraca zespołowa.',
      capabilities: ['Do 20 tenantów', 'Role i uprawnienia', 'Audit Log', 'SSO / SAML', 'SLA 99.9%'],
      cta: 'Wybierz Business',
      popular: false,
    },
    {
      name: 'Enterprise',
      subtitle: 'Dla organizacji',
      price: 'Custom',
      period: '',
      description: 'Hosting on-premise / VPC. Własny runtime.',
      capabilities: ['Nielimitowane tenanty', 'VPC / On-premise', 'Custom SLA', 'Dedykowany inżynier'],
      cta: 'Skontaktuj się',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <Star className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">Cennik platformy</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Płacisz za platformę,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              nie za liczbę produktów.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Wszystkie plany zawierają dostęp do Marketplace, Studio, Runtime Engine i HTML Export. 0% prowizji od transakcji.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between transition-all ${
                tier.popular
                  ? 'bg-[#0D1118]/95 border-2 border-[#D9A86C] shadow-lg shadow-[#D9A86C]/10'
                  : 'bg-[#0D1118]/85 border border-white/10 hover:border-white/20'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Polecany
                </span>
              )}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="text-base font-bold text-[#F5F1EA]">{tier.name}</h3>
                  <span className="text-[10px] text-[#D9A86C] font-mono">{tier.subtitle}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#F5F1EA]">{tier.price}</span>
                  {tier.period && <span className="text-xs text-[#77736D]">{tier.period}</span>}
                </div>
                <p className="text-[11px] text-[#77736D] mb-3">{tier.description}</p>
                <ul className="space-y-1.5 mb-4 text-xs text-[#B8B1A7]">
                  {tier.capabilities.map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#D9A86C] flex-shrink-0" />
                      <span className="text-[11px]">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/register"
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  tier.popular
                    ? 'bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#080B10] shadow-md shadow-[#D9A86C]/20 hover:scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F1EA]'
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const faqs = [
    { q: 'Czy SoloSpot to kolejny SaaS do sklepów (jak Shopify/Wix)?', a: 'Nie. SoloSpot to Commerce Operating System: masz platformę wielodostępową do uruchamiania produktów e-commerce, ale możesz je też wyeksportować jako statyczny HTML i postawić na własnym hostingu. Zero vendor lock-in.' },
    { q: 'Jak wygląda migracja ze starych sklepów?', a: 'Zapewniamy narzędzia do importu produktów, zamówień i klientów. Dane zostają w 100% Twoje.' },
    { q: 'Czy muszę hostować u Was?', a: 'Nie. Dzięki HTML Export wyeksportujesz sklep jako statyczne pliki i uruchomisz na Vercel, Netlify, Cloudflare Pages, AWS czy własnym serwerze.' },
    { q: 'Jak działa model wielodostępny (multi-tenant)?', a: 'Jedna instancja obsługuje wiele sklepów. Każdy tenant posiada pełną izolację danych, kluczy API i konfiguracji.' },
    { q: 'Jakie są koszty transakcyjne?', a: 'SoloSpot nie pobiera procentu od obrotu. Płacisz wyłącznie stały abonament platformy + prowizje wybranego providera płatności.' },
  ]
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A86C]/10 border border-[#D9A86C]/25 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#D9A86C]" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9A86C] uppercase">FAQ</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4">
            Pytania o platformę?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              Mamy odpowiedzi.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] leading-relaxed">
            Nie znalazłeś odpowiedzi? <Link href="/contact" className="text-[#F2C27F] hover:underline">Napisz do nas</Link>
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#0D1118]/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
                aria-expanded={openIndex === i}
              >
                <span className="text-xs sm:text-sm font-medium text-[#F5F1EA] pr-4">{faq.q}</span>
                <motion.div animate={{ rotate: openIndex === i ? 90 : 0 }} className="text-[#77736D] flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 border-t border-white/5 text-xs text-[#B8B1A7] leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section id="cta" className="relative py-20 lg:py-28 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl">
        <div className="relative bg-[#0D1118]/90 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[#D9A86C]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#F5F1EA] tracking-[-0.03em] leading-[1.06] mb-4 relative z-10">
            Gotowy wdrożyć<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#F6D7AA]">
              Commerce Operating System?
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#B8B1A7] mb-6 relative z-10 leading-relaxed">
            Stwórz sklep w minutach. Wdróż natychmiast. Skaluj bez ograniczeń. Eksportuj gdzie chcesz.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-[#D9A86C]/20 hover:scale-[1.02] transition-all"
            >
              <span>Zbuduj swój system</span>
              <ArrowRight className="w-4 h-4 text-[#080B10]" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/10 hover:border-white/20 text-[#F5F1EA] hover:bg-white/5 text-xs sm:text-sm font-medium rounded-full transition-all"
            >
              <span>Mission Control</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative border-t border-white/[0.08] py-12 px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24 w-full bg-transparent">
      <div className="max-w-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <p className="text-xs text-[#77736D]">© {new Date().getFullYear()} SoloSpot.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[#77736D]">
          {[['Architektura','#architecture'],['Marketplace','#marketplace'],['Studio','#studio'],['Runtime','#runtime'],['Export','#export'],['Mission Control','#mission-control'],['Cennik','#pricing'],['Rejestracja','/register']].map(([label,href])=>(
            href.startsWith('#') ? (
              <a key={label} href={href} className="hover:text-[#F5F1EA] transition-colors">{label}</a>
            ) : (
              <Link key={label} href={href} className="hover:text-[#F5F1EA] transition-colors">{label}</Link>
            )
          ))}
        </div>
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
