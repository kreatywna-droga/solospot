/**
 * TenantEventIsolationAudit — G1-204
 *
 * Audits event isolation between tenants ensuring events are routed to
 * correct tenant subscribers only and detecting cross-tenant event leakage.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantEventRecord {
  readonly eventId: string;
  readonly tenantId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly publishedAtMs: number;
}

export interface EventSubscription {
  readonly subscriptionId: string;
  readonly tenantId: string;
  readonly eventType: string;
}

export interface EventIsolationViolation {
  readonly eventId: string;
  readonly tenantId: string;
  readonly violationType: string;
  readonly detail: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface OrphanedEvent {
  readonly eventId: string;
  readonly tenantId: string;
  readonly eventType: string;
}

export interface EventIsolationReport {
  readonly generatedAtMs: number;
  readonly totalEvents: number;
  readonly violationsFound: number;
  readonly violations: EventIsolationViolation[];
  readonly orphanedEvents: OrphanedEvent[];
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Tenant Event Isolation Auditor
// ---------------------------------------------------------------------------

export class TenantEventIsolationAuditor {
  auditEventIsolation(events: TenantEventRecord[]): EventIsolationViolation[] {
    const violations: EventIsolationViolation[] = [];

    for (const event of events) {
      if (!event.tenantId || event.tenantId.trim().length === 0) {
        violations.push({
          eventId: event.eventId,
          tenantId: '',
          violationType: 'MISSING_TENANT_TAG',
          detail: `Event ${event.eventId} has no tenant tag`,
          severity: 'HIGH',
        });
      }
    }

    return violations;
  }

  detectCrossTenantEventLeakage(
    events: TenantEventRecord[],
    subscriptions: EventSubscription[],
  ): EventIsolationViolation[] {
    const violations: EventIsolationViolation[] = [];

    for (const event of events) {
      const matchingSubs = subscriptions.filter(
        s => s.eventType === event.eventType && s.tenantId !== event.tenantId,
      );

      for (const sub of matchingSubs) {
        violations.push({
          eventId: event.eventId,
          tenantId: event.tenantId,
          violationType: 'CROSS_TENANT_DELIVERY',
          detail: `Event ${event.eventId} from tenant ${event.tenantId} deliverable to tenant ${sub.tenantId} via subscription ${sub.subscriptionId}`,
          severity: 'CRITICAL',
        });
      }
    }

    return violations;
  }

  validateEventTenantTag(event: TenantEventRecord, expectedTenantId: string): boolean {
    return event.tenantId === expectedTenantId;
  }

  detectOrphanedEvents(
    events: TenantEventRecord[],
    subscriptions: EventSubscription[],
  ): OrphanedEvent[] {
    const orphans: OrphanedEvent[] = [];

    for (const event of events) {
      const hasSubscribers = subscriptions.some(
        s => s.tenantId === event.tenantId && s.eventType === event.eventType,
      );
      if (!hasSubscribers) {
        orphans.push({
          eventId: event.eventId,
          tenantId: event.tenantId,
          eventType: event.eventType,
        });
      }
    }

    return orphans;
  }

  generateEventIsolationReport(
    events: TenantEventRecord[],
    subscriptions: EventSubscription[],
  ): EventIsolationReport {
    const violations = [
      ...this.auditEventIsolation(events),
      ...this.detectCrossTenantEventLeakage(events, subscriptions),
    ];
    const orphanedEvents = this.detectOrphanedEvents(events, subscriptions);

    return {
      generatedAtMs: Date.now(),
      totalEvents: events.length,
      violationsFound: violations.length,
      violations,
      orphanedEvents,
      summary:
        violations.length === 0 && orphanedEvents.length === 0
          ? 'All events pass isolation audit'
          : `Found ${violations.length} violation(s) and ${orphanedEvents.length} orphaned event(s)`,
    };
  }
}
