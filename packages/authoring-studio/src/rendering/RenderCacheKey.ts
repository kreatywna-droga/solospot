/**
 * RenderCacheKey.ts — Sprint S11 Render Cache Key DTO
 *
 * Immutable key structure uniquely identifying a rendered frame state cache entry.
 * NO DOM, NO React, NO window. Pure DTO.
 */

export interface RenderCacheKeyDTO {
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly docRevision: string;
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly pageId?: string;
  readonly stateHash?: string;
}

export function createRenderCacheKey(dto: RenderCacheKeyDTO): string {
  const pageStr = dto.pageId ?? 'default';
  const stateStr = dto.stateHash ?? 'default';
  return `key_f${dto.frameIndex}_t${dto.timestampMs}_rev${dto.docRevision}_vp${dto.width}x${dto.height}@${dto.devicePixelRatio}_p${pageStr}_s${stateStr}`;
}
