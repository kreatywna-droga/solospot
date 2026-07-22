'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function FooterSection({ section, theme, storeName }: SectionComponentProps) {
  return (
    <footer className="py-12 px-4 text-white/80" style={{ backgroundColor: theme.primaryColor, fontFamily: theme.font }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-white mb-3">{storeName}</h4>
            <p className="text-sm text-white/60">&copy; 2026 Wszelkie prawa zastrzeżone.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Sklep</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Strona główna</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Produkty</a></li>
              <li><a href="#" className="hover:text-white transition-colors">O nas</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Pomoc</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Zwroty</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Regulamin</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Social</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-sm text-white/40">Powered by SoloSpot</div>
      </div>
    </footer>
  )
}
