export interface MockRuntimeSnapshot {
  snapshotId: string;
  storeSlug: string;
  outputMode: 'LIVE' | 'PREVIEW' | 'EXPORT';
  renderedHtml: string;
  executionTimeMs: number;
}

export const MOCK_RUNTIME_SNAPSHOTS: Record<string, MockRuntimeSnapshot> = {
  liveSnapshot: {
    snapshotId: 'snap_live_001',
    storeSlug: 'onekoszyk-demo',
    outputMode: 'LIVE',
    renderedHtml: '<div class="store-root"><section class="hero">Welcome</section></div>',
    executionTimeMs: 12.4,
  },
  previewSnapshot: {
    snapshotId: 'snap_prev_001',
    storeSlug: 'onekoszyk-demo',
    outputMode: 'PREVIEW',
    renderedHtml: '<div class="store-root builder-preview"><section class="hero">Welcome</section></div>',
    executionTimeMs: 14.8,
  },
};
