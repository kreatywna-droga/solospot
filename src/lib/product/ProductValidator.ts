import type { CreateProductRequest, UpdateProductRequest } from './ProductTypes'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateCreateProduct(req: CreateProductRequest): ValidationResult {
  const errors: string[] = []

  if (!req.name || req.name.trim().length === 0) {
    errors.push('Product name is required')
  } else if (req.name.trim().length > 200) {
    errors.push('Product name must be at most 200 characters')
  }

  if (req.price === undefined || req.price === null || req.price < 0) {
    errors.push('Price must be a non-negative number')
  }

  if (req.currency && req.currency.length !== 3) {
    errors.push('Currency must be a 3-letter code (e.g. PLN, EUR, USD)')
  }

  if (req.images && !Array.isArray(req.images)) {
    errors.push('Images must be an array')
  }

  if (req.status && !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(req.status)) {
    errors.push('Status must be DRAFT, ACTIVE, or ARCHIVED')
  }

  return { valid: errors.length === 0, errors }
}

export function validateUpdateProduct(req: UpdateProductRequest): ValidationResult {
  const errors: string[] = []

  if (req.name !== undefined) {
    if (req.name.trim().length === 0) {
      errors.push('Product name cannot be empty')
    } else if (req.name.length > 200) {
      errors.push('Product name must be at most 200 characters')
    }
  }

  if (req.price !== undefined && (req.price < 0)) {
    errors.push('Price must be a non-negative number')
  }

  if (req.currency && req.currency.length !== 3) {
    errors.push('Currency must be a 3-letter code')
  }

  if (req.images && !Array.isArray(req.images)) {
    errors.push('Images must be an array')
  }

  if (req.status && !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(req.status)) {
    errors.push('Status must be DRAFT, ACTIVE, or ARCHIVED')
  }

  return { valid: errors.length === 0, errors }
}
