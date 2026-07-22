import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import type { CreateStoreRequest } from '@/lib/store/StoreTypes';

export async function GET() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    const storeService = new StoreService();
    const stores = await storeService.listStores(session.tenantId);

    return NextResponse.json({ success: true, stores });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    const body: CreateStoreRequest = await req.json();
    const storeService = new StoreService();
    const store = await storeService.createStore(session.tenantId, body);

    return NextResponse.json({ success: true, store }, { status: 201 });
  } catch (err: any) {
    if (err.message?.startsWith('Validation failed')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
