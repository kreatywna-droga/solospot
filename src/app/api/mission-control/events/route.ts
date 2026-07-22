import { NextResponse } from 'next/server';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';

export async function GET() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timelineRepo = new TimelineRepository();
    const events = await timelineRepo.getAllEntries(100);
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: true, events: [], degraded: true, reason: err.message });
  }
}
