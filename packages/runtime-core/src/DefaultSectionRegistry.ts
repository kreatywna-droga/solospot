import { SectionRenderer, SectionRenderContext, SectionRegistry, createSectionRegistry } from './SectionRegistry';
import { RuntimeTheme } from './RuntimeContext';
import { RuntimeSection } from './RuntimeSection';

function renderHeroSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; subtitle?: string; cta?: string; image?: string };
  const title = config.title || context.storeName;
  const style = `background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}); font-family: ${theme.font};`;
  
  return Promise.resolve(`
    <section style="${style}" class="relative overflow-hidden py-24 lg:py-32 px-4 text-center">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.2)" />
      <div class="relative max-w-3xl mx-auto">
        <h1 class="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">${title}</h1>
        ${config.subtitle ? `<p class="text-lg lg:text-xl text-white/80 mb-8 max-w-xl mx-auto">${config.subtitle}</p>` : ''}
        ${config.cta ? `<button class="px-8 py-4 rounded-full bg-white text-lg font-bold transition-all hover:scale-105" style="color: ${theme.primaryColor}">${config.cta}</button>` : ''}
      </div>
    </section>
  `.trim());
}

function renderNavbarSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { style?: string; sticky?: boolean; brand?: string; links?: string[]; cta?: string };
  
  return Promise.resolve(`
    <nav class="flex items-center justify-between h-16 px-4 bg-white/90 backdrop-blur shadow-sm" style="font-family: ${theme.font}">
      <div class="text-xl font-bold" style="color: ${theme.primaryColor}">${config.brand || context.storeName}</div>
      <div class="flex items-center gap-6 text-sm text-slate-600">
        ${(config.links || ['Home', 'Produkty', 'O nas', 'Kontakt']).map(l => `<span class="hover:text-violet-600 cursor-pointer">${l}</span>`).join('')}
      </div>
      <div class="flex items-center gap-3">
        ${config.cta ? `<button class="px-4 py-2 rounded-full text-white text-sm font-medium" style="background: linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})">${config.cta}</button>` : ''}
      </div>
    </nav>
  `.trim());
}

function renderGallerySection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; images?: string[] };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      <h2 class="text-2xl font-bold text-center mb-8" style="color: ${theme.primaryColor}">${config.title || 'Galeria'}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
        ${(config.images?.length || 4) > 0 
          ? (config.images || []).map((img: string, i: number) => `
            <div class="aspect-square rounded-xl overflow-hidden bg-slate-100">
              <img src="${img}" alt="Gallery ${i + 1}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          `).join('')
          : Array.from({ length: 4 }).map((_, i: number) => `
            <div class="aspect-square rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})">
              <span class="text-white/50 text-3xl font-bold">Zdjęcie ${i + 1}</span>
            </div>
          `).join('')
        }
      </div>
    </section>
  `.trim());
}

function renderProductGridSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; count?: number };
  const products = context.products || [];
  const count = config.count || 4;
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold" style="color: ${theme.primaryColor}">${config.title || 'Produkty'}</h2>
        <span class="text-sm text-slate-500">${count} produktów</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${products.slice(0, count).map((p, i) => `
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <div class="aspect-square bg-slate-100 flex items-center justify-center">
              ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" class="w-full h-full object-cover" />` : `<svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`}
            </div>
            <div class="p-4">
              <h3 class="font-medium text-slate-900 mb-1">${p.name || `Produkt ${i + 1}`}</h3>
              <p class="text-sm text-slate-500 mb-2">${p.description || 'Opis produktu'}</p>
              <div class="flex items-center justify-between">
                <span class="font-bold text-lg" style="color: ${theme.primaryColor}">${p.price} ${p.currency}</span>
                <button class="px-3 py-1.5 rounded-lg text-white text-sm" style="background: linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})">Do koszyka</button>
              </div>
            </div>
          </div>
        `).join('')}
        ${products.length < count ? Array.from({ length: count - products.length }).map((_, i) => `
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div class="aspect-square bg-slate-100 flex items-center justify-center">
              <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div class="p-4">
              <h3 class="font-medium text-slate-900 mb-1">Produkt ${products.length + i + 1}</h3>
              <p class="text-sm text-slate-500 mb-2">Opis produktu demo</p>
              <div class="flex items-center justify-between">
                <span class="font-bold text-lg" style="color: ${theme.primaryColor}">${199 + i * 50} PLN</span>
                <button class="px-3 py-1.5 rounded-lg text-white text-sm" style="background: linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})">Do koszyka</button>
              </div>
            </div>
          </div>
        `).join('') : ''}
      </div>
    </section>
  `.trim());
}

function renderCategoryGridSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; items?: string[] };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      <h2 class="text-2xl font-bold text-center mb-8" style="color: ${theme.primaryColor}">${config.title || 'Kategorie'}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        ${(config.items || ['Kat 1', 'Kat 2', 'Kat 3', 'Kat 4']).map((item: string, i: number) => `
          <div class="aspect-square rounded-2xl flex items-center justify-center text-white font-bold text-lg cursor-pointer transition-transform hover:scale-105" style="background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})">
            ${item}
          </div>
        `).join('')}
      </div>
    </section>
  `.trim());
}

function renderTestimonialsSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      <h2 class="text-2xl font-bold text-center mb-8" style="color: ${theme.primaryColor}">${config.title || 'Opinie klientów'}</h2>
      <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        ${Array.from({ length: 3 }).map((_, i) => `
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div class="flex gap-1 mb-3" style="color: ${theme.secondaryColor}">
              ${Array.from({ length: 5 }).map(() => `<svg class="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`).join('')}
            </div>
            <p class="text-slate-600 mb-4 italic">"Świetny sklep, szybka dostawa, produkty najwyższej jakości. Polecam!"</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-slate-200" />
              <div>
                <div class="font-medium text-slate-900">Jan Kowalski</div>
                <div class="text-sm text-slate-500">Klient od 2024</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `.trim());
}

function renderNewsletterSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; cta?: string };
  
  return Promise.resolve(`
    <section class="py-12 px-4 text-center" style="font-family: ${theme.font}">
      <div class="max-w-xl mx-auto">
        <h2 class="text-2xl font-bold mb-4" style="color: ${theme.primaryColor}">${config.title || 'Bądź na bieżąco'}</h2>
        <p class="text-slate-600 mb-6">Zapisz się do newslettera i otrzymuj najnowsze oferty</p>
        <form class="flex gap-2 max-w-md mx-auto">
          <input type="email" placeholder="Twój email" class="flex-1 px-4 py-3 rounded-l-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2" style="border-color: ${theme.primaryColor}" />
          <button type="submit" class="px-6 py-3 rounded-r-xl text-white font-bold" style="background: linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})">${config.cta || 'Zapisz się'}</button>
        </form>
      </div>
    </section>
  `.trim());
}

function renderFooterSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { columns?: string[] };
  
  return Promise.resolve(`
    <footer class="py-12 px-4" style="font-family: ${theme.font}; background: ${theme.primaryColor}">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        ${(config.columns || ['Sklep', 'Pomoc', 'Kontakt', 'Social']).map((col: string) => `
          <div>
            <h4 class="font-bold text-white mb-4">${col}</h4>
            <ul class="space-y-2 text-white/70 text-sm">
              <li>Link 1</li>
              <li>Link 2</li>
              <li>Link 3</li>
            </ul>
          </div>
        `).join('')}
      </div>
      <div class="border-t border-white/20 mt-8 pt-8 text-center text-white/50 text-sm">
        © ${new Date().getFullYear()} ${context.storeName}. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  `.trim());
}

function renderContentSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { body?: string };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      <div class="max-w-3xl mx-auto prose text-slate-700" style="color: ${theme.primaryColor}">
        <div class="bg-white/50 backdrop-blur rounded-xl p-8 border border-slate-200">
          ${config.body || 'Treść sekcji...'}
        </div>
      </div>
    </section>
  `.trim());
}

function renderFeatureGridSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; items?: Array<{ title: string; description: string; icon?: string }> };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      ${config.title ? `<h2 class="text-2xl font-bold text-center mb-8" style="color: ${theme.primaryColor}">${config.title}</h2>` : ''}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        ${(config.items || [
          { title: 'Szybka dostawa', description: 'Dostarczamy w 24h', icon: 'truck' },
          { title: 'Jakość gwarantowana', description: 'Sprawdzamy każdy produkt', icon: 'shield' },
          { title: 'Wsparcie 24/7', description: 'Jesteśmy tu dla Ciebie', icon: 'headphones' },
        ]).map((item, i) => `
          <div class="text-center p-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">${item.title}</h3>
            <p class="text-slate-600">${item.description}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `.trim());
}

function renderStatsSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; stats?: Array<{ label: string; value: string }> };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      ${config.title ? `<h2 class="text-2xl font-bold text-center mb-8" style="color: ${theme.primaryColor}">${config.title}</h2>` : ''}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        ${(config.stats || [
          { label: 'Zadowoleni klienci', value: '99%' },
          { label: 'Produkty w ofercie', value: '500+' },
          { label: 'Lat na rynku', value: '10+' },
          { label: 'Krajów dostawy', value: '25+' },
        ]).map((stat) => `
          <div class="text-center">
            <div class="text-4xl font-bold mb-2" style="color: ${theme.primaryColor}">${stat.value}</div>
            <div class="text-slate-600">${stat.label}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `.trim());
}

function renderContactSection(props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext): Promise<string> {
  const config = props as { title?: string; subtitle?: string; email?: string; phone?: string; address?: string };
  
  return Promise.resolve(`
    <section class="py-12 px-4" style="font-family: ${theme.font}">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl font-bold mb-4" style="color: ${theme.primaryColor}">${config.title || 'Kontakt'}</h2>
        ${config.subtitle ? `<p class="text-slate-600 mb-8">${config.subtitle}</p>` : ''}
        <div class="space-y-4 text-left">
          ${config.email ? `<div class="flex items-center gap-3"><svg class="w-5 h-5" style="color: ${theme.primaryColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><span>${config.email}</span></div>` : ''}
          ${config.phone ? `<div class="flex items-center gap-3"><svg class="w-5 h-5" style="color: ${theme.primaryColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg><span>${config.phone}</span></div>` : ''}
          ${config.address ? `<div class="flex items-center gap-3"><svg class="w-5 h-5" style="color: ${theme.primaryColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span>${config.address}</span></div>` : ''}
        </div>
      </div>
    </section>
  `.trim());
}

export function createDefaultSectionRegistry(): SectionRegistry {
  const registry = createSectionRegistry();
  
  registry
    .register({ type: 'hero', render: renderHeroSection })
    .register({ type: 'navbar', render: renderNavbarSection })
    .register({ type: 'gallery', render: renderGallerySection })
    .register({ type: 'product-grid', render: renderProductGridSection })
    .register({ type: 'category-grid', render: renderCategoryGridSection })
    .register({ type: 'testimonials', render: renderTestimonialsSection })
    .register({ type: 'newsletter', render: renderNewsletterSection })
    .register({ type: 'footer', render: renderFooterSection })
    .register({ type: 'content', render: renderContentSection })
    .register({ type: 'feature-grid', render: renderFeatureGridSection })
    .register({ type: 'stats', render: renderStatsSection })
    .register({ type: 'contact', render: renderContactSection });
  
  return registry;
}