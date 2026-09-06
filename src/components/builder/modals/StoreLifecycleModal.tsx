'use client'

import React, { useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Power, Trash2, X, RefreshCw, ShieldAlert, Store as StoreIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StoreLifecycleModalProps {
  storeId: string
  storeName: string
  isOpen: boolean
  onClose: () => void
  initialStatus?: string
  onStatusChange?: (newStatus: 'ACTIVE' | 'DEACTIVATED') => void
}

export function StoreLifecycleModal({
  storeId,
  storeName,
  isOpen,
  onClose,
  initialStatus = 'ACTIVE',
  onStatusChange,
}: StoreLifecycleModalProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'ACTIVE' | 'DEACTIVATED'>(
    initialStatus === 'DEACTIVATED' ? 'DEACTIVATED' : 'ACTIVE'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Destructive delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!isOpen) return null

  const handleToggleStatus = async () => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    const targetStatus = status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE'

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się zmienić statusu sklepu')
      }

      setStatus(targetStatus)
      onStatusChange?.(targetStatus)
      setSuccessMsg(
        targetStatus === 'DEACTIVATED'
          ? 'Sklep został pomyślnie dezaktywowany. Twoje dane i konfiguracja są w pełni zachowane.'
          : 'Sklep został pomyślnie aktywowany.'
      )
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas zmiany statusu')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStore = async () => {
    if (deleteInput.trim() !== storeName.trim()) {
      setError('Wpisana nazwa sklepu nie zgadza się z nazwą oryginalną.')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się usunąć sklepu')
      }

      onClose()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Błąd podczas usuwania sklepu')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#202024] border border-[#2D2D32] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <StoreIcon className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cykl Życia Sklepu</h2>
              <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[280px]">{storeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-[#202024]">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Store Lifecycle Status (Deactivate / Activate) */}
          <div className="p-4 rounded-xl bg-[#27272A] border border-[#2D2D32] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-300">Bieżący stan sklepu:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`} />
                  <span className="text-sm font-bold tracking-wide">
                    {status === 'ACTIVE' ? 'AKTYWNY' : 'DEZAKTYWOWANY'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleStatus}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  status === 'ACTIVE'
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                <span>{status === 'ACTIVE' ? 'Dezaktywuj sklep' : 'Aktywuj sklep'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-[#2D2D32] pt-3">
              {status === 'ACTIVE' ? (
                'Dezaktywacja tymczasowo wstrzymuje widoczność sklepu dla klientów zewnętrznych. Wszystkie strony, produkty, zamówienia, multimedia i ustawienia pozostają w 100% bezpieczne i zachowane. Możesz przywrócić aktywność sklepu w dowolnym momencie.'
              ) : (
                <span className="text-amber-300/90 font-medium">
                  Sklep jest obecnie dezaktywowany. Klienci publiczni widzą komunikat techniczny. Kliknij &bdquo;Aktywuj sklep&rdquo;, aby natychmiast przywrócić jego pełną dostępność.
                </span>
              )}
            </p>
          </div>

          {/* Section 2: Destructive Delete Store */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Strefa Niebezpieczna</h4>
              </div>
              {!showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Usuń sklep</span>
                </button>
              )}
            </div>

            {!showDeleteConfirm ? (
              <p className="text-[11px] text-zinc-400">
                Trwałe usunięcie sklepu, stron, konfiguracji i powiązanych rekordów. Ta operacja jest nieodwracalna i wymaga celowego potwierdzenia wpisaniem nazwy sklepu.
              </p>
            ) : (
              <div className="pt-2 border-t border-rose-500/20 space-y-3">
                <p className="text-xs text-rose-200">
                  Aby potwierdzić trwałe usunięcie, wpisz poniżej dokładną nazwę sklepu:
                  <strong className="block text-white font-mono mt-1 bg-black/40 p-1.5 rounded border border-rose-500/30">
                    {storeName}
                  </strong>
                </p>

                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Wpisz nazwę sklepu tutaj..."
                  className="w-full px-3 py-2 bg-black/50 border border-rose-500/40 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteInput('')
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleDeleteStore}
                    disabled={deleting || deleteInput.trim() !== storeName.trim()}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      deleteInput.trim() === storeName.trim()
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    }`}
                  >
                    {deleting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Usuń sklep na zawsze</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#27272A] bg-[#18181B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-[#2D2D32] hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
