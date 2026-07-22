import { z } from 'zod';

export const PricingSchema = z.object({
  priceGross: z.number().int().nonnegative(),
  priceNet: z.number().int().nonnegative(),
  taxRate: z.number().nonnegative().max(100),
  currency: z.string().length(3),
});

export const InventorySchema = z.object({
  sku: z.string().min(1),
  quantityAvailable: z.number().int().nonnegative(),
  allowBackorder: z.boolean(),
});

export const CategorySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  categories: z.array(z.string()),
  pricing: PricingSchema,
  inventory: InventorySchema,
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type Pricing = z.infer<typeof PricingSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
