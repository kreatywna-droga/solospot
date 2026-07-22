import type { PlatformEventBus } from '@/../packages/platform-core/src/events/PlatformEventBus';

// Minimal adapter that persists audit timeline entries into Mission Control
// by publishing Security.AuditEntry to PlatformEventBus.
export class AuditWriterAdapter {
  constructor(private deps: { bus: PlatformEventBus }) {}

  async record(entry: {
    type: string;
    correlationId: string;
    tenantId?: string;
    details?: any;
  }): Promise<void> {
    const { type, correlationId, tenantId, details } = entry;

    // Mission Control Runtime listens for Security.AuditEntry.
    await this.deps.bus.publish({
      eventId: `evt_audit_${Math.random().toString(36).slice(2, 10)}`,
      eventType: 'Security.AuditEntry',
      timestamp: new Date().toISOString(),
      correlationId,
      tenantId: tenantId ?? 'platform',
      payload: {
        action: type,
        targetType: 'webhook',
        targetId: correlationId,
        details,
      },
    } as any);
  }
}

