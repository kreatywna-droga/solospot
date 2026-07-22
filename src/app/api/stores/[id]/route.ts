import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import type { UpdateStoreRequest, StoreBranding } from '@/lib/store/StoreTypes';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    const storeService = new StoreService();
    const store = await storeService.getStore(session.tenantId, id);

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    const body = await req.json() as UpdateStoreRequest & { branding?: StoreBranding; publicationStatus?: string };
    const storeService = new StoreService();

    const config = { ...((body.config as Record<string, unknown>) || {}) };
    if (body.branding) config.branding = body.branding;
    if (body.publicationStatus) config.publicationStatus = body.publicationStatus;

    const updateReq: UpdateStoreRequest = {
      name: body.name,
      domain: body.domain,
      config: config as any,
    };

    const store = await storeService.updateStore(session.tenantId, id, updateReq);

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    if (err.message?.startsWith('Validation failed')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
