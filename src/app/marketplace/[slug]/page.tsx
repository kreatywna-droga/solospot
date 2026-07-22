'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Package, Sparkles, Utensils, Globe, ShoppingCart, ArrowRight,
  CheckCircle2, ExternalLink, Star, TrendingUp, Zap, LayoutDashboard, BarChart3, Settings, Layers, FileText, ImageIcon,
  ArrowUp, ArrowDown, ChevronDown, MoreVertical, Truck, CreditCard, Globe as GlobeIcon, Download, Users,
  Shield, Mail,
} from 'lucide-react'

interface TemplateProduct {
  slug: string
  name: string
  category: string
  description: string
  price: number
  currency: string
  previewImage?: string
  screenshots?: string[]
  liveDemoUrl?: string
  includes: string[]
  features: string[]
  theme: {
    primaryColor: string
    secondaryColor: string
    font: string
    description: string
  }
  pages: Array<{ id: string; name: string; slug: string; sections: Array<{ type: string; label: string }> }>
  products: Array<{ name: string; price: number; description: string }>
}

const categoryLabels: Record<string, string> = {
  fashion: 'Moda', beauty: 'Uroda', food: 'Gastronomia', restaurant: 'Gastronomia',
  digital: 'Cyfrowe', b2b: 'B2B',
}

const categoryIcons: Record<string, React.ReactNode> = {
  fashion: <Package className="w-5 h-5" />,
  beauty: <Sparkles className="w-5 h-5" />,
  food: <Utensils className="w-5 h-5" />,
  restaurant: <Utensils className="w-5 h-5" />,
  digital: <Globe className="w-5 h-5" />,
  b2b: <LayoutDashboard className="w-5 h-5" />,
}

const categoryGradients: Record<string, string> = {
  fashion: 'from-pink-500/20 via-rose-500/10 to-fuchsia-500/20',
  beauty: 'from-purple-500/20 via-violet-500/10 to-pink-500/20',
  food: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20',
  restaurant: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20',
  digital: 'from-blue-500/20 via-cyan-500/10 to-indigo-500/20',
  b2b: 'from-slate-500/20 via-zinc-500/10 to-slate-500/20',
}

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { PLN: 'zł', EUR: '€', USD: '$', GBP: '£' }
  return `${(price / 100).toLocaleString('pl-PL')} ${symbols[currency] || currency}`
}

const sectionTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  navbar: { label: 'Nawigacja', icon: <LayoutDashboard className="w-4 h-4" /> },
  hero: { label: 'Hero Banner', icon: <ImageIcon className="w-4 h-4" /> },
  'category-grid': { label: 'Kategorie', icon: <Layers className="w-4 h-4" /> },
  'product-grid': { label: 'Produkty', icon: <Package className="w-4 h-4" /> },
  'featured-products': { label: 'Polecane produkty', icon: <Star className="w-4 h-4" /> },
  gallery: { label: 'Galeria', icon: <ImageIcon className="w-4 h-4" /> },
  testimonials: { label: 'Opinie', icon: <Star className="w-4 h-4" /> },
  newsletter: { label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
  footer: { label: 'Stopka', icon: <LayoutDashboard className="w-4 h-4" /> },
  content: { label: 'Treść', icon: <FileText className="w-4 h-4" /> },
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#000000]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-white tracking-tight text-lg">Solo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Spot</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/marketplace" className="text-sm font-medium text-violet-400">Marketplace</Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white">Dashboard</Link>
          <Link href="/mission-control" className="text-sm font-medium text-slate-400 hover:text-white">Mission Control</Link>
          <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full text-sm hover:shadow-lg hover:shadow-violet-500/30 transition-all">
            Zacznij budować
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 bg-[#000000]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-white tracking-tight">Solo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Spot</span></span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-500">
          <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/mission-control" className="hover:text-white transition-colors">Mission Control</Link>
          <Link href="/register" className="hover:text-white transition-colors">Rejestracja</Link>
        </div>
        <p className="text-xs text-slate-700">© {new Date().getFullYear()} SoloSpot. Wszelkie prawa zastrzeżone.</p>
      </div>
    </footer>
  )
}

