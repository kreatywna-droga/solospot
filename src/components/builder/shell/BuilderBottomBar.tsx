'use client'

/**
 * BuilderBottomBar — C16.2 Bottom Bar
 *
 *   [● Desktop] [● Tablet] [● Mobile] | [🔍 100% ▼] |
 *   [👁 Preview] [📋 History] [🤖 AI] | [⚡ Publish]
 */

import { useCallback } from 'react'
import {
  ZoomIn, ZoomOut, Eye, History, Bot, Zap,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'

interface BuilderBottomBarProps {
  onSave?: () => void
  onPublish?: () => void
  saving?: boolean
  onTabChange?: (tab: StudioTab) => void
}

export function BuilderBottomBar({ onSave, onPublish, saving, onTabChange }: BuilderBottomBarProps = {}) {
  const { canvas, dispatch } = useBuilder()
  const zoom = canvas.zoom
  const isPreview = canvas.mode === 'PREVIEW' || canvas.runtimeMode === 'PREVIEW'

  const togglePreview = () => {
    dispatch({
      type: 'CANVAS',
      action: {
        type: 'SET_MODE',
        mode: isPreview ? 'SELECT' : 'PREVIEW',
      },
    })
  }

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
    <div className="h-10 flex items-center justify-between px-4 border-t border-[#1A1F2E]
                    bg-[#080B10] backdrop-blur-sm flex-shrink-0 z-20 select-none">
      {/* Left: Zoom */}
      <div className="flex items-center gap-1">
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
                      ? 'bg-[#D9A86C]/15 text-[#F2C27F]'
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

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all
            ${isPreview
              ? 'bg-[#D9A86C] text-[#080B10] font-semibold shadow-lg shadow-[#D9A86C]/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          title={isPreview ? 'Przełącz do trybu edycji' : 'Podgląd na żywo'}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPreview ? 'Tryb Edycji' : 'Podgląd'}</span>
        </button>
        <button
          onClick={() => onTabChange?.('history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          title="Historia zmian"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Historia</span>
        </button>
        <button
          onClick={() => onTabChange?.('ai')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          title="Asystent AI"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI</span>
        </button>
        <div className="w-px h-4 bg-white/[0.08]" />
        <button
          onClick={onPublish}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold
                     bg-gradient-to-r from-[#B8893A] to-[#D9A86C] text-[#080B10]
                     hover:shadow-lg hover:shadow-[#D9A86C]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          {saving ? 'Publikowanie...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}

