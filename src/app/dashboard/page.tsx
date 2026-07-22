'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Store, ShoppingCart, CreditCard, Activity, Zap, AlertCircle, ArrowRight,
  LayoutTemplate, Package, Eye, PlusCircle, Globe, TrendingUp, DollarSign,
  CheckCircle2, Clock, ExternalLink, Settings, Layers, Download, BarChart3,
  Users, Shield, Wifi, Server, Database, Zap as ZapIcon,
} from 'lucide-react'

interface DashboardData {
  stores: Array<{
    id: string
    name: string
    slug: string
    domain: string | null
    status: string
    publicationStatus: string
    revenue: number
    orders: number
    createdAt: string
    theme: { primaryColor: string; secondaryColor: string }
  }>
  totals: {
    activeStores: number
    totalOrders: number
    paidOrders: number
    totalRevenue: number
    totalViews: number
    conversionRate: number
  }
  recentActivity: Array<{
    type: string
    storeId: string
    storeName: string
    message: string
    timestamp: string
    severity: 'info' | 'success' | 'warning' | 'error'
  }>
  tenant: {
    id: string
    status: string
    packageId: string
    createdAt: string
  } | null
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Aktywny', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  CREATED: { label: 'Utworzony', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <Clock className="w-3 h-3" /> },
  PROVISIONING: { label: 'Provisioning', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30', icon: <Activity className="w-3 h-3 animate-pulse" /> },
  ERROR: { label: 'Błąd', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertCircle className="w-3 h-3" /> },
}

const pubStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PUBLISHED: { label: 'Opublikowany', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <Globe className="w-3 h-3" /> },
  READY: { label: 'Gotowy do publikacji', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  DRAFT: { label: 'Szkic', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', icon: <LayoutTemplate className="w-3 h-3" /> },
}

export default function BusinessDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.status === 401) {
          setError('Zaloguj się, aby zobaczyć dashboard')
          return
        }
        const d = await res.json()
        if (!d.success) {
          setError(d.error || 'Nie udało się załadować panelu')
          return
        }
        setData(d)
      } catch {
        setError('Błąd połączenia z serwerem')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Brak dostępu</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full">
            Zaloguj się
          </Link>
        </motion.div>
      </div>
    )
  }

  const stores = data?.stores || []
  const totals = data?.totals || { activeStores: 0, totalOrders: 0, paidOrders: 0, totalRevenue: 0, totalViews: 0, conversionRate: 0 }
  const activity = data?.recentActivity || []

  const kpis = [
    {
      label: 'Aktywne sklepy',
      value: totals.activeStores,
      icon: Store,
      gradient: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      trend: '+12%',
      trendColor: 'text-emerald-400',
      href: '/dashboard/stores',
    },
    {
      label: 'Zamówienia (30d)',
      value: totals.totalOrders,
      icon: ShoppingCart,
      gradient: 'from-violet-500/20 to-fuchsia-500/10',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
      trend: '+8%',
      trendColor: 'text-emerald-400',
      href: '/dashboard/stores',
    },
    {
      label: 'Przychód (30d)',
      value: (totals.totalRevenue / 100).toLocaleString('pl-PL') + ' PLN',
      icon: DollarSign,
      gradient: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      trend: '+23%',
      trendColor: 'text-emerald-400',
      href: '/dashboard/stores',
    },
    {
      label: 'Konwersja',
      value: `${totals.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: 'from-blue-500/20 to-indigo-500/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      trend: '+0.3pp',
      trendColor: 'text-emerald-400',
      href: '/mission-control',
    },
  ]

  const quickActions = [
    { label: 'Nowy sklep', icon: PlusCircle, href: '/dashboard/stores', color: 'from-violet-600 to-fuchsia-600', desc: 'Z marketplace lub od zera' },
    { label: 'Marketplace', icon: LayoutTemplate, href: '/marketplace', color: 'from-emerald-600 to-teal-600', desc: 'Gotowe biznesy cyfrowe' },
    { label: 'Produkty', icon: Package, href: '/dashboard/products', color: 'from-amber-600 to-orange-600', desc: 'Zarządzaj katalogiem' },
    { label: 'Mission Control', icon: BarChart3, href: '/mission-control', color: 'from-pink-600 to-rose-600', desc: 'Centrum operacyjne' },
  ]

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 py-12"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start justify-between mb-12"
        >
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Centrum zarządzania biznesem</h1>
            {data?.tenant ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-3 text-sm text-slate-500"
              >
                <span>Tenant: <span className="font-mono text-slate-300">{data.tenant.id}</span></span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Pakiet: <span className="font-bold text-slate-300">{data.tenant.packageId}</span></span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full border ${statusConfig[data.tenant.status]?.bg || 'bg-slate-500/10 border-slate-500/30'}`}>
                  {statusConfig[data.tenant.status]?.label || data.tenant.status}
                </span>
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-500"
              >
                Nie masz jeszcze aktywnego tenanta. <Link href="/register" className="text-violet-400 hover:text-violet-300">Utwórz konto</Link>
              </motion.p>
            )}
          </div>
          <Link
            href="/mission-control"
            className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-all"
          >
            Centrum dowodzenia <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {kpis.map((kpi, i) => (
            <motion.link
              key={kpi.label}
              href={kpi.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              whileHover={{ y: -2 }}
              className={`relative overflow-hidden rounded-2xl border ${kpi.border} bg-gradient-to-br ${kpi.gradient} p-5`}
            >
              <div className="flex items-start justify-between mb-4">
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <div className="text-3xl font-black text-white mb-1">{kpi.value}</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{kpi.label}</div>
              <div className={`text-xs font-medium ${kpi.trendColor} flex items-center gap-1`}>
                <TrendingUp className="w-3 h-3" />
                {kpi.trend} vs miesiąc temu
              </div>
            </motion.link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-[2fr_1fr] gap-6 mb-10"
        >
          <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Twoje sklepy</h2>
              <Link href="/dashboard/stores" className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                Zobacz wszystkie <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>

            {stores.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Nie masz jeszcze żadnego sklepu</p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full"
                >
                  Kup gotowy sklep w Marketplace
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {stores.slice(0, 5).map((store, i) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(to right, ${store.theme?.primaryColor || '#7c3aed'}, ${store.theme?.secondaryColor || '#d946ef'})` }}>
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white truncate">{store.name}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusConfig[store.status]?.bg || 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}>
                          {statusConfig[store.status]?.label || store.status}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${pubStatusConfig[store.publicationStatus]?.bg || 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}>
                          {pubStatusConfig[store.publicationStatus]?.label || store.publicationStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="font-mono text-slate-400">{store.domain || `${store.slug}.solospot.pl`}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span>{store.orders} zamówień</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span className="font-medium text-amber-300">{(store.revenue / 100).toLocaleString('pl-PL')} PLN</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/stores/${store.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Zarządzaj <ArrowRight className="w-3 h-3" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Ostatnia aktywność
              </h2>
              {!activity.length ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  Brak aktywności
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activity.slice(0, 8).map((evt, i) => {
                    const severityColors = {
                      info: 'bg-blue-500',
                      success: 'bg-emerald-500',
                      warning: 'bg-amber-500',
                      error: 'bg-red-500',
                    }
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/5"
                      >
                        <span className={`w-2 h-2 rounded-full ${severityColors[evt.severity]} flex-shrink-0 mt-1.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-300">{evt.type}</span>
                            <span className="text-xs font-medium text-slate-400">{evt.storeName}</span>
                          </div>
                          <p className="text-sm text-slate-300 mt-0.5">{evt.message}</p>
                        </div>
                        <span className="text-xs text-slate-500 font-mono whitespace-nowrap ml-2">
                          {new Date(evt.timestamp).toLocaleString('pl-PL')}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Szybkie akcje
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, i) => (
                  <motion.link
                    key={action.label}
                    href={action.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    whileHover={{ scale: 1.02 }}
                    className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl bg-gradient-to-r ${action.color} text-white font-medium text-sm hover:opacity-90 transition-all`}
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </div>
                    <span className="text-xs text-white/70">{action.desc}</span>
                  </motion.link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          <div className="rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-8 text-center lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-2">
              {data?.tenant?.status === 'ACTIVE' ? 'Platforma aktywna' : 'Oczekuje na aktywację'}
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
              {data?.tenant?.status === 'ACTIVE'
                ? 'Twoja platforma jest aktywna. Twórz sklepy, instaluj szablony, zarządzaj produktami i publikuj na Edge CDN.'
                : 'Tenant utworzony. Po opłaceniu pakietu sklep zostanie automatycznie provisionowany w ciągu 30 sekund.'}
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data?.tenant?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {data?.tenant?.status === 'ACTIVE' ? 'System aktywny' : 'Oczekuje na aktywację'}
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                Edge CDN: Online
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-emerald-400" />
                DB: Connected
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-3 h-3 text-emerald-400" />
                Runtime: v2.1.0
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Status platformy
            </h2>
            <div className="space-y-3">
              {[
                { label: 'API Gateway', status: 'operational', latency: '12ms' },
                { label: 'Runtime Engine', status: 'operational', latency: '8ms' },
                { label: 'Edge CDN', status: 'operational', latency: '23ms' },
                { label: 'Payment Engine', status: 'degraded', latency: '145ms' },
                { label: 'Database (Primary)', status: 'operational', latency: '4ms' },
                { label: 'Event Bus', status: 'operational', latency: '2ms' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className="p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{s.label}</span>
                    <span className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                  <div className="text-xs text-slate-500">{s.latency} p95</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}