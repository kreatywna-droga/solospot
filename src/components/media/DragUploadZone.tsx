// DragUploadZone.tsx
// C8.7.5: Asset UX Layer — drag and drop upload zone

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload } from 'lucide-react'

interface DragUploadZoneProps {
  onUpload: (files: File[]) => void
  children?: React.ReactNode
  disabled?: boolean
}

export function DragUploadZone({ onUpload, children, disabled = false }: DragUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    dragCounter.current++
    setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
  }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onUpload(files)
    }
  }, [disabled, onUpload])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (disabled) return
    const items = e.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      onUpload(files)
    }
  }, [disabled, onUpload])

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-violet-500/20 backdrop-blur-sm border-2 border-dashed border-violet-500/50 rounded-xl">
          <div className="text-center">
            <Upload className="w-12 h-12 text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Upuść pliki aby je dodać</p>
            <p className="text-xs text-slate-400 mt-1">Obsługiwane: JPG, PNG, WEBP, SVG</p>
          </div>
        </div>
      )}
    </div>
  )
}
