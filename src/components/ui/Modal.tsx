'use client'

import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#080a12] shadow-2xl
          animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
