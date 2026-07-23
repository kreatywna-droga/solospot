'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Palette, Globe, Save, CheckCircle2, Play, Archive, ExternalLink,
  Package, LayoutDashboard, Eye, Plus, Trash2, Edit, Search, Filter,
  ShoppingCart, CreditCard, BarChart3, Layers, FileText, ImageIcon,
  ArrowRight, ChevronDown, MoreVertical, Star, Truck, Zap,
  Mail, Download, Loader2, Info, AlertTriangle, ShieldCheck
} from 'lucide-react'

import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'

interface StoreBranding {
  logo?: string
  favicon?: string
  primaryColor?: string
  secondaryColor?: string
  font?: string
  description?: string
}

interface StoreConfig {
  publicationStatus?: string
  branding?: StoreBranding
  pages?: Array<{ id: string; name: string; slug: string; sections: Array<{ type: string; label: string }> }>
  products?: Array<{ id: string; name: string; price: number; description: string }>
}

interface StoreData {
  id: string
  name: string
  slug: string
  domain: string | null
  status: string
  config: StoreConfig
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
}

interface MarketPackage {
  id: string
  name: string
  description: string
  version: string
  publisher: string
  category: string
  isInstalled: boolean
}

const tabs = [
  { id: 'overview', label: 'Przegląd', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'design', label: 'Design & Logo', icon: <Palette className="w-4 h-4" /> },
  { id: 'products', label: 'Katalog produktów', icon: <Package className="w-4 h-4" /> },
  { id: 'packages', label: 'Pakiety & Dodatki', icon: <Layers className="w-4 h-4" /> },
  { id: 'domains', label: 'Domeny', icon: <Globe className="w-4 h-4" /> },
  { id: 'publish', label: 'Publikacja sklepu', icon: <Zap className="w-4 h-4" /> },
]

const sectionTypes = [
  { type: 'navbar', label: 'Nawigacja', icon: LayoutDashboard },
  { type: 'hero', label: 'Hero Banner', icon: ImageIcon },
  { type: 'category-grid', label: 'Kategorie', icon: Layers },
  { type: 'product-grid', label: 'Produkty', icon: Package },
  { type: 'gallery', label: 'Galeria', icon: ImageIcon },
  { type: 'testimonials', label: 'Opinie', icon: Star },
  { type: 'newsletter', label: 'Newsletter', icon: Mail },
  { type: 'footer', label: 'Stopka', icon: LayoutDashboard },
]

