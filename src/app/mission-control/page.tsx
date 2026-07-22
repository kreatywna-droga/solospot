'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Store, CreditCard, Activity, AlertCircle, Zap,
  Server, Database, Wifi, BarChart3, TrendingUp, DollarSign,
  CheckCircle2, Clock, ExternalLink, Settings, Layers, FileText,
  ArrowRight, ChevronDown, MoreVertical, Star, Truck, Shield,
  ShoppingCart,

  RefreshCw, Terminal, Cpu, HardDrive, Network, Eye, Search,
} from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  ownerEmail: string
  packageId: string
  status: string
  store: { id: string; name: string; status: string; domain?: string } | null
  lastEvent: { eventType: string; timestamp: string; actor: string } | null
  health: number
  revenue: number
  orders: number
  createdAt: string
}

interface Order {
  orderId: string
  paymentIntentId: string
  tenantId: string
  provider: string
  status: string
  amount: number
  createdAt: string
}

interface Event {
  eventId: string
  eventType: string
  tenantId: string
  timestamp: string
  correlationId: string
  payload?: any
}

interface SystemHealth {
  service: string
  status: 'operational' | 'degraded' | 'down'
  latency: string
  uptime: string
  lastCheck: string
}

export default function MissionControlPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [health, setHealth] = useState<SystemHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'events' | 'health' | 'deployments'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchAll() {
      try {
        const [tenantsRes, ordersRes, eventsRes, healthRes] = await Promise.all([
          fetch('/api/mission-control/tenants'),
          fetch('/api/mission-control/orders'),
          fetch('/api/mission-control/events'),
          fetch('/api/mission-control/health'),
        ])
        const [tenantsData, ordersData, eventsData, healthData] = await Promise.all([
          tenantsRes.json(),
          ordersRes.json(),
          eventsRes.json(),
          healthRes.json(),
        ])
        setTenants(tenantsData.tenants ?? [])
        setOrders(ordersData.orders ?? [])
        setEvents(eventsData.events ?? [])
        setHealth(healthData.services ?? [])
      } catch (err) {
        console.error('Failed to fetch mission control data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()

    if (autoRefresh) {
      const interval = setInterval(fetchAll, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full"
        />
      </div>
    )
  }

  const activeStores = tenants.filter(t => t.store?.status === 'READY' || t.store?.status === 'PUBLISHED').length
  const completedPayments = orders.filter(o => o.status === 'PAID').length
  const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.amount, 0)
  const totalTenants = tenants.length

  const kpis = [
    { label: 'Tenanci', value: totalTenants, change: '+12%', icon: Users, color: 'violet', trend: 'up' },
    { label: 'Aktywne sklepy', value: activeStores, change: '+8%', icon: Store, color: 'emerald', trend: 'up' },
    { label: 'Przychód (30d)', value: (totalRevenue / 100).toLocaleString('pl-PL') + ' PLN', change: '+23%', icon: DollarSign, color: 'amber', trend: 'up' },
    { label: 'Zamówienia (24h)', value: orders.filter(o => new Date(o.createdAt) > new Date(Date.now() - 86400000)).length, change: '+5%', icon: ShoppingCart, color: 'violet', trend: 'up' },
    { label: 'Konwersja', value: totalTenants > 0 ? ((completedPayments / totalTenants) * 100).toFixed(1) + '%' : '0%', change: '+0.3pp', icon: TrendingUp, color: 'blue', trend: 'up' },
    { label: 'Uptime platformy', value: '99.99%', change: '0%', icon: Shield, color: 'cyan', trend: 'neutral' },
  ]

  const recentEvents = events.slice(0, 20)
  const filteredTenants = tenants.filter(t =>
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.store?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderEventItem = (evt: Event, i: number) => {
    const severityColors: Record<string, string> = {
      provision: 'bg-violet-500',
      deploy: 'bg-emerald-500',
      export: 'bg-amber-500',
      payment: 'bg-blue-500',
      scale: 'bg-cyan-500',
      alert: 'bg-red-500',
    }

    return (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.03 * i }}
        className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div
          className={`w-2 h-2 rounded-full ${severityColors[evt.eventType] || 'bg-violet-500'} flex-shrink-0 mt-1.5`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-violet-300">{evt.eventType}</span>
            <span className="text-xs font-medium text-slate-400">{evt.tenantId}</span>
          </div>
          <p className="text-sm text-slate-300 mt-0.5">
            {evt.payload ? JSON.stringify(evt.payload).slice(0, 100) : 'Brak szczegółów'}
          </p>
        </div>
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap ml-2">
          {new Date(evt.timestamp).toLocaleString('pl-PL')}
        </span>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#000000]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-white tracking-tight text-lg">Solo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Spot</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              {['overview', 'tenants', 'events', 'health', 'deployments'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a0a0e] text-violet-500 focus:ring-violet-500"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Odśwież teraz"
            >
              <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

<main className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black text-white mb-2">Mission Control</h1>
                <p className="text-slate-400">Centrum dowodzenia platformą SoloSpot — {totalTenants} tenant{totalTenants !== 1 ? 'ów' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">System Operational</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Szukaj tenanta, sklepu, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0e] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </motion.div>

          {/* KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -2 }}
                className={`relative overflow-hidden rounded-2xl border p-5 ${
                  kpi.color === 'violet' ? 'border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10' :
                  kpi.color === 'emerald' ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-teal-500/10' :
                  kpi.color === 'amber' ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/20 to-orange-500/10' :
                  kpi.color === 'blue' ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-indigo-500/10' :
                  'border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 to-blue-500/10'
                }`}
              >
                <kpi.icon className={`w-5 h-5 ${
                  kpi.color === 'violet' ? 'text-violet-400' :
                  kpi.color === 'emerald' ? 'text-emerald-400' :
                  kpi.color === 'amber' ? 'text-amber-400' :
                  kpi.color === 'blue' ? 'text-blue-400' :
                  'text-cyan-400'
                } mb-4`} />
                <div className="text-3xl font-black text-white mb-1">{kpi.value}</div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{kpi.label}</div>
                <div className={`text-xs font-medium flex items-center gap-1 ${kpi.trend === 'up' ? 'text-emerald-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {kpi.change} vs tydzień temu
                </div>
              </motion.div>
            ))}

          </motion.div>

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Events */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-violet-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Strumień zdarzeń platformy</h2>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentEvents.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
                        <AlertCircle className="w-4 h-4" />
                        Brak zdarzeń
                      </div>
                    ) : (
                      recentEvents.map((evt, i) => renderEventItem(evt, i))
                    )}
                  </div>
                </motion.div>

                {/* Tenant Quick View */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Szybki podgląd tenantów</h2>
                    </div>
                    <Link href="/mission-control/tenants" className="text-sm text-violet-400 hover:text-violet-300 font-medium">Zobacz wszystkie</Link>
                  </div>
                  {filteredTenants.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
                      <AlertCircle className="w-4 h-4" />
                      Brak zarejestrowanych tenantów
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredTenants.slice(0, 10).map((t) => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300 truncate">{t.ownerEmail}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                t.status === 'ACTIVE'
                                  ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                                  : 'text-slate-500 border-slate-500/30 bg-slate-500/10'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              <span>{t.store?.name || '—'}</span>
                              <span className="font-mono">{t.store?.domain || 'brak domeny'}</span>
                              <span className="font-medium text-amber-300">{(t.revenue / 100).toLocaleString('pl-PL')} PLN</span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{t.health}% health</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* System Health */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Status platformy
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {health.map((s, i) => (
                    <motion.div
                      key={s.service}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white">{s.service}</h3>
                        <span className={`w-3 h-3 rounded-full ${s.status === 'operational' ? 'bg-emerald-400' : s.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-slate-400">Latency (p95)</span>
                          <span className="font-mono text-lg font-bold text-white">{s.latency}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-slate-400">Uptime</span>
                          <span className="font-mono text-lg font-bold text-emerald-400">{s.uptime}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-slate-400">Last Check</span>
                          <span className="font-mono text-sm text-slate-400">{new Date(s.lastCheck).toLocaleString('pl-PL')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'tenants' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/5 bg-[#080a12] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Zarządzanie tenantami</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Tenant', 'Email', 'Pakiet', 'Status', 'Sklep', 'Domena', 'Health', 'Przychód', 'Zamówienia', 'Utworzono', 'Ostatni event'].map(h => (
                        <th key={h} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-slate-300">{t.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{t.ownerEmail}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.packageId === 'enterprise' ? 'bg-purple-500/20 text-purple-400' : t.packageId === 'business' ? 'bg-blue-500/20 text-blue-400' : t.packageId === 'pro' ? 'bg-violet-500/20 text-violet-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {t.packageId.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-sm ${t.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{t.store?.name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">{t.store?.domain || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all`} style={{ width: `${t.health}%` }} />
                            </div>
                            <span className="text-xs font-mono text-slate-400 w-10">{t.health}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white">{(t.revenue / 100).toLocaleString('pl-PL')} PLN</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{t.orders}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">{new Date(t.createdAt).toLocaleString('pl-PL')}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{t.lastEvent ? `${t.lastEvent.eventType} • ${new Date(t.lastEvent.timestamp).toLocaleString('pl-PL')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/5 bg-[#080a12] overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Strumień zdarzeń</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{events.length} zdarzeń</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Czas', 'Typ', 'Tenant', 'Correlation ID', 'Payload'].map(h => (
                        <th key={h} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.slice(0, 100).map((evt, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-6 py-3 text-xs text-slate-400 font-mono">{new Date(evt.timestamp).toLocaleString('pl-PL')}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300">{evt.eventType}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-300 font-mono">{evt.tenantId}</td>
                        <td className="px-6 py-3 text-xs text-slate-500 font-mono">{evt.correlationId}</td>
                        <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate font-mono">{evt.payload ? JSON.stringify(evt.payload) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'health' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {health.map((s, i) => (
                  <motion.div
                    key={s.service}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="rounded-2xl border border-white/5 bg-[#080a12] p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">{s.service}</h3>
                      <span className={`w-3 h-3 rounded-full ${s.status === 'operational' ? 'bg-emerald-400' : s.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <span className="text-sm text-slate-400">Latency (p95)</span>
                        <span className="font-mono text-lg font-bold text-white">{s.latency}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <span className="text-sm text-slate-400">Uptime</span>
                        <span className="font-mono text-lg font-bold text-emerald-400">{s.uptime}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <span className="text-sm text-slate-400">Last Check</span>
                        <span className="font-mono text-sm text-slate-400">{new Date(s.lastCheck).toLocaleString('pl-PL')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  Logi systemowe (ostatnie 50)
                </h3>
                <div className="bg-[#000000] rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-96 overflow-y-auto">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="flex gap-3 py-1 border-b border-white/5 last:border-0">
                      <span className="text-slate-500 w-20 shrink-0">{new Date(Date.now() - i * 60000).toLocaleTimeString('pl-PL')}</span>
                      <span className="text-violet-400 w-24 shrink-0">[MISSION-CTRL]</span>
                      <span className="text-slate-300">Health check completed for all services. All operational.</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'deployments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/5 bg-[#080a12] p-6">
              <h2 className="text-xl font-bold text-white mb-6">Wdrożenia i publikacje</h2>
              <div className="space-y-4">
                {[
                  { id: 'deploy-001', store: 'fashion-pro', version: 'v2.4.1', status: 'success', time: '2 min temu', duration: '45s', target: 'Edge (Global)' },
                  { id: 'deploy-002', store: 'beauty-lab', version: 'v1.2.0', status: 'success', time: '15 min temu', duration: '38s', target: 'Edge (EU)' },
                  { id: 'deploy-003', store: 'restaurant-hub', version: 'v3.0.0', status: 'building', time: 'Teraz', duration: '—', target: 'Edge (Global)' },
                  { id: 'deploy-004', store: 'digital-goods', version: 'v1.0.5', status: 'failed', time: '1h temu', duration: '12s', target: 'Export HTML', error: 'Asset optimization timeout' },
                  { id: 'deploy-005', store: 'home-decor', version: 'v2.1.3', status: 'success', time: '3h temu', duration: '52s', target: 'Edge (US)' },
                ].map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.status === 'success' ? 'bg-emerald-500/20' : d.status === 'building' ? 'bg-violet-500/20' : d.status === 'failed' ? 'bg-red-500/20' : 'bg-slate-500/20'}`}>
                      {d.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {d.status === 'building' && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><RefreshCw className="w-5 h-5 text-violet-400" /></motion.div>}
                      {d.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{d.store}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-400">{d.version}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-400">{d.target}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{d.time} • {d.duration}</div>
                      {d.error && <div className="text-xs text-red-400 mt-1">{d.error}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${d.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : d.status === 'building' ? 'bg-violet-500/20 text-violet-400' : d.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {d.status === 'success' ? 'Sukces' : d.status === 'building' ? 'Budowanie...' : d.status === 'failed' ? 'Błąd' : 'Oczekuje'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}