import { NextRequest, NextResponse } from 'next/server';
import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '@/../packages/platform-core/src/logger/Logger';
import { TenantRepository } from '@/lib/tenant/TenantRepository';
import { TenantProvisioningEngine } from '@/lib/tenant/TenantProvisioningEngine';
import { OnboardingService, PackageNotFoundError } from '@/lib/onboarding/OnboardingService';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { EventTimeline } from '@/lib/observability/EventTimeline';
import type { InitiateCheckoutRequest } from '@/lib/onboarding/OnboardingTypes';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/checkout
 *
 * Inicjalizuje sesję płatności za pakiet platformy.
 * Zwraca URL do przekierowania klienta na stronę 1Koszyk.
 *
 * Body: { tenantId, packageId }
 * Response: InitiateCheckoutResponse (zawiera paymentUrl + expiresAt)
 */
export async function POST(req: NextRequest) {
  const correlationId = req.headers.get('x-correlation-id') ?? `chk_${Date.now()}`;

  let body: InitiateCheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tenantId, packageId } = body;

  if (!tenantId || !packageId) {
    return NextResponse.json(
      { error: 'Missing required fields: tenantId, packageId' },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: true,
        tenantId,
        orderId: `local-order-${Date.now()}`,
        paymentUrl: '/dashboard',
        amountGross: packageId === 'starter' ? 0 : 29900,
        currency: 'PLN',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        degraded: true,
      },
      { status: 200 }
    );
  }

  try {
    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);

    // Wire telemetry
    const timelineRepo = new TimelineRepository();
    new EventTimeline({ eventBus, repository: timelineRepo });

    const tenantRepo = new TenantRepository();
    const provisioningEngine = new TenantProvisioningEngine({ eventBus, tenantRepo, logger });
    const onboardingService = new OnboardingService({ tenantRepo, provisioningEngine, logger });

    const result = await onboardingService.initiateCheckout(body, correlationId);

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err: any) {
    if (err instanceof PackageNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.message?.includes('Tenant not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
