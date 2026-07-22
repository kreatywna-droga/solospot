import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

import { mockDb, clearMockDb } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('Health Check API Route', () => {
  it('should return 200 with healthy status when dependencies are active', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      status: 'healthy',
      runtime: 'ok',
      database: 'connected',
      eventBus: 'active',
    });
    expect(json.timestamp).toBeDefined();
    expect(typeof json.timestamp).toBe('string');
  });
});
