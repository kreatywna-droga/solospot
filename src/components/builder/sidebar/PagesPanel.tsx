'use client'

/**
 * PagesPanel — Full Multi-page Management for SoloSpot Builder 2.0
 *
 * Capabilities:
 *   - Page listing & instant active page switching
 *   - Search & filtering
 *   - Add, duplicate, delete, rename, slug edit
 *   - Set Homepage
 *   - Folder & status organization
 *   - Per-page SEO title & description
 *   - Visual Site Map modal trigger
 */

import { useState } from 'react'
import {
  Globe, Plus, Search, MoreVertical, Copy, Trash2,
  Home, Edit3, Settings, Map, FileText, Check, AlertCircle, X,
  Folder, Eye, EyeOff, ShieldAlert,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { SiteMapModal } from './SiteMapModal'
import type { BuilderPage } from '../../../../packages/builder-core/src/BuilderDocument'

export function PagesPanel() {
  const { document, canvas, dispatch } = useBuilder()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSiteMap, setShowSiteMap] = useState(false)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState<BuilderPage | null>(null)
  const [menuOpenPageId, setMenuOpenPageId] = useState<string | null>(null)

  const activePageId = canvas.selectedPageId || document.pages[0]?.id

  const selectPage = (pageId: string) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: null, pageId },
    })
  }

  const handleCreatePage = () => {
    const nextNum = document.pages.length + 1
    const newId = `page_${Date.now()}`
    dispatch({
      type: 'ADD_PAGE',
      page: {
        id: newId,
        name: `Nowa strona ${nextNum}`,
        slug: `/strona-${nextNum}`,
        isHome: false,
        seo: { title: `Nowa strona ${nextNum}` },
      },
    })
    selectPage(newId)
  }

  const handleDuplicatePage = (pageId: string) => {
    dispatch({ type: 'DUPLICATE_PAGE', pageId })
    setMenuOpenPageId(null)
  }

  const handleDeletePage = (pageId: string) => {
    if (document.pages.length <= 1) {
      alert('Nie można usunąć jedynej strony w projekcie.')
      return
    }
    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę stronę wraz ze wszystkimi sekcjami?')
    if (!confirmed) return

    dispatch({ type: 'REMOVE_PAGE', pageId })
    const remaining = document.pages.filter(p => p.id !== pageId)
    if (remaining.length > 0) {
      selectPage(remaining[0].id)
    }
    setMenuOpenPageId(null)
  }

  const handleSetHome = (pageId: string) => {
    dispatch({ type: 'SET_HOME_PAGE', pageId })
    setMenuOpenPageId(null)
  }

  const filteredPages = document.pages.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full bg-[#06060c] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Strony</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
            {document.pages.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSiteMap(true)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Wizualna mapa witryny (Site Map)"
          >
            <Map className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCreatePage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20"
            title="Dodaj nową stronę"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowa</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Szukaj strony..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white
                       placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredPages.map(page => {
          const isActive = page.id === activePageId
          const isMenuOpen = menuOpenPageId === page.id

          return (
            <div
              key={page.id}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-violet-500/20 text-white border border-violet-500/30 shadow-md shadow-violet-500/10'
                  : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => selectPage(page.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Globe className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs truncate text-white flex items-center gap-1.5">
                    {page.name}
                    {page.isHome && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold uppercase">
                        Home
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{page.slug}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowSettingsModal(page)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Ustawienia SEO i parametry strony"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpenPageId(isMenuOpen ? null : page.id)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Context Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-6 z-40 w-40 bg-[#0e0e18] border border-white/15 rounded-xl shadow-2xl p-1 space-y-0.5">
                      {!page.isHome && (
                        <button
                          onClick={() => handleSetHome(page.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-slate-300 hover:bg-white/10 hover:text-white text-left"
                        >
                          <Home className="w-3 h-3 text-violet-400" />
                          <span>Ustaw jako główną</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicatePage(page.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-slate-300 hover:bg-white/10 hover:text-white text-left"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplikuj stronę</span>
                      </button>
                      <button
                        onClick={() => { setShowSettingsModal(page); setMenuOpenPageId(null) }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-slate-300 hover:bg-white/10 hover:text-white text-left"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Ustawienia / SEO</span>
                      </button>
                      {document.pages.length > 1 && (
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-red-400 hover:bg-red-500/10 text-left"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Usuń stronę</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer / Summary */}
      <div className="p-3 border-t border-white/10 bg-[#05050a] flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          <span>{document.pages.length} stron</span>
        </div>
        <button
          onClick={() => setShowSiteMap(true)}
          className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
        >
          <Map className="w-3 h-3" />
          <span>Mapa witryny</span>
        </button>
      </div>

      {/* Site Map Modal */}
      {showSiteMap && (
        <SiteMapModal
          onClose={() => setShowSiteMap(false)}
          onSelectPage={pageId => selectPage(pageId)}
        />
      )}

      {/* Page Settings & SEO Modal */}
      {showSettingsModal && (
        <PageSettingsModal
          page={showSettingsModal}
          onClose={() => setShowSettingsModal(null)}
        />
      )}
    </div>
  )
}

interface PageSettingsModalProps {
  page: BuilderPage
  onClose: () => void
}

function PageSettingsModal({ page, onClose }: PageSettingsModalProps) {
  const { dispatch } = useBuilder()
  const [name, setName] = useState(page.name)
  const [slug, setSlug] = useState(page.slug)
  const [title, setTitle] = useState(page.seo.title ?? '')
  const [description, setDescription] = useState(page.seo.description ?? '')

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_PAGE_META',
      pageId: page.id,
      name,
      slug,
    })
    dispatch({
      type: 'UPDATE_PAGE_SEO',
      pageId: page.id,
      seo: { title, description },
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0c0c16] border border-white/15 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-violet-400" />
            <span>Ustawienia strony: {page.name}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Nazwa strony</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Ścieżka URL (Slug)</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="pt-2 border-t border-white/10">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Meta SEO</h4>

            <div className="space-y-2">
              <div>
                <label className="block text-slate-400 mb-1">Tytuł SEO (Title)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="np. O nas | Mój Sklep"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Opis SEO (Meta Description)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Krótki opis strony dla wyszukiwarki Google..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20"
          >
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  )
}
