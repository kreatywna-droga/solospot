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
  PanelLeft, Layers, Plus, ImageIcon, Palette,
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'
import { PagesPanel } from '../sidebar/PagesPanel'
import { LayerTree } from '../sidebar/LayerTree'
import { ComponentPanel } from '../sidebar/ComponentPanel'
import { AssetsPanel } from '../sidebar/AssetsPanel'
import { StylePanel } from '../sidebar/StylePanel'
import { AiCopilotWorkspace } from '../ai/AiCopilotWorkspace'

// ---------------------------------------------------------------------------
// Left Sidebar Root
// ---------------------------------------------------------------------------

const TABS: { id: StudioTab; label: string; icon: React.ElementType; shortcut: string }[] = [
  { id: 'pages',      label: 'Strony',     icon: PanelLeft, shortcut: 'Ctrl+1' },
  { id: 'layers',     label: 'Warstwy',    icon: Layers,    shortcut: 'Ctrl+2' },
  { id: 'components', label: 'Komponenty', icon: Plus,      shortcut: 'Ctrl+3' },
  { id: 'assets',     label: 'Media',      icon: ImageIcon, shortcut: 'Ctrl+4' },
  { id: 'style',      label: 'Styl',       icon: Palette,   shortcut: 'Ctrl+5' },
  { id: 'ai',         label: 'AI',         icon: Bot,       shortcut: 'Ctrl+6' },
  { id: 'history',    label: 'Historia',   icon: History,   shortcut: 'Ctrl+7' },
]

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

  const actualWidth = currentTab === 'ai' ? Math.max(width, 360) : width

  return (
    <aside
      style={{ width: `${actualWidth}px` }}
      className="border-r border-[#2E2E33] bg-[#202024] flex flex-row overflow-hidden flex-shrink-0 h-full select-none"
    >
      {/* Vertical tab strip — ultra-compact so icons fit edge-to-edge */}
      <div className="w-[20px] bg-[#18181B] border-r border-[#2E2E33] flex flex-col items-center py-1 gap-0.5 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-all
              ${currentTab === tab.id
                ? 'bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30 shadow-sm shadow-[#D9A86C]/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            title={`${tab.label} (${tab.shortcut})`}
          >
            <tab.icon className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'pages' && <PagesPanel />}
        {currentTab === 'layers' && <LayerTree />}
        {currentTab === 'components' && <ComponentPanel onClose={() => onTabChange('layers')} />}
        {currentTab === 'assets' && <AssetsPanel />}
        {currentTab === 'style' && <StylePanel />}
        {currentTab === 'history' && <HistoryPanel />}
        {currentTab === 'ai' && <AiCopilotWorkspace />}
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
          <History className="w-4 h-4 text-[#D9A86C]" />
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
                    ? 'bg-[#D9A86C]/15 border-[#D9A86C]/30 text-white shadow-md shadow-[#D9A86C]/10'
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
                  <span className="text-[9px] text-[#F2C27F] bg-[#D9A86C]/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Aktualny
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="p-3 border-t border-white/[0.08] bg-[#18181B] text-[11px] text-zinc-500 text-center">
        Zarejestrowano {entries.length} krok{entries.length === 1 ? '' : entries.length < 5 ? 'i' : 'ów'}
      </div>
    </div>
  )
}
