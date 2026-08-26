import { notFound } from 'next/navigation'
import { renderStore } from '@/lib/runtime'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'
import { generateThemeCssVars } from '@/lib/tenant/TenantTheme'
import { CartProvider } from '@/lib/cart/CartStore'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const result = await renderStore({ slug, mode: 'LIVE' })
    if (!result || !result.success) return { title: 'Sklep' }
    return {
      title: result.seo?.title || result.storeName,
      description: result.seo?.description || result.theme.description,
    }
  } catch {
    return { title: 'Sklep' }
  }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params

  const result = await renderStore({ slug, mode: 'LIVE' })

  if (!result) return notFound()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ten sklep nie jest jeszcze opublikowany</h1>
          <p className="text-slate-500">Właściciel sklepu nie zakończył jeszcze konfiguracji.</p>
        </div>
      </div>
    )
  }

  // Generate tenant-specific CSS variables from store theme
  const cssVars = generateThemeCssVars({
    primary: result.theme.primaryColor,
    secondary: result.theme.secondaryColor,
  })

  return (
    <CartProvider>
      <div style={{ fontFamily: result.theme.font, ...cssVars }}>
        {result.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={{ id: section.id, type: section.type, label: section.label, config: section.props }}
            theme={{
              primaryColor: result.theme.primaryColor,
              secondaryColor: result.theme.secondaryColor,
              font: result.theme.font,
              logo: result.theme.logo,
              favicon: result.theme.favicon,
              description: result.theme.description,
            }}
            storeName={result.storeName}
            products={result.products}
            navigation={result.navigation}
          />
        ))}
        <div className="fixed bottom-4 right-4 z-50">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-xs text-slate-600 shadow-lg hover:shadow-xl transition-shadow"
          >
            Powered by SoloSpot
          </Link>
        </div>
      </div>
    </CartProvider>
  )
}
