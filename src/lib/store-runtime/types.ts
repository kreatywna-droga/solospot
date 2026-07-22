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
  description?: string
}

export interface StoreRuntimeConfig {
  template?: string
  pages?: RuntimePage[]
  branding?: {
    logo?: string
    favicon?: string
    primaryColor?: string
    secondaryColor?: string
    font?: string
    description?: string
  }
  publicationStatus?: string
}

export interface SectionComponentProps {
  section: RuntimeSection
  theme: RuntimeTheme
  storeName: string
  products?: Array<{
    id: string
    name: string
    description: string
    price: number
    currency: string
    images: string[]
  }>
}
