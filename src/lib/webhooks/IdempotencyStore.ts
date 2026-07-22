import type { WebhookEnvelope, WebhookStatus } from './WebhookTypes';

export interface WebhookEventRecord {
  provider: string;
  providerEventId: string;
  payloadHash: string;
  correlationId: string;
  status: WebhookStatus;
  receivedAt: string;
  processedAt?: string;
}

export interface IdempotencyStore {
  get(provider: string, providerEventId: string, payloadHash: string): Promise<WebhookEventRecord | null>;

  // Rezerwacja/oznaczenie jako w przetwarzaniu (opcjonalnie).
  // Dla prostej implementacji w memory — w Step 4 przejdziemy na persistent store.
  upsertReceived(envelope: WebhookEnvelope, payloadHash: string): Promise<void>;

  markCompleted(envelope: WebhookEnvelope): Promise<void>;

  markFailed(envelope: WebhookEnvelope): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private map = new Map<string, WebhookEventRecord>();

  private key(provider: string, providerEventId: string, payloadHash: string) {
    return `${provider}::${providerEventId}::${payloadHash}`;
  }

  async get(provider: string, providerEventId: string, payloadHash: string) {
    return this.map.get(this.key(provider, providerEventId, payloadHash)) ?? null;
  }

  async upsertReceived(envelope: WebhookEnvelope, payloadHash: string) {
    const k = this.key(envelope.provider, envelope.providerEventId, payloadHash);
    if (this.map.has(k)) return;

    this.map.set(k, {
      provider: envelope.provider,
      providerEventId: envelope.providerEventId,
      payloadHash,
      correlationId: envelope.correlationId,
      status: 'RECEIVED',
      receivedAt: new Date().toISOString(),
    });
  }

  async markCompleted(envelope: WebhookEnvelope) {
    const k = this.key(envelope.provider, envelope.providerEventId, envelope.payloadHash);
    const existing = this.map.get(k);
    if (!existing) return;

    existing.status = 'COMPLETED';
    existing.processedAt = new Date().toISOString();
  }

  async markFailed(envelope: WebhookEnvelope) {
    const k = this.key(envelope.provider, envelope.providerEventId, envelope.payloadHash);
    const existing = this.map.get(k);
    if (!existing) return;

    existing.status = 'FAILED';
    existing.processedAt = new Date().toISOString();
  }
}