export default function StoreManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  const [store, setStore] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Dashboard Stats States
  const [stats, setStats] = useState<{ overview?: Record<string, number>; usage?: Record<string, number>; status?: Record<string, string> } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Products States
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, images: [] as string[] })

  // Packages States
  const [packages, setPackages] = useState<MarketPackage[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)

  // Domains States
  const [primaryDomain, setPrimaryDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [domainsLoading, setDomainsLoading] = useState(true)

  // Settings / Branding States
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [favicon, setFavicon] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#7c3aed')
  const [secondaryColor, setSecondaryColor] = useState('#d946ef')
  const [font, setFont] = useState('Inter')
  const [description, setDescription] = useState('')

  // Load General Store Info
  useEffect(() => {
    if (!id) return
    async function loadStore() {
      try {
        const res = await fetch(`/api/stores/${id}`)
        if (res.status === 403) { setError('Brak dostępu do sklepu'); return }
        const d = await res.json()
        if (!d.success) { setError(d.error || 'Nie udało się załadować sklepu'); return }
        const s = d.store as StoreData
        setStore(s)
        setName(s.name)
        const b = s.config?.branding
        if (b) {
          setLogo(b.logo || '')
          setFavicon(b.favicon || '')
          setPrimaryColor(b.primaryColor || '#7c3aed')
          setSecondaryColor(b.secondaryColor || '#d946ef')
          setFont(b.font || 'Inter')
          setDescription(b.description || '')
        }
      } catch { setError('Błąd połączenia z serwerem') }
      finally { setLoading(false) }
    }
    loadStore()
  }, [id])

  // Load Dashboard Metrics
  useEffect(() => {
    if (activeTab !== 'overview' || !store) return
    async function loadDashboardStats() {
      setStatsLoading(true)
      try {
        const res = await fetch('/api/store/dashboard')
        const d = await res.json()
        if (d.success) setStats(d)
      } catch {}
      finally { setStatsLoading(false) }
    }
    loadDashboardStats()
  }, [activeTab, store])

  // Load Products
  useEffect(() => {
    if (activeTab !== 'products' || !store) return
    async function loadProducts() {
      setProductsLoading(true)
      try {
        const res = await fetch(`/api/stores/${id}/products`)
        if (res.ok) {
          const d = await res.json()
          if (d.success) setProducts(d.products || [])
        }
      } catch {}
      finally { setProductsLoading(false) }
    }
    loadProducts()
  }, [activeTab, store, id])

  // Load Packages
  useEffect(() => {
    if (activeTab !== 'packages' || !store) return
    async function loadPackages() {
      setPackagesLoading(true)
      try {
        const res = await fetch('/api/store/packages')
        const d = await res.json()
        if (d.success) setPackages(d.packages || [])
      } catch {}
      finally { setPackagesLoading(false) }
    }
    loadPackages()
  }, [activeTab, store])

  // Load Domains
  useEffect(() => {
    if (activeTab !== 'domains' || !store) return
    async function loadDomains() {
      setDomainsLoading(true)
      try {
        const res = await fetch('/api/store/domains')
        const d = await res.json()
        if (d.success) {
          setPrimaryDomain(d.primaryDomain)
          setCustomDomain(d.customDomain || '')
        }
      } catch {}
      finally { setDomainsLoading(false) }
    }
    loadDomains()
  }, [activeTab, store])

  // Handle Save Settings & Branding
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/store/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          logoUrl: logo,
          faviconUrl: favicon,
          primaryColor,
          secondaryColor,
          fontFamily: font,
        }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error || 'Nie udało się zapisać zmian'); return }
      alert('Ustawienia brandingowe zostały zapisane pomyślnie!')
    } catch {
      alert('Błąd komunikacji z serwerem podczas zapisu')
    } finally {
      setSaving(false)
    }
  }

  // Handle Domain Update
  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/store/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error || 'Nieprawidłowa domena'); return }
      alert('Domena została zaktualizowana!')
    } catch {
      alert('Wystąpił błąd podczas zapisywania domeny')
    } finally {
      setSaving(false)
    }
  }

  // Handle Package Manager Action
  const handleTogglePackage = async (pkgId: string, isInstalled: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/store/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isInstalled ? 'UNINSTALL' : 'INSTALL',
          packageId: pkgId,
        }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error || 'Błąd operacji'); return }
      
      // Update packages local state
      setPackages(packages.map(p => p.id === pkgId ? { ...p, isInstalled: !isInstalled } : p))
      alert(isInstalled ? 'Pakiet odinstalowany!' : 'Pakiet pomyślnie zainstalowany!')
    } catch {
      alert('Błąd komunikacji z serwerem')
    } finally {
      setSaving(false)
    }
  }

  // Handle Storefront Build & Publish
  const handleTriggerPublish = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/store/publish', { method: 'POST' })
      const d = await res.json()
      if (!d.success) { alert(d.error || 'Publikacja nie powiodła się'); return }
      alert(`Publikacja zakończona sukcesem! Twój sklep jest gotowy pod adresem: ${d.result.deploymentUrl}`)
      if (store) {
        setStore({
          ...store,
          config: {
            ...store.config,
            publicationStatus: 'PUBLISHED'
          }
        })
      }
    } catch {
      alert('Błąd podczas nawiązywania połączenia z silnikiem publikacji')
    } finally {
      setSaving(false)
    }
  }

  // Handle Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error); return }
      setProducts([...products, d.product])
      setNewProduct({ name: '', description: '', price: 0, images: [] })
      setShowProductModal(false)
    } catch { alert('Błąd dodawania produktu') }
    finally { setSaving(false) }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return
    try {
      const res = await fetch(`/api/stores/${id}/products/${productId}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) setProducts(products.filter(p => p.id !== productId))
    } catch { alert('Błąd usuwania produktu') }
  }

  if (loading) return <PageLoading />

  if (error || !store) {
    return (
      <PageContainer>
        <EmptyState
          title="Brak autoryzacji"
          description={error || 'Nie znaleziono sklepu przypisanego do Twojego konta'}
          action={{ label: 'Wróć do listy sklepów', onClick: () => window.location.href = '/dashboard/stores' }}
        />
      </PageContainer>
    )
  }

  const currentPubStatus = store.config?.publicationStatus || 'DRAFT'

  return (
    <PageContainer>
      {/* Premium Header */}
      <div className="relative mb-8 p-8 rounded-3xl border border-white/5 bg-[#080912]/80 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-2xl font-black text-white">{store.name}</span>
              <span className={`text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                store.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {store.status === 'ACTIVE' ? 'Aktywny' : store.status}
              </span>
              <span className={`text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                currentPubStatus === 'PUBLISHED'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
              }`}>
                {currentPubStatus === 'PUBLISHED' ? 'Opublikowany' : 'Szkic'}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xl">
              Identyfikator sklepu: <span className="font-mono text-slate-300">{store.slug}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`http://${store.slug}.solospot.pl`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              Podgląd sklepu <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Button onClick={handleTriggerPublish} disabled={saving} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
              Publikuj na Live
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-8" />

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {statsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
              ) : (
                <>
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#090b14]/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Produkty w sklepie</span>
                        <Package className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{stats?.overview?.productCount || 0}</div>
                      <p className="text-[10px] text-slate-600 mt-1">zsynchronizowanych z bazą</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#090b14]/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Strony internetowe</span>
                        <FileText className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{stats?.overview?.pageCount || 0}</div>
                      <p className="text-[10px] text-slate-600 mt-1">wygenerowane przez silnik</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#090b14]/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ostatnia publikacja</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-sm font-bold text-white truncate">
                        {stats?.status?.lastDeploymentUrl ? (
                          <a href={stats.status.lastDeploymentUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                            {stats.status.lastDeploymentUrl}
                          </a>
                        ) : 'Brak danych'}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1">
                        Status: <span className="text-slate-300 font-bold">{stats?.status?.status || 'UNKNOWN'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Limits and Platform Health */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Zużycie zasobów i limity</h3>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Maksymalna liczba stron ({stats?.usage?.pageCount || 0} / {stats?.usage?.pageLimit || 10})</span>
                            <span className="font-bold text-white">{Math.round(((stats?.usage?.pageCount || 0) / (stats?.usage?.pageLimit || 10)) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500" style={{ width: `${Math.min(100, ((stats?.usage?.pageCount || 0) / (stats?.usage?.pageLimit || 10)) * 100)}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Maksymalna liczba produktów ({stats?.usage?.productCount || 0} / {stats?.usage?.productLimit || 100})</span>
                            <span className="font-bold text-white">{Math.round(((stats?.usage?.productCount || 0) / (stats?.usage?.productLimit || 100)) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, ((stats?.usage?.productCount || 0) / (stats?.usage?.productLimit || 100)) * 100)}%` }} />
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Metadane techniczne</h3>
                      </CardHeader>
                      <CardBody className="text-xs text-slate-500 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-slate-400 font-bold block mb-0.5">Nazwa sklepu:</span> {store.name}</div>
                          <div><span className="text-slate-400 font-bold block mb-0.5">Slug URL:</span> {store.slug}</div>
                          <div><span className="text-slate-400 font-bold block mb-0.5">Unikalne ID:</span> <span className="font-mono">{store.id}</span></div>
                          <div><span className="text-slate-400 font-bold block mb-0.5">System operacyjny:</span> Edge Server v2.5</div>
                        </div>
                        <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-3 mt-4 text-[11px] text-violet-300">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span>Wszystkie dane na tym ekranie są odpytywane w czasie rzeczywistym z zabezpieczonej bramki API oraz sprawdzane przez middleware platformy.</span>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Design */}
          {activeTab === 'design' && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ustawienia wizualne & Branding</h3>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nazwa Sklepu</label>
                      <Input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opis SEO</label>
                      <Input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Krótki opis witryny" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Logo (Adres URL)</label>
                      <Input type="text" value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Favicon (Adres URL)</label>
                      <Input type="text" value={favicon} onChange={e => setFavicon(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Kolor Główny</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                        <Input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Kolor Drugorzędny</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                        <Input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Styl Czcionki (Font Family)</label>
                    <select value={font} onChange={e => setFont(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0a0a0e] text-white px-4 py-2.5 text-sm">
                      <option value="Inter">Inter (SaaS)</option>
                      <option value="Poppins">Poppins (Geometryczny)</option>
                      <option value="Roboto">Roboto (Klasyczny)</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Premium)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                      Zapisz konfigurację brandingu
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Tab 3: Products */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Katalog Produktów</h3>
                <Button onClick={() => { setEditingProduct(null); setNewProduct({ name: '', description: '', price: 0, images: [] }); setShowProductModal(true) }} icon={<Plus className="w-4 h-4" />}>
                  Dodaj produkt
                </Button>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
              ) : products.length === 0 ? (
                <Card className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Brak produktów</h3>
                  <p className="text-slate-400 mb-6">W katalogu nie ma jeszcze żadnych artykułów.</p>
                  <Button onClick={() => { setEditingProduct(null); setNewProduct({ name: '', description: '', price: 0, images: [] }); setShowProductModal(true) }} icon={<Plus className="w-4 h-4" />}>
                    Dodaj pierwszy produkt
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{product.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-md">{product.description}</div>
                      </div>
                      <div className="text-sm font-bold text-white">{(product.price / 100).toLocaleString('pl-PL')} PLN</div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setShowProductModal(true) }} icon={<Edit className="w-4 h-4" />} />
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} icon={<Trash2 className="w-4 h-4 text-red-400" />} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Packages */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Zarządzanie pakietami (Marketplace)</h3>
                <p className="text-xs text-slate-500">Włączaj i wyłączaj integracje oraz gotowe rozszerzenia bezpośrednio w swoim sklepie.</p>
              </div>

              {packages.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mr-2" /> Wyszukiwanie kompatybilnych rozszerzeń...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="p-6 rounded-2xl border border-white/5 bg-[#090b14]/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="font-black text-white text-base">{pkg.name}</span>
                            <span className="text-[10px] text-slate-500 block">Wersja {pkg.version} • {pkg.publisher}</span>
                          </div>
                          <Badge variant={pkg.isInstalled ? 'success' : 'default'}>
                            {pkg.isInstalled ? 'Zainstalowany' : 'Nieaktywny'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mb-6">{pkg.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{pkg.category}</span>
                        <Button
                          variant={pkg.isInstalled ? 'outline' : 'primary'}
                          onClick={() => handleTogglePackage(pkg.id, pkg.isInstalled)}
                          loading={saving}
                          className="rounded-full text-xs font-semibold px-4 py-2"
                        >
                          {pkg.isInstalled ? 'Odinstaluj' : 'Zainstaluj'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Domains */}
          {activeTab === 'domains' && (
            <div className="max-w-xl space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ustawienia domenowe</h3>
                </CardHeader>
                <CardBody>
                  {domainsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateDomain} className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Domyślny adres poddomeny</label>
                        <Input type="text" value={primaryDomain} disabled className="opacity-60 bg-white/5 border-dashed" />
                        <span className="text-[9px] text-slate-600 block mt-1">Każdy sklep otrzymuje bezpłatną, chronioną poddomenę z certyfikatem SSL.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Domena Własna (Custom Domain)</label>
                        <Input
                          type="text"
                          value={customDomain}
                          onChange={e => setCustomDomain(e.target.value)}
                          placeholder="twoj-sklep.pl"
                        />
                        <span className="text-[9px] text-slate-600 block mt-1">Po zbindowaniu skieruj rekord A na 76.76.21.21 lub CNAME na cname.vercel-dns.com.</span>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                          Przypisz domenę
                        </Button>
                      </div>
                    </form>
                  )}
                </CardBody>
              </Card>

              <div className="p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 flex items-start gap-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Certyfikat SSL (Auto-Let&apos;s Encrypt)</h4>
                  <p className="text-xs text-slate-400">
                    Certyfikat SSL jest automatycznie generowany i odnawiany dla każdej podłączonej domeny w czasie rzeczywistym.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Publish */}
          {activeTab === 'publish' && (
            <Card className="max-w-xl">
              <CardHeader>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publikacja witryny</h3>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge variant={currentPubStatus === 'PUBLISHED' ? 'success' : 'default'} dot>
                    {currentPubStatus === 'PUBLISHED' ? 'Opublikowano (Live)' : 'Szkic lokalny'}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {currentPubStatus === 'PUBLISHED'
                      ? 'Witryna jest w pełni dostępna na krawędzi CDN w czasie rzeczywistym.'
                      : 'Wszystkie zmiany są widoczne wyłącznie w podglądzie.'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Stan kompilacji:</span>
                    <span className="font-bold text-white">{currentPubStatus === 'PUBLISHED' ? 'Kompletny' : 'Zmodyfikowany (Oczekuje na wdrożenie)'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Bramka Edge CDN:</span>
                    <span className="font-bold text-emerald-400">Połączono</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Button onClick={handleTriggerPublish} loading={saving} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-lg transition-all text-white font-bold rounded-xl py-3 text-sm">
                    {saving ? 'Wdrażanie na serwery...' : 'Wdróż i Publikuj Nową Wersję'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Product Modal */}
      <Modal open={showProductModal} onClose={() => { setShowProductModal(false); setEditingProduct(null); setNewProduct({ name: '', description: '', price: 0, images: [] }) }}>
        <div className="p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-white mb-4">{editingProduct ? 'Edytuj Produkt' : 'Nowy Produkt'}</h3>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nazwa</label>
              <Input type="text" value={editingProduct?.name || newProduct.name} onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Opis</label>
              <Input type="text" value={editingProduct?.description || newProduct.description} onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cena (w groszach)</label>
              <Input type="number" value={editingProduct?.price || newProduct.price} onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, price: parseInt(e.target.value)}) : setNewProduct({...newProduct, price: parseInt(e.target.value)})} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zdjęcia (URL, po przecinku)</label>
              <Input type="text" value={(editingProduct?.images || newProduct.images).join(', ')} onChange={(e) => {
                const imgs = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                editingProduct ? setEditingProduct({...editingProduct, images: imgs}) : setNewProduct({...newProduct, images: imgs})
              }} placeholder="https://example.com/img1.jpg" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowProductModal(false); setEditingProduct(null); setNewProduct({ name: '', description: '', price: 0, images: [] }) }} className="flex-1">
                Anuluj
              </Button>
              <Button type="submit" loading={saving} className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600">
                {editingProduct ? 'Zapisz zmiany' : 'Dodaj produkt'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </PageContainer>
  )
}