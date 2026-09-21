'use client'

/**
 * BuilderBottomBar — C16.2 Bottom Bar
 *
 *   [🔍 100% ▼]    [Strony][Warstwy][Komponenty][Media][Styl][AI][Historia]
 *
 * Zoom controls on the left, centered navigation tabs, and the removed
 * Preview/History/AI/Publish actions now live in the top bar.
 */

import { useCallback } from 'react'
import {
  ZoomIn, ZoomOut, PanelLeft, Layers, Plus, ImageIcon, Palette, Bot, History,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'

interface BuilderBottomBarProps {
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
}

const TABS: { id: StudioTab; label: string; icon: React.ElementType; shortcut: string }[] = [
  { id: 'pages',      label: 'Strony',     icon: PanelLeft,   shortcut: 'Ctrl+1' },
  { id: 'layers',     label: 'Warstwy',    icon: Layers,      shortcut: 'Ctrl+2' },
  { id: 'components', label: 'Komponenty', icon: Plus,        shortcut: 'Ctrl+3' },
  { id: 'assets',     label: 'Media',      icon: ImageIcon,   shortcut: 'Ctrl+4' },
  { id: 'style',      label: 'Styl',       icon: Palette,     shortcut: 'Ctrl+5' },
  { id: 'ai',         label: 'AI',         icon: Bot,         shortcut: 'Ctrl+6' },
  { id: 'history',    label: 'Historia',   icon: History,     shortcut: 'Ctrl+7' },
]

export function BuilderBottomBar({ activeTab, onTabChange }: BuilderBottomBarProps) {
  const { canvas, dispatch } = useBuilder()
  const zoom = canvas.zoom

  const setZoom = useCallback((z: number) => {
    dispatch({ type: 'CANVAS', action: { type: 'SET_ZOOM', zoom: z } })
  }, [dispatch])

  const zoomPresets = [
    { label: 'Dopasuj', value: 0 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1.0 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
  ]

  return (
    <div className="h-10 flex items-center px-4 border-t border-[#1A1F2E]
                    bg-[#080B10] backdrop-blur-sm flex-shrink-0 z-20 select-none">
      {/* Left: Zoom */}
      <div className="flex items-center gap-1 flex-1">
        <button
          onClick={() => setZoom(Math.max(0.25, Math.round((zoom - 0.25) * 100) / 100))}
          className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="relative group">
          <button className="px-2 py-1 rounded-md text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all">
            {zoom === 0 || !zoom ? 'Dopasuj (Fit)' : `${Math.round(zoom * 100)}%`}
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block">
            <div className="bg-[#0D1118] border border-[#1A1F2E] rounded-xl p-1 shadow-2xl flex items-center gap-0.5">
              {zoomPresets.map(p => (
                <button
                  key={p.label}
                  onClick={() => setZoom(p.value)}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                      zoom === p.value ? 'bg-[#D9A86C]/15 text-[#F2C27F]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setZoom(Math.min(2.0, Math.round((zoom + 0.25) * 100) / 100))}
          className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Navigation Tabs */}
      <div className="flex items-center gap-0.5 bg-[#0D1118] rounded-xl p-0.5 border border-[#1A1F2E]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30 shadow-lg shadow-[#D9A86C]/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            title={`${tab.label} (${tab.shortcut})`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Right: spacer */}
      <div className="flex items-center justify-end flex-1" />
    </div>
  )
}

