import { NextResponse } from 'next/server';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const timelineRepo = new TimelineRepository();
    const timeline = await timelineRepo.getTimelineByTenant(id);
    return NextResponse.json({ success: true, timeline });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
