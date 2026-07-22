import { z } from 'zod';

export interface PlatformEvent<T = any> {
  readonly eventId: string;         // UUID / unique ID of the event
  readonly eventType: string;       // Unique event type name (e.g. "Tenant.Resolved")
  readonly timestamp: string;       // ISO 8601 string
  readonly correlationId: string;   // Trace request identifier
  readonly causationId?: string;    // Direct trigger event identifier
  readonly tenantId?: string;       // Tenant context isolation identifier
  readonly payload: T;              // Immutable structured data payload
}

export const PlatformEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  timestamp: z.string(),
  correlationId: z.string().min(1),
  causationId: z.string().optional(),
  tenantId: z.string().optional(),
  payload: z.any(),
});
