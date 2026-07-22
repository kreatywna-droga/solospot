// UploadQueue.tsx
// C8.7.5: Asset UX Layer — upload queue HUD

'use client'

export interface UploadQueueItem {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'processing' | 'done' | 'error'
}

interface UploadQueueProps {
  items: UploadQueueItem[]
  onCancel?: (id: string) => void
}

export function UploadQueue({ items, onCancel }: UploadQueueProps) {
  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-[#0a0a14] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kolejka uploadu</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="px-4 py-2.5 border-b border-white/5 last:border-b-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-white truncate flex-1">{item.name}</p>
              <span className={`text-[10px] font-medium ml-2 ${
                item.status === 'done' ? 'text-emerald-400' :
                item.status === 'error' ? 'text-red-400' :
                item.status === 'processing' ? 'text-amber-400' :
                'text-slate-400'
              }`}>
                {item.status === 'uploading' ? `${item.progress}%` :
                 item.status === 'processing' ? 'przetwarzanie' :
                 item.status === 'done' ? 'gotowe' : 'błąd'}
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.status === 'error' ? 'bg-red-500' :
                  item.status === 'done' ? 'bg-emerald-500' :
                  'bg-violet-500'
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            {onCancel && item.status !== 'done' && (
              <button
                onClick={() => onCancel(item.id)}
                className="text-[10px] text-slate-500 hover:text-white mt-1 transition-colors"
              >
                Anuluj
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
