/**
 * PayloadNormalizer.ts — Sprint S8 Data Transformation (ETAP 5)
 *
 * Normalizes heterogeneous incoming/outgoing payloads into standard Studio DTO shapes.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface NormalizedPayload<T = unknown> {
  readonly schemaVersion: string;
  readonly timestamp: number;
  readonly data: T;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export function normalizePayload<T>(
  data: T,
  schemaVersion: string = '1.0.0',
  meta?: Readonly<Record<string, unknown>>
): NormalizedPayload<T> {
  return {
    schemaVersion,
    timestamp: Date.now(),
    data,
    meta: meta ? { ...meta } : undefined,
  };
}

export function isNormalizedPayload(value: unknown): value is NormalizedPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<NormalizedPayload>;
  return (
    typeof candidate.schemaVersion === 'string' &&
    typeof candidate.timestamp === 'number' &&
    candidate.data !== undefined
  );
}
