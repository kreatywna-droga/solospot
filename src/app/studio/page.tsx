'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'

interface StoreItem {
  id: string
  name: string
  slug: string
}

export default function StudioIndexPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<StoreItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function resolveStore() {
      try {
        const res = await fetch('/api/stores')
        if (res.status === 401 || res.status === 403) {
          setError('Musisz być zalogowany, aby przejść do Authoring Studio.')
          return
        }
        const data = await res.json()
        if (!data.success || !Array.isArray(data.stores)) {
          setError(data.error || 'Nie udało się pobrać listy sklepów.')
          return
        }

        if (data.stores.length === 1) {
          router.replace(`/studio/${data.stores[0].id}`)
          return
        }

        setStores(data.stores)
      } catch {
        setError('Błąd połączenia z serwerem.')
      } finally {
        setLoading(false)
      }
    }

    resolveStore()
  }, [router])

  if (loading) {
    return (
      <div className="h-screen bg-[#050508] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-sm text-slate-400">Ładowanie Authoring Studio...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#0c0d16] border border-white/10 p-8 rounded-3xl shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Authoring Studio</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full text-sm hover:opacity-90 transition-opacity"
            >
              Zaloguj się
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-medium rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              Panel główny
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Authoring Studio</h1>
          <p className="text-slate-400 text-sm">Wybierz sklep, którego strony chcesz edytować w kreatorze wizualnym.</p>
        </div>

        {stores.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-white/5 bg-[#0c0d16]">
            <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Brak sklepów do edycji</h3>
            <p className="text-slate-400 text-sm mb-6">Utwórz swój pierwszy sklep, aby uruchomić wizualny kreator stron.</p>
            <Link
              href="/dashboard/stores"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full font-bold text-sm"
            >
              Przejdź do moich sklepów
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/studio/${s.id}`}
                className="p-6 rounded-2xl border border-white/5 bg-[#0c0d16] hover:border-violet-500/30 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors">{s.name}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{s.slug}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-violet-600 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
