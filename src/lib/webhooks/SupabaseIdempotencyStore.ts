import { getServiceSupabase } from '@/lib/supabase';
import type { IdempotencyStore } from './IdempotencyStore';
import type { WebhookEnvelope, WebhookStatus } from './WebhookTypes';
import type { WebhookEventRecord } from './IdempotencyStore';
type WebhookDbStatus = WebhookStatus;


function assertNonEmpty(v: unknown, name: string): string {
  const s = String(v ?? '');
  if (!s.trim()) {
    throw new Error(`${name} must be non-empty`);
  }
  return s;
}

/**
 * Supabase-backed persistent idempotency.
 *
 * Assumes `webhook_events` table with at least:
 * - unique constraint: (provider, provider_event_id)
 * - columns: id, provider, provider_event_id, payload_hash, correlation_id, tenant_id,
 *   status, received_at, processed_at, error
 */
export class SupabaseIdempotencyStore implements IdempotencyStore {
  private readonly table = 'webhook_events';

  private toKeyArgs(envelope: WebhookEnvelope) {
    return {
      provider: assertNonEmpty(envelope.provider, 'envelope.provider'),
      providerEventId: assertNonEmpty(envelope.providerEventId, 'envelope.providerEventId'),
      payloadHash: assertNonEmpty(envelope.payloadHash, 'envelope.payloadHash'),
    };
  }

  async get(provider: string, providerEventId: string, payloadHash: string): Promise<WebhookEventRecord | null> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('provider', provider)
      .eq('provider_event_id', providerEventId)
      .eq('payload_hash', payloadHash)
      .maybeSingle();

    if (error) {
      throw new Error(`SupabaseIdempotencyStore.get failed: ${error.message}`);
    }

    if (!data) return null;

    return {
      provider: data.provider,
      providerEventId: data.provider_event_id,
      payloadHash: data.payload_hash,
      correlationId: data.correlation_id,
      status: data.status as WebhookDbStatus,
      receivedAt: data.received_at,
      processedAt: data.processed_at ?? undefined,
    };
  }

  /**
   * Atomically tries to claim the event.
   *
   * Contract with IdempotencyStore used by WebhookProcessor:
   * - If already COMPLETED => WebhookProcessor will ignore.
   *
   * We implement claim as:
   * - On first time: insert with status RECEIVED
   * - If unique conflict (provider, provider_event_id): update status to PROCESSING only if existing is RECEIVED
   *
   * This gives deterministic behavior under concurrent delivery.
   */
  async upsertReceived(envelope: WebhookEnvelope, payloadHash: string): Promise<void> {
    const supabase = getServiceSupabase();
    const provider = assertNonEmpty(envelope.provider, 'envelope.provider');
    const providerEventId = assertNonEmpty(envelope.providerEventId, 'envelope.providerEventId');
    const correlationId = assertNonEmpty(envelope.correlationId, 'envelope.correlationId');
    const tenantId = assertNonEmpty(envelope.tenantId, 'envelope.tenantId');

    const now = new Date().toISOString();

    // 1. Try inserting a new row (claims the event if it doesn't exist)
    const { error: insertError } = await supabase
      .from(this.table)
      .insert({
        provider,
        provider_event_id: providerEventId,
        payload_hash: payloadHash,
        correlation_id: correlationId,
        tenant_id: tenantId,
        status: 'PROCESSING' as const,
        received_at: now,
        processed_at: null,
        error: null,
      });

    // 2. If insert fails with unique constraint (duplicate key), try conditional update (for retries of FAILED status)
    if (insertError) {
      const isUniqueViolation = insertError.code === '23505' || 
        String(insertError.message).includes('duplicate key') || 
        String(insertError.details).includes('already exists');
        
      if (isUniqueViolation) {
        // Atomic update only if current status is FAILED or RECEIVED (not PROCESSING or COMPLETED)
        const { data, error: updateError } = await supabase
          .from(this.table)
          .update({
            status: 'PROCESSING' as const,
            received_at: now,
            processed_at: null,
            error: null,
          })
          .eq('provider', provider)
          .eq('provider_event_id', providerEventId)
          .eq('payload_hash', payloadHash)
          .neq('status', 'PROCESSING')
          .neq('status', 'COMPLETED')
          .select();

        if (updateError) {
          throw new Error(`SupabaseIdempotencyStore.upsertReceived update failed: ${updateError.message}`);
        }

        // If no rows were updated, it means another request has already claimed the event (either PROCESSING or COMPLETED)
        if (!data || data.length === 0) {
          throw new Error('Duplicate delivery or concurrency lock active');
        }
      } else {
        throw new Error(`SupabaseIdempotencyStore.upsertReceived insert failed: ${insertError.message}`);
      }
    }
  }

  async markCompleted(envelope: WebhookEnvelope): Promise<void> {
    const supabase = getServiceSupabase();
    const provider = assertNonEmpty(envelope.provider, 'envelope.provider');
    const providerEventId = assertNonEmpty(envelope.providerEventId, 'envelope.providerEventId');
    const payloadHash = assertNonEmpty(envelope.payloadHash, 'envelope.payloadHash');

    const { error } = await supabase
      .from(this.table)
      .update({
        status: 'COMPLETED' as const,
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq('provider', provider)
      .eq('provider_event_id', providerEventId)
      .eq('payload_hash', payloadHash);

    if (error) {
      throw new Error(`SupabaseIdempotencyStore.markCompleted failed: ${error.message}`);
    }
  }

  async markFailed(envelope: WebhookEnvelope): Promise<void> {
    const supabase = getServiceSupabase();
    const provider = assertNonEmpty(envelope.provider, 'envelope.provider');
    const providerEventId = assertNonEmpty(envelope.providerEventId, 'envelope.providerEventId');
    const payloadHash = assertNonEmpty(envelope.payloadHash, 'envelope.payloadHash');

    const { error } = await supabase
      .from(this.table)
      .update({
        status: 'FAILED' as const,
        processed_at: new Date().toISOString(),
      })
      .eq('provider', provider)
      .eq('provider_event_id', providerEventId)
      .eq('payload_hash', payloadHash);

    if (error) {
      throw new Error(`SupabaseIdempotencyStore.markFailed failed: ${error.message}`);
    }
  }
}

