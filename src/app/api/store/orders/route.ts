/**
 * GET /api/store/orders — G1-315 Merchant Orders List
 *
 * Lists all orders for the authenticated tenant's session.
 * Uses OrderRuntime.listOrders(tenantId) which delegates to
 * OrderProcessingEngine with tenant isolation enforced.
 */

import { NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { OrderRuntime } from '@/lib/order/OrderRuntime';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ success: false, error: 'No tenant associated with this account' }, { status: 403 });
    }

    const runtime = OrderRuntime.getInstance();
    const orders = await runtime.listOrders(session.tenantId);

    const summary = orders.map((o: any) => ({
      id: o.id,
      status: o.status,
      total: o.grandTotalGross,
      currency: o.currency,
      createdAt: o.createdAt,
      itemCount: Array.isArray(o.items) ? o.items.length : 0,
      customerName: o.customerId,
    }));

    return NextResponse.json({ success: true, orders: summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
