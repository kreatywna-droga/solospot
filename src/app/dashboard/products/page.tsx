'use client'

import { useEffect, useState } from 'react'
import { Plus, Package, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface ProductData {
  id: string
  name: string
  description: string
  price: number
  currency: string
  images: string[]
  status: string
  storeId: string | null
  createdAt: string
}

function statusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success" dot>AKTYWNY</Badge>
    case 'DRAFT': return <Badge variant="warning" dot>SZKIC</Badge>
    case 'ARCHIVED': return <Badge variant="danger" dot>ZARCHIWIZOWANY</Badge>
    default: return <Badge variant="default" dot>{status}</Badge>
  }
}

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { PLN: 'zł', EUR: '€', USD: '$', GBP: '£' }
  const sym = symbols[currency] || currency
  return `${(price / 100).toFixed(2)} ${sym}`
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.status === 403) { setError('Zaloguj się, aby zarządzać produktami'); return }
      const d = await res.json()
      if (!d.success) { setError(d.error || 'Nie udało się załadować produktów'); return }
      setProducts(d.products)
    } catch { setError('Błąd połączenia z serwerem') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const priceInCents = Math.round(parseFloat(newPrice || '0') * 100)
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          price: priceInCents,
          description: newDescription || undefined,
        }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error || 'Nie udało się utworzyć produktu'); return }
      setShowCreate(false)
      setNewName(''); setNewPrice(''); setNewDescription('')
      await load()
    } catch { alert('Błąd podczas tworzenia produktu') }
    finally { setCreating(false) }
  }

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
        title="Produkty"
        description="Zarządzaj produktami w swoim sklepie"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Dodaj produkt
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="Brak produktów"
          description="Dodaj pierwszy produkt, aby rozpocząć sprzedaż."
          action={{ label: 'Dodaj produkt', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid gap-4">
          {products.map((p) => (
            <Card key={p.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-white/5 flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{p.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-bold text-emerald-300">{formatPrice(p.price, p.currency)}</span>
                      {p.description && (
                        <span className="truncate max-w-[200px]">{p.description}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {statusBadge(p.status)}
                  <Link
                    href={`/dashboard/products/${p.id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Edytuj →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nowy produkt">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nazwa produktu
            </label>
            <Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nazwa produktu" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cena (PLN)
            </label>
            <Input type="number" step="0.01" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="99.00" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Opis
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Krótki opis produktu"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0e] text-white placeholder:text-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Anuluj
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              {creating ? 'Tworzenie...' : 'Dodaj produkt'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  )
}
