import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '@/../packages/platform-core/src/logger/Logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'disconnected';
  try {
    const supabase = getServiceSupabase();
    // Perform a lightweight count check on webhook_events to verify schema + connection
    const { error } = await supabase.from('webhook_events').select('count', { count: 'exact', head: true }).limit(1);
    
    // If there is no error, or if we got a PostgREST validation error (meaning we successfully reached the DB)
    if (!error || (error && error.code)) {
      dbStatus = 'connected';
    }
  } catch (err) {
    // Fail silently, dbStatus remains 'disconnected'
  }

  let eventBusStatus = 'inactive';
  try {
    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);
    if (eventBus) {
      eventBusStatus = 'active';
    }
  } catch (err) {
    // Fail silently, eventBusStatus remains 'inactive'
  }

  const isHealthy = dbStatus === 'connected' && eventBusStatus === 'active';

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    runtime: 'ok',
    database: dbStatus,
    eventBus: eventBusStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.0',
  });
}
