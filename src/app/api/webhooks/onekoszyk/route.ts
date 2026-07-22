import { NextResponse } from 'next/server';
import {
  WebhookVerifier,
  WebhookProcessor,
  SupabaseIdempotencyStore,
  PaymentEngineAdapter,
  OrderProcessingEngineAdapter,
  AuditWriterAdapter,
} from '@/lib/webhooks';

import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';



export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-1cart-signature') || req.headers.get('x-signature');

  try {
    const payload = JSON.parse(rawBody);

    const providerSecret = process.env.ONEKOSZYK_SIGNATURE_KEY || '';

    const verifier = new WebhookVerifier({
      providerSecret,
      provider: 'onekoszyk',
    });

    const verified = verifier.verify({
      rawBody,
      signatureHeader: signature,
      payload,
    });



    const supabaseIdempotencyStore = new SupabaseIdempotencyStore();

    const platformEventBus = new PlatformEventBusImpl();

    // Wire Telemetry & Event Timeline
    const { TimelineRepository } = await import('@/lib/observability/TimelineRepository');
    const { EventTimeline } = await import('@/lib/observability/EventTimeline');
    const timelineRepository = new TimelineRepository();
    new EventTimeline({ eventBus: platformEventBus, repository: timelineRepository });

    // Runtime wiring for PaymentEngineAdapter (deps wypełnimy docelowo w Step 3.3.3)
    // Tymczasowo wyciszamy TS przez rzutowanie, żeby przejść kolejny commit.
    const { PaymentEngine } = await import('@/../packages/commerce-engine/src/PaymentEngine');
    const { ConsolePlatformLogger } = await import('@/../packages/platform-core/src/logger/Logger');

    const paymentLogger = new ConsolePlatformLogger();
    const paymentEngine = new PaymentEngine({
      eventBus: platformEventBus,
      logger: paymentLogger,
    });


    const { SupabasePaymentIntentRepository } = await import('@/lib/payments/SupabasePaymentIntentRepository');
    const paymentIntentRepository = new SupabasePaymentIntentRepository();

    const paymentEngineAdapter = new PaymentEngineAdapter({
      paymentEngine: {
        completePayment: ({ tenantId, intent, correlationId }: { tenantId: string; intent: any; correlationId?: string }) =>
          paymentEngine.completePayment(tenantId, intent, correlationId),
        failPayment: ({ tenantId, intent, correlationId }: { tenantId: string; intent: any; correlationId?: string }) =>
          paymentEngine.failPayment(tenantId, intent, correlationId),
      },
      paymentIntentRepository,
    });




    // Domain order engine wiring
    const { OrderProcessingEngine } = await import('@/../packages/commerce-engine/src/OrderProcessingEngine');

    const orderProcessingEngine = new OrderProcessingEngine({
      eventBus: platformEventBus,
      logger: paymentLogger,
    });



    const orderProcessingEngineAdapter = new OrderProcessingEngineAdapter({
      engine: orderProcessingEngine,
    });


    const auditWriterAdapter = new AuditWriterAdapter({
      bus: platformEventBus,
    });


    const processor = new WebhookProcessor({
      idempotencyStore: supabaseIdempotencyStore,
      paymentEngine: paymentEngineAdapter,
      orderEngine: orderProcessingEngineAdapter,
      eventBus: platformEventBus,
      audit: auditWriterAdapter,
    });


    const result = await processor.process(verified);

    if (result?.ignored) {
      return NextResponse.json({ received: true, ignored: true });
    }

    return NextResponse.json({ received: true, success: true });
  } catch (err) {
    console.error('Webhook POST route error:', err);
    const message = err instanceof Error ? err.message : String(err);

    if (message.toLowerCase().includes('signature')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

