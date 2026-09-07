'use client'

/**
 * MediaPickerModal — Universal Asset & Media Picker Dialog
 *
 * Used throughout the Builder whenever an image, video, background, or icon
 * property is selected for insertion or replacement.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Upload, Search, Image as ImageIcon,
  Check, Loader2, Sparkles, Filter, AlertCircle,
  ExternalLink, Globe, Grid, Copy, FileText,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'

interface AssetItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  storagePath: string
  publicUrl: string
  type: string
  createdAt: string
}

// Built-in SoloSpot Curated Stock Assets (High-Res CDN demos)
const CURATED_LIBRARY: Array<{ id: string; name: string; url: string; category: string }> = [
  { id: 'lib_1', name: 'Nowoczesny E-commerce Studio', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', category: 'fashion' },
  { id: 'lib_2', name: 'Minimalistyczny Produkt', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', category: 'products' },
  { id: 'lib_3', name: 'Kolekcja Odzieży', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', category: 'fashion' },
  { id: 'lib_4', name: 'Eleganckie Wnętrze & Design', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', category: 'interiors' },
  { id: 'lib_5', name: 'Technologia & Gadżety', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80', category: 'tech' },
  { id: 'lib_6', name: 'Kosmetyki & Pielęgnacja', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80', category: 'beauty' },
  { id: 'lib_7', name: 'Kawa & Kawiarnia', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80', category: 'food' },
  { id: 'lib_8', name: 'Abstrakcyjne Tło Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', category: 'abstract' },
]

interface MediaPickerModalProps {
  isOpen?: boolean
  title?: string
  currentValue?: string
  slotType?: string
  onSelect: (url: string, asset?: any) => void
  onClose: () => void
}

export function MediaPickerModal({
  title = 'Wybierz Media',
  currentValue = '',
  slotType = 'IMAGE',
  onSelect,
  onClose,
}: MediaPickerModalProps) {
  const { document } = useBuilder()
  const storeId = document.id || document.tenantId

  const [activeTab, setActiveTab] = useState<'my_files' | 'library' | 'shutterstock' | 'upload' | 'url'>('my_files')
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [shutterstockAssets, setShutterstockAssets] = useState<any[]>([])
  const [shutterstockLoading, setShutterstockLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customUrl, setCustomUrl] = useState(currentValue)
  const [selectedUrl, setSelectedUrl] = useState<string>(currentValue)
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAssets = useCallback(async () => {
    if (!storeId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/stores/${storeId}/assets`)
      const data = await res.json()
      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets)
      }
    } catch (err) {
      console.error('Failed to load assets:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  const searchShutterstock = useCallback(async (query: string) => {
    try {
      setShutterstockLoading(true)
      const isVideo = slotType === 'VIDEO' || slotType === 'BACKGROUND_VIDEO'
      const res = await fetch(`/api/assets/shutterstock/search?query=${encodeURIComponent(query)}&type=${isVideo ? 'video' : 'image'}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.assets)) {
        setShutterstockAssets(data.assets)
      }
    } catch (err) {
      console.error('Failed to search Shutterstock:', err)
    } finally {
      setShutterstockLoading(false)
    }
  }, [slotType])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  useEffect(() => {
    if (activeTab === 'shutterstock') {
      searchShutterstock(searchQuery || 'luxury')
    }
  }, [activeTab, searchQuery, searchShutterstock])

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !storeId) return
    setUploading(true)
    setUploadError(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`/api/stores/${storeId}/assets`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Błąd uploadu')
        if (data.asset?.publicUrl) {
          setSelectedUrl(data.asset.publicUrl)
          setSelectedAsset(data.asset)
        }
      }
      await loadAssets()
      setActiveTab('my_files')
    } catch (err: any) {
      setUploadError(err.message || 'Błąd podczas wgrywania pliku')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirm = async () => {
    let finalUrl = selectedUrl
    let finalAsset = selectedAsset

    if (activeTab === 'url' && customUrl.trim()) {
      finalUrl = customUrl.trim()
    } else if (activeTab === 'shutterstock' && selectedAsset) {
      // License Shutterstock asset via API
      try {
        const res = await fetch('/api/assets/shutterstock/license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId: selectedAsset.id,
            tenantId: document.tenantId || 'tenant_default',
            storeId: document.id || 'store_default',
            type: selectedAsset.type,
            previewUrl: selectedAsset.previewUrl,
            sourceUrl: selectedAsset.sourceUrl,
            title: selectedAsset.title,
            author: selectedAsset.author,
          }),
        })
        const data = await res.json()
        if (data.success && data.asset) {
          finalAsset = data.asset
          finalUrl = data.asset.sourceUrl || data.asset.previewUrl
        }
      } catch (err) {
        console.warn('Sandbox licensing error, proceeding with selected asset:', err)
      }
    }

    if (finalUrl) {
      onSelect(finalUrl, finalAsset)
    }
    onClose()
  }

  const filteredAssets = assets.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.originalName.toLowerCase().includes(q) || a.filename.toLowerCase().includes(q)
  })

  const filteredLibrary = CURATED_LIBRARY.filter(item => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-[#0c0c16] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          multiple
          accept="image/*,video/*"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#27272A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-[#8B5CF6]/25 flex items-center justify-center text-violet-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-zinc-400">Wybierz obraz z biblioteki, Shutterstock Sandbox lub wgraj z dysku</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/[0.08] bg-[#202024]">
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/5">
            {[
              { id: 'my_files', label: 'Moje pliki', count: assets.length },
              { id: 'library', label: 'SoloSpot Library', count: CURATED_LIBRARY.length },
              { id: 'shutterstock', label: 'Shutterstock (Sandbox)', badge: 'PREMIUM' },
              { id: 'upload', label: 'Wgraj z dysku' },
              { id: 'url', label: 'Link URL' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] opacity-70">({tab.count})</span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {(activeTab === 'my_files' || activeTab === 'library' || activeTab === 'shutterstock') && (
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'shutterstock' ? "Szukaj w Shutterstock..." : "Szukaj grafik..."}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#04040a]">
          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Tab: My Files */}
          {activeTab === 'my_files' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-2" />
                <span className="text-xs">Ładowanie plików...</span>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-zinc-300 mb-1">Brak wgranych plików</p>
                <p className="text-[11px] text-zinc-500 mb-4">Wgraj grafikę z dysku lub wybierz z biblioteki SoloSpot / Shutterstock</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
                >
                  Wgraj pierwszy plik
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredAssets.map(asset => {
                  const isSelected = selectedUrl === asset.publicUrl

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setSelectedUrl(asset.publicUrl)
                        setSelectedAsset(asset)
                      }}
                      className={`group relative aspect-square rounded-xl border overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? 'border-violet-500 ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/20'
                          : 'border-white/[0.08] hover:border-white/25 bg-white/[0.04]'
                      }`}
                    >
                      <img
                        src={asset.publicUrl}
                        alt={asset.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-[10px] text-white font-medium truncate">{asset.originalName}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Tab: Curated SoloSpot Library */}
          {activeTab === 'library' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredLibrary.map(item => {
                const isSelected = selectedUrl === item.url

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedUrl(item.url)
                      setSelectedAsset({
                        id: item.id,
                        provider: 'solospot',
                        providerAssetId: item.id,
                        type: 'image',
                        previewUrl: item.url,
                        sourceUrl: item.url,
                        title: item.name,
                      })
                    }}
                    className={`group relative aspect-video rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-violet-500 ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/20'
                        : 'border-white/[0.08] hover:border-white/25 bg-white/[0.04]'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-xs text-white font-semibold truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-400 capitalize">{item.category}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab: Shutterstock Sandbox */}
          {activeTab === 'shutterstock' && (
            shutterstockLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
                <span className="text-xs">Przeszukiwanie Shutterstock Sandbox...</span>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-200">Shutterstock Premium Licensing Sandbox</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono">Sandbox Mode — Zero Credits Used</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {shutterstockAssets.map(item => {
                    const isSelected = selectedAsset?.id === item.id || selectedUrl === (item.sourceUrl || item.previewUrl)

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedUrl(item.sourceUrl || item.previewUrl)
                          setSelectedAsset(item)
                        }}
                        className={`group relative aspect-video rounded-xl border overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/20'
                            : 'border-white/[0.08] hover:border-white/25 bg-white/[0.04]'
                        }`}
                      >
                        {item.type === 'video' ? (
                          <video
                            src={item.previewUrl}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                          <p className="text-xs text-white font-bold truncate">{item.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                            <span className="truncate">{item.author}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px]">
                              Shutterstock
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          )}

          {/* Tab: Direct Upload Zone */}
          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files)
              }}
              className="border-2 border-dashed border-white/20 hover:border-violet-500/60 rounded-2xl p-12 text-center cursor-pointer transition-colors bg-white/[0.02] flex flex-col items-center justify-center h-64"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                  <p className="text-xs text-white font-semibold">Wgrywanie pliku na serwer...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-[#8B5CF6]/25 flex items-center justify-center text-violet-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Przeciągnij i upuść pliki tutaj</h4>
                  <p className="text-xs text-zinc-400 mb-4">Obsługiwane formaty: PNG, JPG, WebP, SVG, MP4</p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20"
                  >
                    Wybierz z dysku
                  </button>
                </>
              )}
            </div>
          )}

          {/* Tab: Direct URL Input */}
          {activeTab === 'url' && (
            <div className="max-w-xl mx-auto py-8 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Bezpośredni adres URL do grafiki lub wideo:
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => {
                    setCustomUrl(e.target.value)
                    setSelectedUrl(e.target.value)
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {customUrl && (
                <div className="border border-white/[0.08] rounded-xl p-3 bg-black/40">
                  <p className="text-[11px] text-zinc-400 mb-2 font-medium">Podgląd:</p>
                  <div className="max-h-48 flex items-center justify-center overflow-hidden rounded-lg bg-black/60">
                    <img
                      src={customUrl}
                      alt="Preview"
                      className="max-h-48 object-contain"
                      onError={e => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#27272A] flex items-center justify-between">
          <div className="text-xs text-zinc-400 truncate max-w-sm">
            {selectedUrl ? (
              <span className="text-[#A78BFA] font-mono text-[11px] truncate">Wybrano: {selectedUrl.slice(0, 45)}...</span>
            ) : (
              <span>Wybierz element, aby wstawić go do projektu</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-semibold"
            >
              Anuluj
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedUrl && !customUrl}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-lg hover:shadow-violet-600/20 text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              Wstaw do sekcji
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
