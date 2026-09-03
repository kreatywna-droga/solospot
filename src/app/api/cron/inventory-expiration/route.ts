import { InventoryEngine, InventoryRepositoryAdapter } from '../../../../../packages/commerce-engine/src/InventoryEngine';
import { PlatformEventBusImpl } from '../../../../../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../../../packages/platform-core/src/logger/Logger';
import crypto from 'node:crypto';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * /api/cron/inventory-expiration
 * Scheduled cron endpoint to sweep expired stock reservations.
 *
 * Security:
 * - Requires Authorization header matching `Bearer ${CRON_SECRET}` or `x-cron-secret` when CRON_SECRET is configured.
 * - Supports tenant-scoped sweeps via `?tenantId=...` query param or system-wide sweeps when invoked by system scheduler.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate cron trigger (fail-closed if CRON_SECRET is missing or invalid)
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return Response.json(
        { success: false, error: 'Unauthorized cron invocation: CRON_SECRET is not configured' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const customSecretHeader = req.headers.get('x-cron-secret');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token || !timingSafeEqual(token, cronSecret)) {
      if (!customSecretHeader || !timingSafeEqual(customSecretHeader, cronSecret)) {
        return Response.json(
          { success: false, error: 'Unauthorized cron invocation: invalid or missing secret' },
          { status: 401 }
        );
      }
    }

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || undefined;

    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);

    // If Supabase environment is configured, wire SupabaseInventoryRepository
    let repository;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('test-project') &&
      process.env.NODE_ENV !== 'test'
    ) {
      const { SupabaseInventoryRepository } = await import(
        '../../../../../packages/commerce-persistence/src/providers/SupabaseInventoryRepository'
      );
      const supabaseRepo = new SupabaseInventoryRepository({
        url: supabaseUrl,
        key: supabaseKey,
        tenantId: tenantId || 'system',
      });
      repository = new InventoryRepositoryAdapter(supabaseRepo);
    }

    const engine = new InventoryEngine({
      eventBus,
      logger,
      repository,
    });

    const result = await engine.sweepExpiredReservations(tenantId);

    return Response.json({
      success: true,
      sweptCount: result.sweptCount,
      expiredReservationIds: result.expiredReservationIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON ROUTE ERROR]', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to sweep expired inventory reservations',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
