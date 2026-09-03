import { NextResponse } from 'next/server';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const timelineRepo = new TimelineRepository();
    const events = await timelineRepo.getAllEntries(100);
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: true, events: [], degraded: true, reason: err.message });
  }
}
