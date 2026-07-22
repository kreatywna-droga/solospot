'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Archive, Trash2, Image as ImageIcon } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
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
  updatedAt: string
}

const tabs = [
  { id: 'general', label: 'Ogólne' },
  { id: 'media', label: 'Zdjęcia' },
]

function statusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success" dot>AKTYWNY</Badge>
    case 'DRAFT': return <Badge variant="warning" dot>SZKIC</Badge>
    case 'ARCHIVED': return <Badge variant="danger" dot>ZARCHIWIZOWANY</Badge>
    default: return <Badge variant="default" dot>{status}</Badge>
  }
}

export default function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (res.status === 403) { setError('Brak dostępu'); return }
        const d = await res.json()
        if (!d.success) { setError(d.error || 'Nie udało się załadować produktu'); return }
        const p = d.product as ProductData
        setProduct(p)
        setName(p.name)
        setDescription(p.description)
        setPrice((p.price / 100).toFixed(2))
        setImages(p.images || [])
      } catch { setError('Błąd połączenia z serwerem') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const priceInCents = Math.round(parseFloat(price || '0') * 100)
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: priceInCents,
          images,
        }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error); return }
      setProduct(d.product)
      alert('Zapisano')
    } catch { alert('Błąd podczas zapisu') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (!d.success) { alert(d.error); return }
      setProduct(d.product)
    } catch { alert('Błąd') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno usunąć ten produkt?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!d.success) { alert(d.error); return }
      router.push('/dashboard/products')
    } catch { alert('Błąd podczas usuwania') }
    finally { setSaving(false) }
  }

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  if (loading) return <PageLoading />

  if (error || !product) {
    return (
      <PageContainer>
        <EmptyState
          title="Brak dostępu"
          description={error || 'Nie znaleziono produktu'}
          action={{ label: 'Powrót do produktów', onClick: () => router.push('/dashboard/products') }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={product.name}
        description={statusBadge(product.status)}
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-8" />

      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Szczegóły produktu</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nazwa
                </label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Cena ({product.currency})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Opis
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-[#0a0a0e] text-white placeholder:text-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </CardBody>
            <CardFooter>
              <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                Zapisz zmiany
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Status</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                {product.status === 'DRAFT' && (
                  <Button size="sm" onClick={() => handleStatusChange('ACTIVE')}>
                    Aktywuj produkt
                  </Button>
                )}
                {product.status === 'ACTIVE' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('ARCHIVED')}>
                    Archiwizuj
                  </Button>
                )}
                {product.status === 'ARCHIVED' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('DRAFT')}>
                    Przywróć jako szkic
                  </Button>
                )}
                <span className="text-xs text-slate-500">
                  Obecny: {statusBadge(product.status)}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Niebezpieczna strefa</h2>
            </CardHeader>
            <CardBody>
              <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />}>
                Usuń produkt
              </Button>
              <p className="text-xs text-slate-500 mt-2">Tej operacji nie można cofnąć.</p>
            </CardBody>
          </Card>
        </form>
      )}

      {activeTab === 'media' && (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Zdjęcia produktu</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {images.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-12 text-slate-500">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-sm">Brak zdjęć</span>
                  </div>
                ) : (
                  images.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5">
                      <img src={url} alt={`Zdjęcie ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
                <Button type="button" size="sm" onClick={addImage} disabled={!newImageUrl.trim()}>
                  Dodaj
                </Button>
              </div>
            </CardBody>
            <CardFooter>
              <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                Zapisz zmiany
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
