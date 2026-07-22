export interface TemplateSection {
  id: string
  type: string
  label: string
  config: Record<string, unknown>
}

export interface TemplatePage {
  id: string
  slug: string
  name: string
  sections: TemplateSection[]
}

export interface TemplateTheme {
  primaryColor: string
  secondaryColor: string
  font: string
  description?: string
}

export interface TemplateProductSeed {
  name: string
  description?: string
  price: number
  currency?: string
  images?: string[]
}

export interface TemplateDefinition {
  slug: string
  name: string
  category: string
  description: string
  price: number
  currency: string
  previewImage?: string
  screenshots?: string[]
  liveDemoUrl?: string
  includes?: string[]
  features: string[]
  theme: TemplateTheme
  pages: TemplatePage[]
  products: TemplateProductSeed[]
}

export interface TemplateMeta {
  slug: string
  name: string
  category: string
  description: string
  price: number
  currency: string
  previewImage?: string
  features: string[]
}
