// ImageEditor.tsx
// C8.6: Media Manager — image editor

'use client'

import { useState, useRef, useCallback } from 'react'
import { MediaAsset, AssetMetadata } from '../../../packages/asset-manager-core/src/AssetTypes'
import { X, RotateCw, FlipHorizontal, FlipVertical, Check, Focus } from 'lucide-react'

interface ImageEditorProps {
  asset: MediaAsset
  onSave: (asset: MediaAsset, metadata: Partial<AssetMetadata>) => void
  onClose: () => void
}

type AspectRatio = 'free' | '1:1' | '16:9' | '4:3'

export function ImageEditor({ asset, onSave, onClose }: ImageEditorProps) {
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free')
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number }>(
    asset.metadata.focusPoint || { x: 0.5, y: 0.5 }
  )
  const [width, setWidth] = useState(asset.metadata.width || 800)
  const [height, setHeight] = useState(asset.metadata.height || 600)
  const [lockRatio, setLockRatio] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const handleFocusPoint = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setFocusPoint({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    })
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(r => (r + 90) % 360)
  }, [])

  const handleFlipH = useCallback(() => {
    setFlipH(f => !f)
  }, [])

  const handleFlipV = useCallback(() => {
    setFlipV(f => !f)
  }, [])

  const handleResize = useCallback((dimension: 'width' | 'height', value: number) => {
    if (!lockRatio) {
      if (dimension === 'width') setWidth(value)
      else setHeight(value)
      return
    }
    const ratio = width / height
    if (dimension === 'width') {
      setWidth(value)
      setHeight(Math.round(value / ratio))
    } else {
      setHeight(value)
      setWidth(Math.round(value * ratio))
    }
  }, [lockRatio, width, height])

  const handleSave = useCallback(() => {
    setIsSaving(true)
    const updatedMetadata: Partial<AssetMetadata> = {
      width,
      height,
      rotation,
      flipH,
      flipV,
      focusPoint,
      processedAt: new Date().toISOString(),
    }
    onSave(asset, updatedMetadata)
  }, [asset, width, height, rotation, flipH, flipV, focusPoint, onSave])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#0a0a14] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Edytor obrazu</h2>
            <p className="text-xs text-slate-500">{asset.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            <div
              ref={imageRef}
              onClick={handleFocusPoint}
              className="relative bg-white/5 rounded-xl overflow-hidden cursor-crosshair max-w-full max-h-full"
              style={{ aspectRatio: aspectRatio === 'free' ? undefined : aspectRatio.replace(':', '/') }}
            >
              <div
                className="bg-white/10 flex items-center justify-center transition-all"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl opacity-50">🖼️</div>
                </div>
              </div>
              <div
                className="absolute w-4 h-4 border-2 border-violet-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${focusPoint.x * 100}%`, top: `${focusPoint.y * 100}%` }}
              />
            </div>
          </div>

          <div className="w-72 border-l border-white/10 p-4 overflow-y-auto space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Transformacje</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRotate}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  Obrót
                </button>
                <button
                  onClick={handleFlipH}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${flipH ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  H
                </button>
                <button
                  onClick={handleFlipV}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${flipV ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <FlipVertical className="w-4 h-4" />
                  V
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Rozmiar</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Szerokość</label>
                  <input
                    type="number"
                    value={width}
                    onChange={e => handleResize('width', parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Wysokość</label>
                  <input
                    type="number"
                    value={height}
                    onChange={e => handleResize('height', parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockRatio}
                    onChange={e => setLockRatio(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-xs text-slate-400">Zablokuj proporcje</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Proporcje kadrowania</h3>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                {(['free', '1:1', '16:9', '4:3'] as AspectRatio[]).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                      aspectRatio === ratio ? 'bg-violet-500/20 text-violet-400' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {ratio === 'free' ? 'Wolne' : ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1">
                <Focus className="w-4 h-4" />
                Punkt skupienia
              </h3>
              <p className="text-[11px] text-slate-500 mb-2">Kliknij na podglądzie aby ustawić punkt skupienia</p>
              <div className="bg-white/5 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">X</span>
                  <span className="text-white">{focusPoint.x.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Y</span>
                  <span className="text-white">{focusPoint.y.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
