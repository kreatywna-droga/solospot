import { describe, it, expect } from 'vitest';
import { AssetSyncManager } from '../AssetSyncManager';
import { TemplateSync } from '../TemplateSync';
import { PresetSync } from '../PresetSync';

describe('Asset Synchronization (Sprint S9)', () => {
  it('synchronizes asset registry', () => {
    const mgr = new AssetSyncManager('sync-1');
    const res = mgr.syncAssets([{ assetId: 'a1', name: 'logo.png', mimeType: 'image/png', hash: 'abc' }]);

    expect(res.status).toBe('success');
    expect(res.summary.succeeded).toBe(1);
  });

  it('synchronizes templates and presets', () => {
    const tSync = new TemplateSync('sync-2');
    const pSync = new PresetSync('sync-3');

    const tRes = tSync.syncTemplates([{ templateId: 't1', name: 'Banner', version: '1.0' }]);
    const pRes = pSync.syncPresets([{ presetId: 'p1', name: 'FadeIn', category: 'effects' }]);

    expect(tRes.status).toBe('success');
    expect(pRes.status).toBe('success');
  });
});
