import type { StoreRuntimeConfig, RuntimePage } from './RuntimeTypes'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class RuntimeValidator {
  validateConfig(config: Partial<StoreRuntimeConfig>): ValidationResult {
    const errors: string[] = []

    if (!config.storeId) errors.push('storeId is required')
    if (!config.storeName) errors.push('storeName is required')
    if (!config.theme) errors.push('theme is required')
    if (!config.pages || config.pages.length === 0) errors.push('at least one page is required')

    if (config.theme) {
      if (!config.theme.primaryColor) errors.push('theme.primaryColor is required')
      if (!config.theme.font) errors.push('theme.font is required')
    }

    if (config.pages) {
      for (const page of config.pages) {
        this.validatePage(page, errors)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  private validatePage(page: RuntimePage, errors: string[]): void {
    if (!page.id) errors.push('page.id is required')
    if (!page.slug && page.slug !== '') errors.push('page.slug is required')
    if (!page.name) errors.push('page.name is required')

    if (page.sections) {
      for (const section of page.sections) {
        if (!section.id) errors.push(`section.id is required in page "${page.name}"`)
        if (!section.type) errors.push(`section.type is required in page "${page.name}"`)
      }
    }
  }

  canRender(publicationStatus?: string): boolean {
    return publicationStatus === 'READY' || publicationStatus === 'PUBLISHED'
  }

  isPubliclyAccessible(publicationStatus?: string): boolean {
    return publicationStatus === 'PUBLISHED'
  }
}
