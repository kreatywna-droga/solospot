// AssetPicker.tsx
// C8.7: Media Manager — builder integration

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Image as ImageIcon, Upload, Loader2, Link2, Check } from 'lucide-react'
import { MediaAsset, MediaDocument } from '../../../packages/asset-manager-core/src/AssetTypes'

interface AssetPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: MediaAsset & { publicUrl?: string }) => void
  document?: MediaDocument
  storeId?: string
  accept?: string[]
}

interface ApiAssetItem {
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

export function AssetPicker({ isOpen, onClose, onSelect, storeId, accept }: AssetPickerProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [assets, setAssets] = useState<ApiAssetItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [customUrl, setCustomUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAssets = useCallback(async () => {
    if (!storeId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/assets`)
      const data = await res.json()
      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets)
      }
    } catch (err: any) {
      console.error('Failed to load assets in picker:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    if (isOpen && storeId) {
      loadAssets()
    }
  }, [isOpen, storeId, loadAssets])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !storeId) return
    setUploading(true)
    setUploadError(null)

    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/stores/${storeId}/assets`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Błąd uploadu')
      }

      await loadAssets()
      setActiveTab('library')
      // Auto select the newly uploaded asset
      handleSelectAsset(data.asset)
    } catch (err: any) {
      setUploadError(err.message || 'Błąd uploadu')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSelectAsset = (item: ApiAssetItem) => {
    const mediaAsset: MediaAsset & { publicUrl?: string } = {
      id: item.id,
      name: item.originalName,
      type: (item.type as any) || 'image',
      storageKey: item.storagePath,
      metadata: {
        fileSize: item.size,
        mimeType: item.mimeType,
        publicUrl: item.publicUrl,
      },
      publicUrl: item.publicUrl,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }
    onSelect(mediaAsset)
    onClose()
  }

  const handleSelectCustomUrl = () => {
    if (!customUrl.trim()) return
    const id = `ext_${Date.now()}`
    const mediaAsset: MediaAsset & { publicUrl?: string } = {
      id,
      name: 'Custom URL',
      type: 'image',
      storageKey: customUrl,
      metadata: {
        mimeType: 'image/jpeg',
        publicUrl: customUrl,
      },
      publicUrl: customUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSelect(mediaAsset)
    onClose()
  }

  if (!isOpen) return null

  const filteredAssets = assets.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return a.originalName.toLowerCase().includes(q) || a.filename.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl h-[75vh] bg-[#0c0c16] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#080810]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">Wybierz obraz</h2>
            {/* Tabs */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => setActiveTab('library')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'library' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Biblioteka ({assets.length})
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'upload' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wgraj plik
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'url' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Zewnętrzny URL
              </button>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Library */}
        {activeTab === 'library' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search */}
            <div className="px-5 py-2.5 border-b border-white/10 bg-[#080810]/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Szukaj obrazów po nazwie..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-violet-400" />
                  <span className="text-xs">Ładowanie biblioteki...</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-300 mb-1">Brak obrazów w bibliotece</p>
                  <p className="text-[11px] text-slate-500 mb-3">Wgraj nowy obraz z dysku, aby go użyć</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
                  >
                    Wgraj obraz
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredAssets.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAsset(item)}
                      className="group relative aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/20 transition-all flex flex-col"
                    >
                      <div className="flex-1 overflow-hidden bg-black/40 flex items-center justify-center">
                        <img
                          src={item.publicUrl}
                          alt={item.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-1.5 bg-[#080810] border-t border-white/5">
                        <p className="text-[10px] font-medium text-slate-300 truncate" title={item.originalName}>
                          {item.originalName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload */}
        {activeTab === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => handleFileUpload(e.target.files)}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md p-8 border-2 border-dashed border-white/20 hover:border-violet-500/80 rounded-2xl bg-white/[0.02] hover:bg-violet-500/5 cursor-pointer transition-all flex flex-col items-center justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-white">Wgrywanie pliku...</p>
                  <p className="text-[11px] text-slate-500 mt-1">Zapisywanie w bezpiecznym storage</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-violet-400 mb-3" />
                  <p className="text-xs font-semibold text-white mb-1">Kliknij tutaj, aby wybrać plik z dysku</p>
                  <p className="text-[11px] text-slate-500">Obsługiwane: JPG, PNG, WebP, SVG, GIF (maks. 15MB)</p>
                </>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-red-400 mt-4 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                {uploadError}
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'url' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-left">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Adres URL obrazu (HTTPS)
              </label>
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 font-mono"
                />
              </div>

              {customUrl.trim() && (
                <div className="mb-4 aspect-video rounded-lg bg-black/40 overflow-hidden border border-white/10 flex items-center justify-center">
                  <img src={customUrl} alt="Podgląd" className="w-full h-full object-cover" />
                </div>
              )}

              <button
                onClick={handleSelectCustomUrl}
                disabled={!customUrl.trim()}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Użyj tego adresu URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
