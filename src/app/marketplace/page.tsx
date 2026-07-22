'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Package, Sparkles, Utensils, Globe, ShoppingCart, ArrowRight,
  CheckCircle2, ExternalLink, Star, TrendingUp, Zap, Shield,
  LayoutDashboard, BarChart3, Settings, Layers, Download, Eye,
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
  pages: Array<{ id: string; name: string; sections: Array<{ type: string; label: string }> }>
  products: Array<{ name: string; price: number; description: string }>
}

const categoryLabels: Record<string, string> = {
  fashion: 'Moda',
  beauty: 'Uroda',
  food: 'Gastronomia',
  restaurant: 'Gastronomia',
  digital: 'Cyfrowe',
  b2b: 'B2B',
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
  const sym = symbols[currency] || currency
  return `${(price / 100).toLocaleString('pl-PL')} ${sym}`
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<TemplateProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/templates')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setProducts(data.templates)
      } catch (e) {
        setError('Nie udało się załadować produktów')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = [
    { id: 'all', label: 'Wszystkie', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'fashion', label: 'Moda', icon: <Package className="w-5 h-5" /> },
    { id: 'beauty', label: 'Uroda', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'restaurant', label: 'Gastronomia', icon: <Utensils className="w-5 h-5" /> },
    { id: 'digital', label: 'Cyfrowe', icon: <Globe className="w-5 h-5" /> },
  ]

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Błąd ładowania</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
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

      <main className="pt-16 pb-24 px-6">
        <section className="max-w-7xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">Marketplace gotowych biznesów cyfrowych</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl xl:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight"
          >
            Kup gotowy biznes.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400">My go wdrożymy.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Każdy produkt to kompletny, działający sklep internetowy: design, produkty, branding, płatności, SEO i hosting.
            Kupisz &ndash; my go automatycznie wdrożymy w kilka minut. Zero kodowania.
          </motion.p>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto mb-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={`/marketplace/${product.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#080a12] hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 flex flex-col h-full"
                >
                  <div className={`h-56 bg-gradient-to-br ${categoryGradients[product.category] || 'from-slate-500/20 to-slate-500/10'} flex items-center justify-center relative overflow-hidden`}>
                    {product.previewImage && (
                      <img
                        src={product.previewImage}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-center">
                      <span className="text-7xl font-black text-white/20">{product.name.charAt(0)}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-white/80 border border-white/10 flex items-center gap-2">
                        {categoryIcons[product.category]}
                        <span>{categoryLabels[product.category] || product.category}</span>
                      </span>
                      <span className="text-2xl font-black text-white">{formatPrice(product.price, product.currency)}</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">{product.name}</h3>
                    <p className="text-slate-400 text-sm mb-6 flex-1">{product.description}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {product.features.slice(0, 4).map((feature, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-slate-300">
                          {feature}
                        </span>
                      ))}
                      {product.features.length > 4 && (
                        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 text-xs font-medium text-violet-300">
                          +{product.features.length - 4} więcej
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-lg font-bold text-emerald-300">{formatPrice(product.price, product.currency)}</span>
                      <div className="flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
                        Zobacz szczegóły
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>Brak produktów w tej kategorii.</p>
            </div>
          )}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-7xl mx-auto mt-24 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all">
            Chcesz sprzedawać swoje szablony?
            <ArrowRight className="w-4 h-4" />
          </div>
          <p className="text-sm text-slate-500 mt-4">Skontaktuj się z nami: <a href="mailto:partners@solospot.pl" className="text-violet-400 hover:text-violet-300">partners@solospot.pl</a></p>
        </motion.section>
      </main>

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
    </div>
  )
}