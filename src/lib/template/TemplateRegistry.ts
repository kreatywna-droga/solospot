import type { TemplateDefinition, TemplateMeta } from './TemplateTypes'
import fashionPro from './data/fashionPro'
import beauty from './data/beauty'
import restaurant from './data/restaurant'
import digital from './data/digital'

const templates: TemplateDefinition[] = [
  fashionPro,
  beauty,
  restaurant,
  digital,
]

export class TemplateRegistry {
  getAll(): TemplateMeta[] {
    return templates.map((t) => ({
      slug: t.slug,
      name: t.name,
      category: t.category,
      description: t.description,
      price: t.price,
      currency: t.currency,
      previewImage: t.previewImage,
      features: t.features,
    }))
  }

  getBySlug(slug: string): TemplateDefinition | undefined {
    return templates.find((t) => t.slug === slug)
  }

  getByCategory(category: string): TemplateMeta[] {
    return this.getAll().filter((t) => t.category === category)
  }
}
