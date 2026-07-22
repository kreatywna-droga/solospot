import { NextRequest, NextResponse } from 'next/server';
import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '@/../packages/platform-core/src/logger/Logger';
import { TenantRepository } from '@/lib/tenant/TenantRepository';
import { TenantProvisioningEngine } from '@/lib/tenant/TenantProvisioningEngine';
import { OnboardingService, DuplicateEmailError, PackageNotFoundError } from '@/lib/onboarding/OnboardingService';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { EventTimeline } from '@/lib/observability/EventTimeline';
import type { RegisterTenantRequest } from '@/lib/onboarding/OnboardingTypes';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/register
 *
 * Rejestruje nowego tenanta na platformie SoloSpot.
 * Tenant jest tworzony w statusie CREATED — nie jest jeszcze aktywny.
 * Aktywacja następuje po opłaceniu pakietu (webhook 1Koszyk).
 *
 * Body: { ownerEmail, packageId, storeName }
 * Response: RegisterTenantResponse (zawiera checkoutOrderId i cenę pakietu)
 */
export async function POST(req: NextRequest) {
  const correlationId = req.headers.get('x-correlation-id') ?? `onb_${Date.now()}`;

  let body: RegisterTenantRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { ownerEmail, packageId, storeName } = body;

  if (!ownerEmail || !packageId || !storeName) {
    return NextResponse.json(
      { error: 'Missing required fields: ownerEmail, packageId, storeName' },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    const tenantId = `local-tenant-${Date.now()}`;
    return NextResponse.json(
      {
        success: true,
        tenantId,
        ownerEmail,
        packageId,
        storeName,
        status: 'CREATED',
        checkoutOrderId: `local-checkout-${tenantId}`,
        packagePriceGross: packageId === 'starter' ? 0 : 29900,
        currency: 'PLN',
        createdAt: new Date().toISOString(),
        degraded: true,
      },
      { status: 201 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(ownerEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
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

    const result = await onboardingService.registerTenant(body, correlationId);

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: any) {
    if (err instanceof DuplicateEmailError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof PackageNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // Baza niedostępna (np. środowisko dev bez Supabase)
    if (err.message?.includes('fetch failed') || err.message?.includes('ENOTFOUND') || err.message?.includes('Failed')) {
      return NextResponse.json(
        { error: 'Database unavailable. Configure SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL for full functionality.', degraded: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}
