import { z } from 'zod';

export const TenantContextSchema = z.object({
  tenantId: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'MAINTENANCE']),
  domains: z.object({
    primary: z.string().min(1),
    custom: z.string().optional(),
  }),
  plan: z.object({
    tier: z.enum(['FREE', 'GROWTH', 'ENTERPRISE']),
    limits: z.record(z.string(), z.number()),
  }),
  capabilities: z.array(z.string()),
  metadata: z.object({
    cacheKey: z.string(),
    lastRefresh: z.string(),
    ttlSeconds: z.number(),
    locale: z.string().optional(),
    currency: z.string().optional(),
  }),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

export interface TenantCacheEntry {
  readonly context: TenantContext;
  readonly expiresAt: number;
}
