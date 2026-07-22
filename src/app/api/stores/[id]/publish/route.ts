import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    const body = await _request.json();
    const action: string = body.action || 'publish';
    const storeService = new StoreService();

    let store;
    switch (action) {
      case 'publish':
        store = await storeService.publishStore(session.tenantId, id);
        break;
      case 'unpublish':
        store = await storeService.unpublishStore(session.tenantId, id);
        break;
      case 'ready':
        store = await storeService.markStoreReady(session.tenantId, id);
        break;
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
