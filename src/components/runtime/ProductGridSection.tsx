'use client'
import { Package, ShoppingCart } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'
import { useCart } from '@/lib/cart/CartStore'

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { PLN: 'zł', EUR: '€', USD: '$' }
  return `${(price / 100).toFixed(2)} ${symbols[currency] || currency}`
}

export function ProductGridSection({ section, theme, products }: SectionComponentProps) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as { title?: string; count?: number }
  const displayCount = typeof config.count === 'number' && config.count > 0 ? config.count : 8
  const displayProducts = products?.slice(0, displayCount) || []
  const { state, dispatch } = useCart()

  const handleAddToCart = (product: { id: string; name: string; price: number; currency: string; images: string[] }) => {
    const existingItem = state.items.find(i => i.productId === product.id)
    if (existingItem) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId: product.id, quantity: existingItem.quantity + 1 } })
    } else {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          productId: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.images[0] || '',
          quantity: 1,
        },
      })
    }
  }

  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: '#ffffff', fontFamily: theme.font }}>
      <div className="max-w-7xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">Brak produktów do wyświetlenia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((p) => (
              <div key={p.id} className="group cursor-pointer">
                <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-3 flex items-center justify-center">
                  {p.images && p.images.length > 0 && p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <h3 className="font-medium text-sm lg:text-base" style={{ color: theme.primaryColor }}>{p.name}</h3>
                <p className="font-bold mt-1" style={{ color: theme.secondaryColor }}>{formatPrice(p.price, p.currency)}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToCart(p)
                  }}
                  className="mt-2 w-full px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Do koszyka
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
