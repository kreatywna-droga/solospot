import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { EventTimeline } from '../observability/EventTimeline';
import { TimelineRepository } from '../observability/TimelineRepository';

import { mockDb, clearMockDb } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('Security Audit Logging to Event Timeline', () => {
  beforeEach(() => {
    clearMockDb();
  });

  it('Should record Security.PermissionDenied and map it to security-monitor actor', async () => {
    const eventBus = new PlatformEventBusImpl();
    const repository = new TimelineRepository();
    new EventTimeline({ eventBus, repository });

    const tenantId = 'tenant-sec-123';
    const correlationId = 'corr-sec-999';

    await eventBus.publish({
      eventId: 'evt-sec-denied',
      eventType: 'Security.PermissionDenied',
      timestamp: new Date().toISOString(),
      correlationId,
      tenantId,
      payload: {
        userId: 'usr-admin-b',
        role: 'TENANT_ADMIN',
        deniedPermission: 'VIEW_ALL_TENANTS',
        reason: 'INSUFFICIENT_PERMISSION',
      },
    });

    expect(mockDb.timeline_events).toHaveLength(1);
    expect(mockDb.timeline_events[0].event_type).toBe('Security.PermissionDenied');
    expect(mockDb.timeline_events[0].actor).toBe('security-monitor');
    expect(mockDb.timeline_events[0].tenant_id).toBe(tenantId);
    expect(mockDb.timeline_events[0].correlation_id).toBe(correlationId);
    expect(mockDb.timeline_events[0].metadata.deniedPermission).toBe('VIEW_ALL_TENANTS');
  });

  it('Should record other security events (Login, APIBlocked, SecretRotation)', async () => {
    const eventBus = new PlatformEventBusImpl();
    const repository = new TimelineRepository();
    new EventTimeline({ eventBus, repository });

    const tenantId = 'tenant-sec-123';
    const correlationId = 'corr-sec-888';

    // Login event
    await eventBus.publish({
      eventId: 'evt-login',
      eventType: 'Security.Login',
      timestamp: new Date().toISOString(),
      correlationId,
      tenantId,
      payload: { userId: 'usr-operator-1', method: '2FA' },
    });

    // Secret Rotation event
    await eventBus.publish({
      eventId: 'evt-rotation',
      eventType: 'Security.SecretRotation',
      timestamp: new Date().toISOString(),
      correlationId,
      tenantId,
      payload: { rotatedKey: 'ONEKOSZYK_SIGNATURE_KEY', operatorId: 'usr-super' },
    });

    expect(mockDb.timeline_events).toHaveLength(2);
    expect(mockDb.timeline_events[0].event_type).toBe('Security.Login');
    expect(mockDb.timeline_events[0].actor).toBe('security-monitor');
    
    expect(mockDb.timeline_events[1].event_type).toBe('Security.SecretRotation');
    expect(mockDb.timeline_events[1].actor).toBe('security-monitor');
  });
});
