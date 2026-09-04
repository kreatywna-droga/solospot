'use client'

/**
 * BuilderLeftSidebar — C16.2 Left Sidebar
 *
 * Tab switcher: Pages | Layers | Assets | Components | History | AI
 * Each tab shows its respective panel content.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PanelLeft, Layers, ImageIcon, Plus,
  ChevronRight, GripVertical,
  Globe, Lock, Eye, EyeOff, FileText,
  Search, X, Upload, History, Bot,
  Trash2, Check, Copy, Loader2, AlertCircle,
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'
import { ComponentPanel } from '../sidebar/ComponentPanel'

// ---------------------------------------------------------------------------
// Left Sidebar Root
// ---------------------------------------------------------------------------

interface BuilderLeftSidebarProps {
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
}

export function BuilderLeftSidebar({ activeTab, onTabChange }: BuilderLeftSidebarProps) {
  const currentTab: StudioTab =
    ['pages', 'layers', 'assets', 'components', 'ai', 'history'].includes(activeTab)
      ? activeTab
      : 'layers'

  const tabs: { id: StudioTab; label: string; icon: React.ElementType }[] = [
    { id: 'pages',      label: 'Pages',      icon: PanelLeft },
    { id: 'layers',     label: 'Layers',     icon: Layers },
    { id: 'assets',     label: 'Assets',     icon: ImageIcon },
    { id: 'components', label: 'Komponenty', icon: Plus },
    { id: 'history',    label: 'Historia',   icon: History },
    { id: 'ai',         label: 'AI',         icon: Bot },
  ]

  return (
    <aside className="w-80 min-w-[320px] max-w-[380px] border-r border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0">
      {/* Tab switcher - 6 equal columns */}
      <div className="grid grid-cols-6 border-b border-white/10 bg-[#05050a]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-1 text-[9px] font-bold uppercase tracking-wider transition-all
              ${currentTab === tab.id
                ? 'text-white border-b-2 border-violet-500 bg-violet-500/10'
                : 'text-slate-500 hover:text-white hover:bg-white/5 border-b-2 border-transparent'
              }`}
            title={tab.label}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'pages' && <PagesPanel />}
        {currentTab === 'layers' && <LayersPanel />}
        {currentTab === 'assets' && <AssetsPanel />}
        {currentTab === 'components' && <ComponentPanel onClose={() => onTabChange('layers')} />}
        {currentTab === 'history' && <HistoryPanel />}
        {currentTab === 'ai' && <AiPanel />}
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Pages Panel — C16.4
// ---------------------------------------------------------------------------

function PagesPanel() {
  const { document, canvas, dispatch } = useBuilder()

  const selectPage = (pageId: string) => {
    dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null, pageId } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Pages</h2>
        <button className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {document.pages.map(page => {
          const isActive = canvas.selectedPageId
            ? page.id === canvas.selectedPageId
            : page.isHome

          return (
            <button
              key={page.id}
              onClick={() => selectPage(page.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all text-left group
                ${isActive
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{page.name}</div>
                <div className="text-[10px] text-slate-600 font-mono truncate">{page.slug}</div>
              </div>
              {page.isHome && (
                <span className="text-[9px] text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                  Home
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="p-3 border-t border-white/5">
        <div className="text-[10px] text-slate-600 flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {document.pages.length} page{document.pages.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Layers Panel — C16.3
// ---------------------------------------------------------------------------

function LayersPanel() {
  const { document, canvas, dispatch } = useBuilder()
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const activePage = document.pages.find(p =>
    canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
  ) ?? document.pages[0]

  const sections = activePage?.sections ?? []

  const selectSection = (sectionId: string) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId, pageId: activePage?.id ?? null },
    })
  }

  const toggleVisibility = (sectionId: string) => {
    if (!activePage) return
    dispatch({ type: 'TOGGLE_VISIBILITY', pageId: activePage.id, sectionId })
  }

  const toggleLock = (sectionId: string) => {
    if (!activePage) return
    dispatch({ type: 'TOGGLE_LOCK', pageId: activePage.id, sectionId })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (isNaN(fromIndex) || fromIndex === toIndex || !activePage) return
    dispatch({ type: 'MOVE_SECTION', pageId: activePage.id, fromIndex, toIndex })
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragOverIndex(null)
  }

  const typeColors: Record<string, string> = {
    hero: 'bg-violet-500',
    navbar: 'bg-blue-500',
    footer: 'bg-slate-500',
    'product-grid': 'bg-amber-500',
    gallery: 'bg-emerald-500',
    testimonials: 'bg-yellow-500',
    newsletter: 'bg-pink-500',
    content: 'bg-slate-400',
    container: 'bg-violet-300',
  }

  const typeColor = (type: string) => typeColors[type] || 'bg-slate-600'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Layers</h2>
        <span className="text-[10px] text-slate-600">{sections.length} items</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center gap-2">
            <Layers className="w-8 h-8 opacity-30" />
            <span>No layers yet</span>
            <span className="text-[10px]">Add a section from Components</span>
          </div>
        ) : (
          sections.map((node, index) => (
            <div
              key={node.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => selectSection(node.id)}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-xs select-none
                ${canvas.selectedSectionId === node.id
                  ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }
                ${!node.visible ? 'opacity-40' : ''}
                ${dragOverIndex === index ? 'border-t-2 border-t-violet-500' : ''}
              `}
            >
              {/* Color dot */}
              <span className={`w-2 h-2 rounded-full ${typeColor(node.type)} flex-shrink-0`} />

              {/* Drag handle */}
              <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />

              {/* Label */}
              <span className="flex-1 truncate font-medium">{node.label}</span>

              {/* Type badge */}
              <span className="text-[9px] text-slate-600 font-mono hidden group-hover:block">{node.type}</span>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(node.id) }}
                  className={`p-0.5 rounded ${node.locked ? 'text-amber-400' : 'text-slate-600 hover:text-white'} hover:bg-white/10 transition-colors`}
                >
                  <Lock className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(node.id) }}
                  className={`p-0.5 rounded ${!node.visible ? 'text-violet-400' : 'text-slate-600 hover:text-white'} hover:bg-white/10 transition-colors`}
                >
                  {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assets Panel — C16.5 (Production Asset Ecosystem Integration)
// ---------------------------------------------------------------------------

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

function AssetsPanel() {
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
    } catch (err: any) {
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
            'Ten obraz jest używany na stronie sklepu. Czy na pewno chcesz wymusić jego usunięcie?'
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
    const activePage = document.pages[0]
    const selectedSectionId = canvas.selectedSectionId
    if (!activePage || !selectedSectionId) {
      alert('Najpierw zaznacz sekcję na płótnie, do której chcesz wstawić ten obraz.')
      return
    }

    dispatch({
      type: 'UPDATE_PROPS',
      pageId: activePage.id,
      sectionId: selectedSectionId,
      props: { image: asset.publicUrl },
    })
    setSelectedAsset(null)
  }

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Category counts
  const imageCount = assets.filter(a => a.type === 'image' && !a.mimeType.includes('svg')).length
  const svgCount = assets.filter(a => a.mimeType.includes('svg')).length
  const videoCount = assets.filter(a => a.type === 'video').length
  const docCount = assets.filter(a => a.type === 'document').length

  // Filtered list
  const filteredAssets = assets.filter(a => {
    if (activeCategory === 'images' && (a.type !== 'image' || a.mimeType.includes('svg'))) return false
    if (activeCategory === 'svgs' && !a.mimeType.includes('svg')) return false
    if (activeCategory === 'videos' && a.type !== 'video') return false
    if (activeCategory === 'documents' && a.type !== 'document') return false
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
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Biblioteka Mediów</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
            {assets.length}
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
          title="Wgraj nowe pliki"
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
        {[
          { id: 'all', label: 'Wszystkie', count: assets.length },
          { id: 'images', label: 'Obrazy', count: imageCount },
          { id: 'svgs', label: 'SVG', count: svgCount },
          { id: 'videos', label: 'Wideo', count: videoCount },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            <span>{cat.label}</span>
            <span className="text-[9px] opacity-60">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Drag & Drop Overlay or Asset Grid */}
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
            <p className="text-xs font-semibold text-slate-300 mb-1">Brak assetów</p>
            <p className="text-[11px] text-slate-500 mb-4">
              Przeciągnij pliki tutaj lub użyj przycisku poniżej
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
            >
              Wgraj pierwszy plik
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
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
                      <ImageIcon className="w-6 h-6 text-violet-400" />
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
            {/* Modal Header */}
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

            {/* Modal Body: Image preview */}
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

            {/* Metadata info */}
            <div className="p-4 space-y-2 border-t border-white/10 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>Rozmiar: <span className="text-white font-mono font-medium">{(selectedAsset.size / 1024).toFixed(1)} KB</span></div>
                <div>Typ: <span className="text-white font-mono">{selectedAsset.mimeType}</span></div>
                <div>Wgrano: <span className="text-white">{new Date(selectedAsset.createdAt).toLocaleString('pl-PL')}</span></div>
                <div>ID: <span className="text-white font-mono text-[10px]">{selectedAsset.id.slice(0, 8)}...</span></div>
              </div>

              {/* Public URL row */}
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

            {/* Modal Actions */}
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
                Wstaw do wybranej sekcji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components Panel — delegates to the existing ComponentPanel
// ---------------------------------------------------------------------------

function ComponentsPanel() {
  return <ComponentPanel onClose={() => {}} />
}

// ---------------------------------------------------------------------------
// History Panel — C16.6
// ---------------------------------------------------------------------------

function HistoryPanel() {
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()
  const { history } = useBuilder()
  const entries = history.entries

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Historia</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Undo"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Redo"
          >
            Redo
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center gap-2">
            <History className="w-8 h-8 opacity-30" />
            <span>No history yet</span>
            <span className="text-[10px]">Start editing to see changes</span>
          </div>
        ) : (
          [...entries].reverse().map((entry, index) => {
            const isActive = index === 0
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all
                  ${isActive
                    ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                    : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.label}</div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}
                  </div>
                </div>
                {isActive && (
                  <span className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                    Current
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
      <div className="p-3 border-t border-white/5">
        <div className="text-[10px] text-slate-600 text-center">
          {entries.length} change{entries.length !== 1 ? 's' : ''} recorded
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Panel — C16.7
// ---------------------------------------------------------------------------

function AiPanel() {
  const [prompt, setPrompt] = useState('')
  const { dispatch } = useBuilder()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    // TODO: Wire to AI endpoint
    console.log('AI prompt:', prompt)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Assistant</h2>
        <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded font-medium">SOON</span>
      </div>

      {/* AI prompt area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center gap-2">
          <Bot className="w-8 h-8 opacity-30" />
          <span className="font-medium">AI Assistant</span>
          <span className="text-[10px] max-w-[200px]">
            Ask AI to help you build your store — generate sections, suggest layouts, optimize content
          </span>
        </div>
      </div>

      {/* Prompt input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white
                       placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="px-3 py-2 rounded-lg text-[10px] font-bold bg-violet-600 text-white
                       hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

