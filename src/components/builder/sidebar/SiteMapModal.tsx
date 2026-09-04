'use client'

/**
 * SiteMapModal — Visual Page Map & Site Structure Overview
 *
 * Provides a bird's-eye visual tree/card layout of all pages and their
 * respective section stacks (Header, Hero, Content, Footer, etc.).
 * Allows direct navigation, page switching, and section inspection.
 */

import { useState } from 'react'
import {
  X, Globe, Layers, Plus, ExternalLink,
  ChevronRight, Sparkles, ShoppingBag, Eye,
  Check, FileText, ArrowRight, LayoutGrid,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import type { BuilderPage, SectionNode } from '../../../../packages/builder-core/src/BuilderDocument'

interface SiteMapModalProps {
  onClose: () => void
  onSelectPage: (pageId: string) => void
}

export function SiteMapModal({ onClose, onSelectPage }: SiteMapModalProps) {
  const { document, canvas, dispatch } = useBuilder()
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null)

  const activePageId = canvas.selectedPageId || document.pages[0]?.id

  const handleNavigateToPage = (pageId: string, sectionId?: string) => {
    dispatch({
      type: 'CANVAS',
      action: {
        type: 'SELECT_SECTION',
        sectionId: sectionId ?? null,
        pageId,
      },
    })
    onSelectPage(pageId)
    onClose()
  }

  const handleAddPage = () => {
    const pageNumber = document.pages.length + 1
    const newPageId = `page_${Date.now()}`
    dispatch({
      type: 'ADD_PAGE',
      page: {
        id: newPageId,
        name: `Nowa strona ${pageNumber}`,
        slug: `/strona-${pageNumber}`,
        isHome: false,
        seo: {},
      },
    })
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: null, pageId: newPageId },
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[85vh] bg-[#0c0c16] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#080810]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Wizualna Mapa Witryny (Visual Site Map)</h2>
              <p className="text-xs text-slate-400">
                Struktura hierarchiczna i sekcje wszystkich stron w projekcie ({document.pages.length} stron)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj stronę</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Visual Page Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#06060c]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {document.pages.map(page => {
              const isActive = page.id === activePageId

              return (
                <div
                  key={page.id}
                  className={`flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isActive
                      ? 'bg-violet-950/20 border-violet-500/50 shadow-xl shadow-violet-500/10 ring-1 ring-violet-500/30'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Page Card Header */}
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Globe className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-2">
                          {page.name}
                          {page.isHome && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono font-bold uppercase">
                              Home
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{page.slug}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavigateToPage(page.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-600 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                      title="Otwórz stronę w edytorze"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Section Stack */}
                  <div className="flex-1 p-3 space-y-1.5 min-h-[160px] max-h-[260px] overflow-y-auto">
                    {page.sections.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-xs">
                        <Layers className="w-6 h-6 opacity-40 mb-1" />
                        <span>Brak sekcji na tej stronie</span>
                      </div>
                    ) : (
                      page.sections.map((section, idx) => (
                        <div
                          key={section.id}
                          onMouseEnter={() => setHoveredSectionId(section.id)}
                          onMouseLeave={() => setHoveredSectionId(null)}
                          onClick={() => handleNavigateToPage(page.id, section.id)}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer border transition-all ${
                            hoveredSectionId === section.id
                              ? 'bg-violet-500/20 border-violet-500/40 text-white'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-slate-500 w-4 text-center">
                              {idx + 1}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                            <span className="font-medium truncate">{section.label}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono hidden group-hover:block">
                            {section.type}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Page Card Footer */}
                  <div className="p-3 border-t border-white/5 bg-black/30 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{page.sections.length} sekcji</span>
                    <button
                      onClick={() => handleNavigateToPage(page.id)}
                      className="text-violet-400 hover:text-violet-300 font-medium hover:underline flex items-center gap-1"
                    >
                      <span>Edytuj stronę</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
