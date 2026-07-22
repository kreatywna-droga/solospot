export interface RuntimeSection {
  id: string
  type: string
  label: string
  config: Record<string, unknown>
}

export interface RuntimePage {
  id: string
  slug: string
  name: string
  sections: RuntimeSection[]
}

export interface RuntimeTheme {
  primaryColor: string
  secondaryColor: string
  font: string
  logo?: string
  favicon?: string
  description?: string
}

export interface RuntimeNavigation {
  label: string
  href: string
  children?: RuntimeNavigation[]
}

export interface RuntimeSEO {
  title?: string
  description?: string
  ogImage?: string
}

export interface StoreRuntimeConfig {
  storeId: string
  storeName: string
  theme: RuntimeTheme
  pages: RuntimePage[]
  products: RuntimeProduct[]
  navigation?: RuntimeNavigation[]
  seo?: RuntimeSEO
  publicationStatus: string
  template?: string
}

export interface RuntimeProduct {
  id: string
  name: string
  description: string
  price: number
  currency: string
  images: string[]
}

export interface SectionComponentProps {
  section: RuntimeSection
  theme: RuntimeTheme
  storeName: string
  products?: RuntimeProduct[]
  navigation?: RuntimeNavigation[]
}

export interface RuntimeResult {
  storeName: string
  page: RuntimePage
  theme: RuntimeTheme
  products: RuntimeProduct[]
  navigation?: RuntimeNavigation[]
  seo?: RuntimeSEO
  publicationStatus: string
}
