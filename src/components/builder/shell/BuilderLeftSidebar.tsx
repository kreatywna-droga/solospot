'use client'

/**
 * BuilderLeftSidebar — Studio 2.0 Unified Left Sidebar
 *
 * Tab Panels:
 *   - pages:       PagesPanel (full multi-page manager + visual site map)
 *   - layers:      LayerTree (hierarchical section tree, nesting, drag & drop)
 *   - components:  ComponentPanel (10-category catalogue, search, drag & drop)
 *   - assets:      AssetsPanel (Unified Asset Hub, multi-category, uploads, filters)
 *   - style:       StylePanel (Global Design System, colors, typography, tokens, presets)
 *   - history:     HistoryPanel (Interactive chronological undo/redo timeline)
 *   - ai:          AiPanel (AI Assistant structured operations prompt)
 */

import { useState } from 'react'
import {
  History, Bot, RotateCcw, RotateCw,
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'
import { PagesPanel } from '../sidebar/PagesPanel'
import { LayerTree } from '../sidebar/LayerTree'
import { ComponentPanel } from '../sidebar/ComponentPanel'
import { AssetsPanel } from '../sidebar/AssetsPanel'
import { StylePanel } from '../sidebar/StylePanel'

// ---------------------------------------------------------------------------
// Left Sidebar Root
// ---------------------------------------------------------------------------

interface BuilderLeftSidebarProps {
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
  width?: number
}

export function BuilderLeftSidebar({ activeTab, onTabChange, width = 320 }: BuilderLeftSidebarProps) {
  const currentTab: StudioTab =
    ['pages', 'layers', 'components', 'assets', 'style', 'ai', 'history'].includes(activeTab)
      ? activeTab
      : 'layers'

  return (
    <aside
      style={{ width: `${width}px` }}
      className="border-r border-[#27272A] bg-[#202024] flex flex-col overflow-hidden flex-shrink-0 h-full select-none"
    >
      <div className="flex-1 overflow-hidden">
        {currentTab === 'pages' && <PagesPanel />}
        {currentTab === 'layers' && <LayerTree />}
        {currentTab === 'components' && <ComponentPanel onClose={() => onTabChange('layers')} />}
        {currentTab === 'assets' && <AssetsPanel />}
        {currentTab === 'style' && <StylePanel />}
        {currentTab === 'history' && <HistoryPanel />}
        {currentTab === 'ai' && <AiPanel />}
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// History Panel
// ---------------------------------------------------------------------------

function HistoryPanel() {
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()
  const { history } = useBuilder()
  const entries = history.entries

  return (
    <div className="flex flex-col h-full bg-[#202024] text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#8B5CF6]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Historia Zmian</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Cofnij (Ctrl+Z)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Cofnij</span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Ponów (Ctrl+Shift+Z)"
          >
            <RotateCw className="w-3 h-3" />
            <span>Ponów</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-xs text-center gap-2">
            <History className="w-8 h-8 opacity-30" />
            <span className="font-semibold text-zinc-400">Brak historii</span>
            <span className="text-[10px]">Wykonaj dowolną akcję edycyjną, aby zobaczyć oś czasu</span>
          </div>
        ) : (
          [...entries].reverse().map((entry, index) => {
            const isCurrent = index === 0

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all border ${
                  isCurrent
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-white shadow-md shadow-[#8B5CF6]/10'
                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-zinc-200">{entry.label}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('pl-PL') : ''}
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[9px] text-[#A78BFA] bg-[#8B5CF6]/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Aktualny
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="p-3 border-t border-white/[0.08] bg-[#1a1a1e] text-[11px] text-zinc-500 text-center">
        Zarejestrowano {entries.length} krok{entries.length === 1 ? '' : entries.length < 5 ? 'i' : 'ów'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Panel
// ---------------------------------------------------------------------------

function AiPanel() {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const { dispatch, canvas, document } = useBuilder()

  const handleQuickAction = (actionType: string) => {
    const activePage = document.pages.find(p => p.id === canvas.selectedPageId) || document.pages[0]
    if (!activePage) return

    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      if (actionType === 'add_hero') {
        dispatch({
          type: 'ADD_SECTION',
          pageId: activePage.id,
          sectionType: 'hero',
          defaultProps: {
            title: 'Nowoczesny Sklep Przyszłości',
            subtitle: 'Wygenerowano przez SoloSpot AI na podstawie Twojej branży.',
            cta: 'Zobacz produkty',
          },
          label: 'AI Wygenerowany Hero',
        })
      } else if (actionType === 'add_features') {
        dispatch({
          type: 'ADD_SECTION',
          pageId: activePage.id,
          sectionType: 'feature-grid',
          defaultProps: {
            title: 'Kluczowe Przewagi Naszej Oferty',
            f1: 'Automatyczna personalizacja 24/7',
            f2: 'Brak prowizji od transakcji',
            f3: 'Ekspresowa integracja w 1 klik',
          },
          label: 'AI Cechy i Korzyści',
        })
      }
    }, 600)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    handleQuickAction('add_hero')
    setPrompt('')
  }

  return (
    <div className="flex flex-col h-full bg-[#202024] text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#8B5CF6]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Asystent AI</h2>
        </div>
        <span className="text-[9px] text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/25 px-2 py-0.5 rounded-full font-bold">
          SOLOSPOT AI
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/15 to-fuchsia-600/[0.07] border border-[#8B5CF6]/25 space-y-2">
          <div className="flex items-center gap-2 text-[#A78BFA] font-bold text-xs">
            <Bot className="w-4 h-4" />
            <span>Generuj sekcje i treści za pomocą AI</span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Wpisz opis pożądanego układu lub skorzystaj z poniższych szybkich akcji, aby AI dodało zoptymalizowane sekcje do Twojej strony.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Szybkie operacje AI:</span>
          <div className="space-y-1.5">
            {[
              { id: 'add_hero', label: 'Stwórz nowoczesny Hero Banner', desc: 'Generuje tytuł, podtytuł i CTA dla Twojego sklepu' },
              { id: 'add_features', label: 'Wygeneruj sekcję Korzyści (Features)', desc: 'Dodaje 3 kluczowe unikalne zalety oferty' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleQuickAction(item.id)}
                disabled={generating}
                className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/[0.07] text-left transition-all group disabled:opacity-50"
              >
                <div className="font-semibold text-xs text-zinc-200 group-hover:text-[#A78BFA] transition-colors">
                  {item.label}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.08] bg-[#1a1a1e]">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Opisz sekcję, np. stwórz baner promocyjny..."
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]/50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || generating}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white disabled:opacity-40 transition-all shadow-md shadow-[#8B5CF6]/20"
          >
            {generating ? 'Generowanie...' : 'Wyślij'}
          </button>
        </div>
      </form>
    </div>
  )
}
