import { NextResponse } from 'next/server';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timelineRepo = new TimelineRepository();
    const timeline = await timelineRepo.getTimelineByTenant(id);
    return NextResponse.json({ success: true, timeline });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
