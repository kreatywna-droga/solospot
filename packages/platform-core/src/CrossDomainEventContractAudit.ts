/**
 * G1-186: Cross-Domain Event Contract Audit
 *
 * Registers event contracts between domains, validates payload schema
 * integrity, detects orphaned and unsubscribed events, and generates
 * a full audit report with an event flow graph.
 *
 * HONESTY BOUNDARY: This is a static audit/analysis tool.
 * It does NOT validate runtime event delivery or message broker state.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventContract {
  readonly eventName: string;
  readonly publisherDomain: string;
  readonly subscriberDomains: ReadonlyArray<string>;
  readonly payloadSchema: ReadonlyArray<string>;
  readonly version: string;
}

export interface EventAuditReport {
  readonly timestamp: string;
  readonly totalEvents: number;
  readonly totalContracts: number;
  readonly orphanedEvents: ReadonlyArray<string>;
  readonly unsubscribedEvents: ReadonlyArray<string>;
  readonly integrityIssues: ReadonlyArray<{
    readonly eventName: string;
    readonly issue: string;
  }>;
  readonly eventFlowGraph: Record<string, ReadonlyArray<string>>;
}

// ---------------------------------------------------------------------------
// Cross-Domain Event Contract Auditor
// ---------------------------------------------------------------------------

export class CrossDomainEventContractAuditor {
  private _contracts: Map<string, EventContract> = new Map();

  /**
   * Register an event contract. Overwrites if same eventName exists.
   */
  registerEventContract(contract: EventContract): void {
    this._contracts.set(contract.eventName, contract);
  }

  /**
   * Validate event integrity — checks that the publisher domain and
   * subscriber domains are consistent and payload schema is non-empty.
   */
  validateEventIntegrity(eventName: string): {
    valid: boolean;
    issues: string[];
  } {
    const contract = this._contracts.get(eventName);
    if (!contract) {
      return { valid: false, issues: [`Event "${eventName}" not found`] };
    }

    const issues: string[] = [];

    if (!contract.publisherDomain || contract.publisherDomain.trim() === '') {
      issues.push('Publisher domain is empty');
    }

    if (contract.subscriberDomains.length === 0) {
      issues.push('No subscriber domains defined');
    }

    if (contract.payloadSchema.length === 0) {
      issues.push('Payload schema has no fields');
    }

    // Check for duplicate subscriber domains
    const uniqueSubscribers = new Set(contract.subscriberDomains);
    if (uniqueSubscribers.size !== contract.subscriberDomains.length) {
      issues.push('Duplicate subscriber domains');
    }

    // Check if publisher is also a subscriber (potential loop)
    if (contract.subscriberDomains.includes(contract.publisherDomain)) {
      issues.push('Publisher domain is also a subscriber (potential event loop)');
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Detect events that are published but have no subscribers.
   */
  detectOrphanedEvents(): ReadonlyArray<string> {
    const orphaned: string[] = [];
    for (const [eventName, contract] of this._contracts) {
      if (contract.subscriberDomains.length === 0) {
        orphaned.push(eventName);
      }
    }
    return orphaned.sort();
  }

  /**
   * Detect events that have subscribers but no registered publisher.
   */
  detectUnsubscribedEvents(): ReadonlyArray<string> {
    const unsubscribed: string[] = [];
    for (const [eventName, contract] of this._contracts) {
      if (!contract.publisherDomain || contract.publisherDomain.trim() === '') {
        unsubscribed.push(eventName);
      }
    }
    return unsubscribed.sort();
  }

  /**
   * Return the event flow as an adjacency list.
   * Keys are publisher domains, values are arrays of subscriber domains.
   */
  getEventFlowGraph(): Record<string, ReadonlyArray<string>> {
    const graph: Record<string, Set<string>> = {};

    for (const [, contract] of this._contracts) {
      if (!graph[contract.publisherDomain]) {
        graph[contract.publisherDomain] = new Set();
      }
      for (const subscriber of contract.subscriberDomains) {
        graph[contract.publisherDomain].add(subscriber);
      }
    }

    // Convert Sets to sorted arrays
    const result: Record<string, ReadonlyArray<string>> = {};
    for (const [domain, subscribers] of Object.entries(graph)) {
      result[domain] = Array.from(subscribers).sort();
    }
    return result;
  }

  /**
   * Generate a full audit report of all event contracts.
   */
  generateEventAuditReport(): EventAuditReport {
    const orphanedEvents = this.detectOrphanedEvents();
    const unsubscribedEvents = this.detectUnsubscribedEvents();
    const integrityIssues: Array<{ readonly eventName: string; readonly issue: string }> = [];

    for (const [eventName] of this._contracts) {
      const { valid, issues } = this.validateEventIntegrity(eventName);
      if (!valid) {
        for (const issue of issues) {
          integrityIssues.push({ eventName, issue });
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalEvents: this._contracts.size,
      totalContracts: this._contracts.size,
      orphanedEvents,
      unsubscribedEvents,
      integrityIssues,
      eventFlowGraph: this.getEventFlowGraph(),
    };
  }
}
