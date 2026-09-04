'use client'

/**
 * AssetsPanel — Unified Asset Hub (SoloSpot Builder 2.0)
 *
 * Full asset management:
 *   - Categories: Photos, Vectors, SVG, PNG, Videos, Illustrations, Templates, Motion, Icons, Logos
 *   - Sources: SoloSpot Library, External Providers, User Uploads, Generated Assets
 *   - Multi-file drag-and-drop uploads
 *   - Search & filters (type, source, orientation)
 *   - Preview modal, direct insertion into canvas, copy URL, deletion with usage checks
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload, Search, Filter, Trash2, Check, Copy, Loader2,
  AlertCircle, X, Image as ImageIcon, Video, FileText,
  Sparkles, Layers, Box, ExternalLink, Plus, Eye,
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

const ASSET_CATEGORIES = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'photos', label: 'Zdjęcia / Photos' },
  { id: 'svg', label: 'Wektory / SVG' },
  { id: 'png', label: 'Przezroczyste PNG' },
  { id: 'videos', label: 'Wideo' },
  { id: 'illustrations', label: 'Ilustracje' },
  { id: 'icons', label: 'Ikony' },
  { id: 'logos', label: 'Logotypy' },
]

export function AssetsPanel() {
  const { document, canvas, dispatch } = useBuilder()
  const storeId = document.id || document.tenantId

  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

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
        if (!data.success) {
          throw new Error(data.error || 'Błąd podczas wgrywania pliku')
        }
      }
      await loadAssets()
    } catch (err: any) {
      setUploadError(err.message || 'Błąd uploadu')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (asset: AssetItem, force = false) => {
    if (!storeId) return
    try {
      const url = `/api/stores/${storeId}/assets/${asset.id}${force ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        if (data.error?.startsWith('ASSET_IN_USE')) {
          const confirmForce = window.confirm(
            'Ten plik jest aktualnie używany w sekcjach sklepu. Czy na pewno chcesz wymusić jego usunięcie?'
          )
          if (confirmForce) {
            await handleDelete(asset, true)
            return
          }
        } else {
          alert(data.error || 'Nie udało się usunąć assetu')
        }
        return
      }
      setSelectedAsset(null)
      setDeleteConfirm(false)
      await loadAssets()
    } catch (err: any) {
      alert(err.message || 'Błąd podczas usuwania')
    }
  }

  const handleInsertIntoCanvas = (asset: AssetItem) => {
    const activePage = document.pages.find(p => p.id === canvas.selectedPageId) || document.pages[0]
    const selectedSectionId = canvas.selectedSectionId
    if (!activePage || !selectedSectionId) {
      alert('Najpierw zaznacz sekcję na płótnie roboczym, do której chcesz przypisać ten plik.')
      return
    }

    dispatch({
      type: 'UPDATE_PROPS',
      pageId: activePage.id,
      sectionId: selectedSectionId,
      props: { image: asset.publicUrl, src: asset.publicUrl, videoUrl: asset.publicUrl },
    })
    setSelectedAsset(null)
  }

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredAssets = assets.filter(a => {
    if (activeCategory === 'svg' && !a.mimeType.includes('svg')) return false
    if (activeCategory === 'png' && !a.mimeType.includes('png')) return false
    if (activeCategory === 'photos' && (a.type !== 'image' || a.mimeType.includes('svg'))) return false
    if (activeCategory === 'videos' && a.type !== 'video') return false
    if (activeCategory === 'icons' && !a.mimeType.includes('svg') && !a.filename.includes('icon')) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return a.originalName.toLowerCase().includes(q) || a.filename.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div
      className="flex flex-col h-full bg-[#06060c] text-white"
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files)
      }}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
        multiple
        accept="image/*,video/*"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Asset Hub</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
            {assets.length}
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20 disabled:opacity-50"
          title="Wgraj nowe pliki z dysku"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>Wgraj</span>
        </button>
      </div>

      {/* Error banner */}
      {uploadError && (
        <div className="m-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="p-0.5 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Szukaj plików..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white
                       placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-3 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/5 pb-2">
        {ASSET_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-3 relative">
        {isDragging && (
          <div className="absolute inset-2 rounded-xl border-2 border-dashed border-violet-500 bg-violet-600/20 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-8 h-8 text-violet-300 animate-bounce mb-2" />
            <p className="text-xs font-semibold text-white">Upuść pliki tutaj, aby wgrać</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-violet-400" />
            <span className="text-xs">Ładowanie mediów...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center px-4 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300 mb-1">Brak assetów w tej kategorii</p>
            <p className="text-[11px] text-slate-500 mb-4">
              Przeciągnij pliki tutaj lub użyj przycisku poniżej
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
            >
              Wgraj pliki
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group relative aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all flex flex-col"
              >
                <div className="flex-1 w-full overflow-hidden bg-black/40 flex items-center justify-center">
                  {asset.type === 'image' || asset.mimeType.includes('svg') ? (
                    <img
                      src={asset.publicUrl}
                      alt={asset.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : asset.type === 'video' ? (
                    <div className="flex flex-col items-center text-slate-400">
                      <Video className="w-6 h-6 text-violet-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold mt-1">Video</span>
                    </div>
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="p-1.5 bg-[#080810]/95 border-t border-white/5">
                  <p className="text-[10px] font-medium text-slate-300 truncate" title={asset.originalName}>
                    {asset.originalName}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    {(asset.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Preview Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-[#0c0c16] rounded-2xl border border-white/15 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs font-bold text-white truncate max-w-xs">
                {selectedAsset.originalName}
              </span>
              <button
                onClick={() => { setSelectedAsset(null); setDeleteConfirm(false) }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black/50 overflow-hidden max-h-64">
              {selectedAsset.type === 'image' || selectedAsset.mimeType.includes('svg') ? (
                <img
                  src={selectedAsset.publicUrl}
                  alt={selectedAsset.originalName}
                  className="max-h-56 max-w-full object-contain rounded-lg shadow-md"
                />
              ) : selectedAsset.type === 'video' ? (
                <video src={selectedAsset.publicUrl} controls className="max-h-56 max-w-full rounded-lg" />
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <FileText className="w-12 h-12 text-slate-500 mb-2" />
                  <span className="text-xs text-slate-400 font-mono">{selectedAsset.mimeType}</span>
                </div>
              )}
            </div>

            <div className="p-4 space-y-2 border-t border-white/10 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>Rozmiar: <span className="text-white font-mono font-medium">{(selectedAsset.size / 1024).toFixed(1)} KB</span></div>
                <div>Typ: <span className="text-white font-mono">{selectedAsset.mimeType}</span></div>
                <div>Wgrano: <span className="text-white">{new Date(selectedAsset.createdAt).toLocaleString('pl-PL')}</span></div>
                <div>ID: <span className="text-white font-mono text-[10px]">{selectedAsset.id.slice(0, 8)}...</span></div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  readOnly
                  value={selectedAsset.publicUrl}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopyUrl(selectedAsset.publicUrl, selectedAsset.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedId === selectedAsset.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="px-4 py-3 bg-[#080810] border-t border-white/10 flex items-center justify-between">
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-400">Potwierdzić?</span>
                  <button
                    onClick={() => handleDelete(selectedAsset)}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Tak, usuń
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded text-xs transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Usuń</span>
                </button>
              )}

              <button
                onClick={() => handleInsertIntoCanvas(selectedAsset)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20"
              >
                Wstaw do zaznaczonej sekcji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
