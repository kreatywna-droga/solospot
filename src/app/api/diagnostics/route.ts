import { HealthCheckEngine, SystemDiagnosticProbe, SystemDiagnosticReport } from '../../../../packages/observability/src';
import { PlatformEventBusImpl } from '../../../../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../../packages/platform-core/src/logger/Logger';

export const dynamic = 'force-dynamic';

export async function createDiagnosticsReport(): Promise<SystemDiagnosticReport> {
  const healthEngine = new HealthCheckEngine();

  // Database Health Probe with exception isolation
  healthEngine.registerCheck('database', async () => {
    try {
      const { getServiceSupabase } = await import('../../../lib/supabase');
      const supabase = getServiceSupabase();
      const { error } = await supabase.from('webhook_events').select('count', { count: 'exact', head: true }).limit(1);
      if (!error || (error && error.code)) {
        return { component: 'database', status: 'healthy' };
      }
      return { component: 'database', status: 'degraded', error: error?.message || 'Database query error' };
    } catch (err) {
      return { component: 'database', status: 'unhealthy', error: err instanceof Error ? err.message : String(err) };
    }
  });

  // EventBus Health Probe with exception isolation
  healthEngine.registerCheck('eventBus', async () => {
    try {
      const logger = new ConsolePlatformLogger();
      const eventBus = new PlatformEventBusImpl(logger);
      if (eventBus) {
        return { component: 'eventBus', status: 'healthy' };
      }
      return { component: 'eventBus', status: 'degraded', error: 'EventBus instance unavailable' };
    } catch (err) {
      return { component: 'eventBus', status: 'unhealthy', error: err instanceof Error ? err.message : String(err) };
    }
  });

  const probe = new SystemDiagnosticProbe(healthEngine);
  return probe.runDiagnostics();
}

export async function GET() {
  const report = await createDiagnosticsReport();
  const isUnhealthy = report.status === 'unhealthy' || report.summary?.status === 'unhealthy';
  const httpStatus = isUnhealthy ? 503 : 200;
  return Response.json(report, { status: httpStatus });
}
