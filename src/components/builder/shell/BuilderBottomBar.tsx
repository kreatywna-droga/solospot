'use client'

/**
 * BuilderBottomBar — C16.2 Bottom Bar
 *
 *   [● Desktop] [● Tablet] [● Mobile] | [🔍 100% ▼] |
 *   [👁 Preview] [📋 History] [🤖 AI] | [⚡ Publish]
 */

import { useCallback } from 'react'
import {
  Monitor, Tablet, Smartphone,
  ZoomIn, ZoomOut, Eye, History, Bot, Zap,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { VIEWPORT_PRESETS, ViewportLabel } from '../../../../packages/builder-core/src/CanvasState'
import type { StudioTab } from './BuilderTopBar'

interface BuilderBottomBarProps {
  onSave?: () => void
  onPublish?: () => void
  saving?: boolean
  onTabChange?: (tab: StudioTab) => void
}

export function BuilderBottomBar({ onSave, onPublish, saving, onTabChange }: BuilderBottomBarProps = {}) {
  const { canvas, dispatch } = useBuilder()
  const currentViewport = canvas.viewport.label
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

  const setViewport = useCallback((label: ViewportLabel) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS[label] },
    })
  }, [dispatch])

  const setZoom = useCallback((z: number) => {
    dispatch({ type: 'CANVAS', action: { type: 'SET_ZOOM', zoom: z } })
  }, [dispatch])

  const zoomPresets = [50, 75, 100, 125, 150, 200]

  return (
    <div className="h-10 flex items-center justify-between px-4 border-t border-white/10
                    bg-[#050508]/80 backdrop-blur-sm flex-shrink-0 z-20 select-none">
      {/* Left: Responsive switcher */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mr-1">Responsive</span>
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          {(['DESKTOP', 'TABLET', 'MOBILE'] as ViewportLabel[]).map(label => (
            <button
              key={label}
              onClick={() => setViewport(label)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                ${currentViewport === label
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              {label === 'DESKTOP' && <Monitor className="w-3 h-3" />}
              {label === 'TABLET' && <Tablet className="w-3 h-3" />}
              {label === 'MOBILE' && <Smartphone className="w-3 h-3" />}
              <span className="hidden sm:inline">{label === 'DESKTOP' ? 'Desktop' : label === 'TABLET' ? 'Tablet' : 'Mobile'}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="relative group">
            <button className="px-2 py-1 rounded-md text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              {Math.round(zoom * 100)}%
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block">
              <div className="bg-[#0c0c14] border border-white/10 rounded-xl p-1 shadow-2xl flex items-center gap-0.5">
                {zoomPresets.map(p => (
                  <button
                    key={p}
                    onClick={() => setZoom(p / 100)}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all
                      ${Math.abs(zoom * 100 - p) < 1
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setZoom(Math.min(2.0, zoom + 0.25))}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all
            ${isPreview
              ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          title={isPreview ? 'Przełącz do trybu edycji' : 'Podgląd na żywo'}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPreview ? 'Tryb Edycji' : 'Podgląd'}</span>
        </button>
        <button
          onClick={() => onTabChange?.('history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title="Historia zmian"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Historia</span>
        </button>
        <button
          onClick={() => onTabChange?.('ai')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title="Asystent AI"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={onPublish}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold
                     bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white
                     hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          {saving ? 'Publikowanie...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}

