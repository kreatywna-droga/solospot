import type { CheckoutRequest, CheckoutSession, PaymentProvider } from './PaymentProvider';

const ONEKOSZYK_PROVIDER: CheckoutSession['provider'] = 'onekoszyk';

// TODO: w Sprint 6.2.1 przeniesiemy builder parametrów do osobnego, czystego modułu.
// Teraz jest minimalny adapter, aby odseparować wiedzę o 1koszyk od UI.
export class OneKoszykAdapter implements PaymentProvider {
  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession> {
    const planId = request.planId;
    const email = request.email;
    const userId = request.userId;

    const correlationId =
      request.correlationId ||
      // podstawowy fallback - w przyszłości correlationId generujemy w HTTP bridge/middleware
      (cryptoRandomId());

    // Jedyna wiedza o URL 1koszyk w adapterze.
    const base = process.env.ONEKOSZYK_CHECKOUT_BASE_URL || 'https://1ct.eu/6rorw';

    const params = new URLSearchParams();
    params.set('planId', planId);
    if (userId) params.set('userId', userId);
    if (email) params.set('email', email);
    // Jeśli 1koszyk przepuszcza dodatkowe parametry — możemy wysłać correlationId.
    params.set('correlationId', correlationId);

    return {
      redirectUrl: `${base}?${params.toString()}`,
      provider: ONEKOSZYK_PROVIDER,
      correlationId,
      providerSessionId: correlationId,
    };
  }
}

function cryptoRandomId(): string {
  // browser-safe fallback
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return `cid_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

