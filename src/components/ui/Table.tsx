import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'Brak danych', className = '' }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-white/5 ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-white/[0.02] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-slate-300 ${col.className || ''}`}>
                  {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
