import type { CreateStoreRequest, UpdateStoreRequest } from './StoreTypes';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreateStore(req: CreateStoreRequest): ValidationResult {
  const errors: string[] = [];

  if (!req.name || req.name.trim().length === 0) {
    errors.push('Store name is required');
  } else if (req.name.trim().length > 100) {
    errors.push('Store name must be at most 100 characters');
  }

  if (!req.slug || req.slug.trim().length === 0) {
    errors.push('Store slug is required');
  } else if (!/^[a-z0-9-]+$/.test(req.slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
  } else if (req.slug.length > 60) {
    errors.push('Slug must be at most 60 characters');
  }

  if (req.domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(req.domain)) {
    errors.push('Invalid domain format');
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpdateStore(req: UpdateStoreRequest): ValidationResult {
  const errors: string[] = [];

  if (req.name !== undefined) {
    if (req.name.trim().length === 0) {
      errors.push('Store name cannot be empty');
    } else if (req.name.length > 100) {
      errors.push('Store name must be at most 100 characters');
    }
  }

  if (req.domain !== undefined && req.domain !== null && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(req.domain)) {
    errors.push('Invalid domain format');
  }

  return { valid: errors.length === 0, errors };
}