export default function MarketplaceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [product, setProduct] = useState<TemplateProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'tech' | 'demo'>('overview')
  const [activeScreenshot, setActiveScreenshot] = useState(0)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { slug } = await params
        const res = await fetch(`/api/templates/${slug}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setProduct(data.template)
      } catch (e) {
        setError('Nie znaleziono produktu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  const handleBuy = async () => {
    if (!product) return
    setBuying(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateSlug: product.slug }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else if (data.error) alert(data.error)
    } catch {
      alert('Błąd inicjacji płatności')
    } finally {
      setBuying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nie znaleziono produktu</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/marketplace" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full inline-block">
            Wróć do marketplace
          </Link>
        </div>
      </div>
    )
  }

  const catGradient = categoryGradients[product.category] || 'from-slate-500/20 to-slate-500/10'
  const catLabel = categoryLabels[product.category] || product.category
  const catIcon = categoryIcons[product.category] || <Package className="w-5 h-5" />

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Model biznesowy
          </h3>
          <p className="text-slate-400 leading-relaxed mb-6">
            {product.name} to gotowy do uruchomienia sklep internetowy w kategorii <strong className="text-white">{categoryLabels[product.category] || product.category}</strong>.
            Kupujesz nie szablon, ale kompletny model biznesowy: design, produkty, branding, płatności, hosting i SEO.
          </p>
          <div className="space-y-3">
            {[
              { icon: <CreditCard className="w-5 h-5" />, label: 'Płatności', desc: 'Stripe, BLIK, przelewy, płatność przy odbiorze' },
              { icon: <Truck className="w-5 h-5" />, label: 'Wysyłka', desc: 'InPost, DPD, DHL, Poczta Polska, kurier' },
              { icon: <GlobeIcon className="w-5 h-5" />, label: 'Hosting', desc: 'Edge CDN, SSL, domeny, skalowalność' },
              { icon: <FileText className="w-5 h-5" />, label: 'SEO', desc: 'Meta tags, sitemap, Open Graph, JSON-LD' },
              { icon: <Download className="w-5 h-5" />, label: 'Eksport HTML', desc: 'Statyczne pliki na dowolny hosting' },
              { icon: <Shield className="w-5 h-5" />, label: 'Bezpieczeństwo', desc: 'Brak backendu = brak ataku, płatności w iframe' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-white">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Co dalej po zakupie
          </h3>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Płatność', desc: 'Bezpieczny checkout (Stripe/1Koszyk). Potwierdzenie w sekundach.' },
              { step: '02', title: 'Provisioning', desc: 'Automatyczne stworzenie tenanta, bazy danych, kluczy API. ~30 sekund.' },
              { step: '03', title: 'Instalacja template', desc: 'Wstrzyknięcie designu, produktów, konfiguracji płatności/wysyłki.' },
              { step: '04', title: 'Studio', desc: 'Lądujesz w builderze – gotowy sklep do edycji. Zmieniasz tylko to, co chcesz.' },
              { step: '05', title: 'Publikacja / Export', desc: 'Jednym kliknięciem na Edge CDN lub eksport HTML na własny hosting.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          Dla kogo ten produkt
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Sparkles className="w-5 h-5" />, title: 'Pierwszy sklep', desc: 'Zero kodowania, gotowy w godzinę' },
            { icon: <TrendingUp className="w-5 h-5" />, title: 'Skalowanie', desc: 'Dodawaj produkty, strony, funkcje' },
            { icon: <GlobeIcon className="w-5 h-5" />, title: 'Własny hosting', desc: 'Eksport HTML – zero vendor lock-in' },
            { icon: <Zap className="w-5 h-5" />, title: 'Szybki start', desc: 'Od zera do sprzedaży w tym samym dniu' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
                {item.icon}
              </div>
              <div className="font-medium text-white">{item.title}</div>
              <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderFeatures = () => (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-400" />
          Funkcje sklepu
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {product?.features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.02 * i }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm font-medium text-slate-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {feature}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          Produkty demo w zestawie
        </h3>
        <div className="space-y-3">
          {product?.products.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{p.name}</h4>
                <p className="text-xs text-slate-400 truncate">{p.description}</p>
              </div>
              <div className="text-lg font-bold text-white whitespace-nowrap">{(p.price / 100).toLocaleString('pl-PL')} PLN</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTech = () => (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-violet-400" />
            Theme & Branding
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kolor główny</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-white/10" style={{ background: product?.theme.primaryColor }} />
                <code className="text-sm font-mono text-slate-300 bg-white/5 px-2 py-1 rounded">{product?.theme.primaryColor}</code>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kolor drugorzędny</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-white/10" style={{ background: product?.theme.secondaryColor }} />
                <code className="text-sm font-mono text-slate-300 bg-white/5 px-2 py-1 rounded">{product?.theme.secondaryColor}</code>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Czcionka</div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300" style={{ fontFamily: product?.theme.font }}>{product?.theme.font}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Opis motywu</div>
              <p className="text-sm text-slate-400">{product?.theme.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            Stack technologiczny
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Runtime', value: 'Next.js 16 (App Router) + React 19' },
              { label: 'Styling', value: 'Tailwind CSS 4 + CSS Variables' },
              { label: 'Database', value: 'PostgreSQL (Supabase) + Row Level Security' },
              { label: 'Auth', value: 'Supabase Auth (OAuth, Email, SSO/SAML)' },
              { label: 'Payments', value: 'Stripe, 1Koszyk, Przelewy24, BLIK, Apple/Google Pay' },
              { label: 'Deployment', value: 'Vercel Edge / Cloudflare Workers / Static Export' },
              { label: 'CMS', value: 'Runtime Engine (JSON → React → HTML)' },
              { label: 'Export', value: 'Static HTML + Assets (CLI / CI-CD ready)' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className="text-sm text-slate-300 font-mono text-right max-w-[60%] truncate">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          Eksport HTML / Static Export
        </h3>
        <p className="text-slate-400 mb-6">
          Każdy sklep możesz wyeksportować jako czyste pliki statyczne (HTML, CSS, JS, assets) i hostować gdzie chcesz:
          Vercel, Netlify, Cloudflare Pages, AWS S3+CloudFront, własny serwer, on-premise.
        </p>
        <div className="bg-[#000000] rounded-xl p-4 font-mono text-sm text-emerald-300 overflow-x-auto">
          <span className="text-slate-500">$ </span><span className="text-white">solospot export</span>
          <span className="text-violet-400"> --store</span> <span className="text-amber-400">{product?.slug}</span>
          <span className="text-violet-400"> --output</span> <span className="text-amber-400">./dist</span>
          <span className="text-violet-400"> --cdn</span> <span className="text-amber-400">cloudflare</span>
          <span className="text-violet-400"> --hydrate</span> <span className="text-amber-400">cart,filters</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          Strony w tym produkcie
        </h3>
        <div className="space-y-3">
          {product?.pages.map((page, i) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-white">{page.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-slate-400">
                      /{page.slug || 'home'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {page.sections.map((section, si) => {
                      const info = sectionTypeLabels[section.type] || { label: section.type, icon: <Layers className="w-3 h-3" /> }
                      return (
                        <span key={si} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-slate-300 flex items-center gap-1">
                          {info.icon}
                          {info.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">{page.sections.length} sekcji</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Sekcje dostępne w builderze
        </h3>
        <p className="text-slate-400 mb-6">
          W Studio możesz dowolnie komponować strony z gotowych sekcji. Każda sekcja to komponent React renderowany przez Runtime Engine.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(sectionTypeLabels).map(([type, info], i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.02 * i }}
              className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                {info.icon}
              </div>
              <span className="text-sm font-medium text-white">{info.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDemo = () => (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          Strony w tym produkcie
        </h3>
        <div className="space-y-3">
          {product?.pages.map((page, i) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-white">{page.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-slate-400">
                      /{page.slug || 'home'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {page.sections.map((section, si) => {
                      const info = sectionTypeLabels[section.type] || { label: section.type, icon: <Layers className="w-3 h-3" /> }
                      return (
                        <span key={si} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-slate-300 flex items-center gap-1">
                          {info.icon}
                          {info.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">{page.sections.length} sekcji</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Sekcje dostępne w builderze
        </h3>
        <p className="text-slate-400 mb-6">
          W Studio możesz dowolnie komponować strony z gotowych sekcji. Każda sekcja to komponent React renderowany przez Runtime Engine.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(sectionTypeLabels).map(([type, info], i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.02 * i }}
              className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                {info.icon}
              </div>
              <span className="text-sm font-medium text-white">{info.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'features': return renderFeatures()
      case 'tech': return renderTech()
      case 'demo': return renderDemo()
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Nav />
      <main className="pt-16 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 text-sm text-slate-500"
          >
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <span className="text-white/30">/</span>
            <Link href={`/marketplace/${product.category}`} className="hover:text-white transition-colors text-slate-400">
              {categoryLabels[product.category] || product.category}
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white font-medium">{product.name}</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start"
          >
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br relative" style={{ background: catGradient }}>
                {product.screenshots?.[activeScreenshot] ? (
                  <motion.img
                    key={activeScreenshot}
                    src={product.screenshots[activeScreenshot]}
                    alt={`${product.name} - screenshot ${activeScreenshot + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : product.previewImage ? (
                  <motion.img
                    src={product.previewImage}
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl font-black text-white/20">{product.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-white/80 border border-white/10 flex items-center gap-2">
                    {catIcon}
                    <span>{catLabel}</span>
                  </span>
                  <span className="text-3xl font-black text-white">{formatPrice(product.price, product.currency)}</span>
                </div>
              </div>

              {product.screenshots && product.screenshots.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-4 gap-3 mt-4"
                >
                  {product.screenshots.slice(0, 4).map((screenshot, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreenshot(i)}
                      className={`rounded-xl w-full aspect-square object-cover border border-white/5 hover:border-white/10 transition-colors cursor-pointer relative overflow-hidden ${i === activeScreenshot ? 'ring-2 ring-violet-500/50' : ''}`}
                    >
                      <img src={screenshot} alt={`${product.name} - screenshot ${i + 1}`} className="w-full h-full object-cover" />
                      {i === activeScreenshot && (
                        <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-violet-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}

              {product.liveDemoUrl && (
                <motion.a
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  href={product.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Zobacz live demo
                </motion.a>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 flex items-center justify-center">
                    {catIcon}
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white">{product.name}</h1>
                    <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-white/80 border border-white/10">
                      {catLabel}
                    </span>
                  </div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-slate-300 leading-relaxed"
                >
                  {product.description}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/5 bg-[#080a12] p-6"
              >
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Co otrzymujesz w gotowym sklepie
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.includes.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/5 bg-[#080a12] p-6"
              >
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Funkcje sklepu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm font-medium text-slate-300">
                      {feature}
                    </span>
                  ))}
                </div>
              </motion.div>

              {product.liveDemoUrl && (
                <motion.a
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  href={product.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Zobacz live demo
                </motion.a>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-4 border-t border-white/5 flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cena jednorazowa</div>
                  <div className="text-4xl font-black text-white">{formatPrice(product.price, product.currency)}</div>
                  <div className="text-xs text-slate-500 mt-1">Brak opłat miesięcznych. Płacisz raz – sklep jest Twój.</div>
                </div>
                <motion.button
                  onClick={handleBuy}
                  disabled={buying}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Przekierowanie...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Kup gotowy sklep
                    </span>
                  )}
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-emerald-300">Gwarancja wdrożenia</div>
                  <div className="text-sm text-slate-400">Automatyczne provisioning: tenant + sklep + template + produkty w poniżej 5 minut po płatności.</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-7xl mx-auto mt-24 lg:mt-0"
          >
            <div className="border-b border-white/10 mb-8">
              <nav className="flex gap-8" aria-label="Sekcje produktu">
                {([
                  { id: 'overview', label: 'Przegląd', icon: <LayoutDashboard className="w-4 h-4" /> },
                  { id: 'features', label: 'Funkcje', icon: <Package className="w-4 h-4" /> },
                  { id: 'tech', label: 'Technologia', icon: <Settings className="w-4 h-4" /> },
                  { id: 'demo', label: 'Strony i sekcje', icon: <Layers className="w-4 h-4" /> },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-2 py-4 border-b-2 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'border-violet-500 text-violet-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/10'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={activeTab}
            >
              {renderTabContent()}
            </motion.div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  )
}