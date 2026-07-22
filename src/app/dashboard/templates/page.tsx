'use client'

import { useEffect, useState } from 'react'
import { LayoutTemplate, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Store } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface TemplateMeta {
  slug: string
  name: string
  category: string
  description: string
  price: number
  currency: string
  previewImage?: string
  features: string[]
}

interface StoreOption {
  id: string
  name: string
}

const categoryColors: Record<string, string> = {
  fashion: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
  beauty: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
  food: 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
  digital: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
}

const categoryLabels: Record<string, string> = {
  fashion: 'Moda',
  beauty: 'Uroda',
  food: 'Gastronomia',
  digital: 'Cyfrowe',
}

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { PLN: 'zł', EUR: '€', USD: '$' }
  const sym = symbols[currency] || currency
  return `${(price / 100).toFixed(2)} ${sym}`
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMeta | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [installResult, setInstallResult] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      try {
        const [tRes, sRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/stores'),
        ])
        if (tRes.status === 403 || sRes.status === 403) { setError('Zaloguj się'); return }
        const tData = await tRes.json()
        const sData = await sRes.json()
        if (!tData.success) { setError(tData.error); return }
        if (!sData.success) { setError(sData.error); return }
        setTemplates(tData.templates)
        setStores(sData.stores.map((s: any) => ({ id: s.id, name: s.name })))
      } catch { setError('Błąd połączenia z serwerem') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleInstall = async () => {
    if (!selectedTemplate || !selectedStoreId) return
    setInstalling(true)
    setInstallResult(null)
    try {
      const res = await fetch(`/api/stores/${selectedStoreId}/install-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateSlug: selectedTemplate.slug }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error); return }
      setInstallResult(`Szablon "${selectedTemplate.name}" został zainstalowany!`)
    } catch { alert('Błąd instalacji') }
    finally { setInstalling(false) }
  }

  const categories = ['all', ...new Set(templates.map((t) => t.category))]
  const filtered = filter === 'all' ? templates : templates.filter((t) => t.category === filter)

  if (loading) return <PageLoading />

  if (error) {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-red-400" />}
          title="Brak dostępu"
          description={error}
          action={{ label: 'Zaloguj się', onClick: () => window.location.href = '/login' }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Szablony sklepów"
        description="Wybierz gotowy szablon i stwórz profesjonalny sklep w kilka sekund"
      />

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${filter === cat
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
          >
            {cat === 'all' ? 'Wszystkie' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((t) => (
          <Card key={t.slug} hover className="overflow-hidden">
            <div className={`h-32 rounded-t-2xl bg-gradient-to-br ${categoryColors[t.category] || 'from-slate-500/20 to-slate-500/10'} border-b border-white/5 flex items-center justify-center -m-6 mb-0`}>
              <LayoutTemplate className="w-12 h-12 text-white/30" />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between mt-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <Badge variant="default">{categoryLabels[t.category] || t.category}</Badge>
                </div>
                <span className="text-lg font-bold text-emerald-300">{formatPrice(t.price, t.currency)}</span>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-400">{t.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {t.features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    {f}
                  </span>
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  setSelectedTemplate(t)
                  setSelectedStoreId(stores[0]?.id || '')
                  setInstallResult(null)
                }}
              >
                Zainstaluj szablon
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Modal
        open={!!selectedTemplate}
        onClose={() => { setSelectedTemplate(null); setInstallResult(null) }}
        title={`Instaluj: ${selectedTemplate?.name}`}
      >
        {installResult ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium">{installResult}</p>
            <p className="text-sm text-slate-400 mt-1">Branding i produkty zostały skonfigurowane.</p>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => { setSelectedTemplate(null); setInstallResult(null) }}>
                Zamknij
              </Button>
              <Button className="flex-1" onClick={() => {
                if (selectedStoreId) window.location.href = `/dashboard/stores/${selectedStoreId}`
              }}>
                <Store className="w-4 h-4" /> Przejdź do sklepu
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Wybierz sklep, do którego chcesz zainstalować ten szablon.</p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sklep</label>
              <Select
                options={stores.map((s) => ({ value: s.id, label: s.name }))}
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                placeholder="Wybierz sklep"
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
              <strong>Uwaga:</strong> Instalacja nadpisze branding sklepu i doda produkty.
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedTemplate(null)}>
                Anuluj
              </Button>
              <Button className="flex-1" loading={installing} disabled={!selectedStoreId} onClick={handleInstall}>
                {installing ? 'Instalowanie...' : 'Zainstaluj'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}
