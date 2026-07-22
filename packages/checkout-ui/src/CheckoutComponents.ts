import {
  CheckoutComponent,
  CheckoutContext,
  CheckoutRenderResult,
  CheckoutState,
} from './CheckoutContext';

// ── CartSummary Component ────────────────────────────────────────────────────

export class CartSummaryComponent implements CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult {
    const { cartSummary } = context;
    const rows = cartSummary.items
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${(item.unitPriceCents / 100).toFixed(2)} ${item.currency}</td></tr>`
      )
      .join('\n');

    const html = `
<section class="checkout-cart-summary">
  <h2>Twój koszyk</h2>
  <table>
    <thead><tr><th>Produkt</th><th>Ilość</th><th>Cena</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Razem: ${(cartSummary.totalCents / 100).toFixed(2)} ${cartSummary.currency}</p>
</section>`.trim();

    return { html, state: context.currentState, errors: [] };
  }
}

// ── CustomerForm Component ───────────────────────────────────────────────────

export class CustomerFormComponent implements CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult {
    const html = `
<section class="checkout-customer-form">
  <h2>Twoje dane</h2>
  <form id="checkout-customer-form">
    <div class="field"><label>Imię</label><input type="text" name="firstName" required /></div>
    <div class="field"><label>Nazwisko</label><input type="text" name="lastName" required /></div>
    <div class="field"><label>E-mail</label><input type="email" name="email" required /></div>
    <button type="submit">Dalej — Wysyłka</button>
  </form>
</section>`.trim();

    return { html, state: context.currentState, errors: [] };
  }
}

// ── ShippingSelector Component ───────────────────────────────────────────────

export class ShippingSelectorComponent implements CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult {
    const errors: string[] = [];

    if (context.shippingMethods.length === 0) {
      return {
        html: '<div class="checkout-error">Brak dostępnych metod wysyłki.</div>',
        state: context.currentState,
        errors: ['ShippingUnavailableException: No shipping methods available'],
      };
    }

    const options = context.shippingMethods
      .map(
        (method) =>
          `<li>
  <label>
    <input type="radio" name="shippingMethod" value="${method.id}" ${context.selectedShippingId === method.id ? 'checked' : ''} />
    ${method.name} (${method.provider}) — ${(method.priceCents / 100).toFixed(2)} ${method.currency}, ${method.estimatedDays} dni
  </label>
</li>`
      )
      .join('\n');

    const html = `
<section class="checkout-shipping-selector">
  <h2>Wybierz wysyłkę</h2>
  <ul class="shipping-methods">${options}</ul>
  <button type="button" id="confirm-shipping">Dalej — Płatność</button>
</section>`.trim();

    return { html, state: context.currentState, errors };
  }
}

// ── PaymentSelector Component ────────────────────────────────────────────────

export class PaymentSelectorComponent implements CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult {
    const options = context.paymentMethods
      .map(
        (method) =>
          `<li>
  <label>
    <input type="radio" name="paymentMethod" value="${method.id}" ${context.selectedPaymentMethod === method.id ? 'checked' : ''} />
    ${method.label}
  </label>
</li>`
      )
      .join('\n');

    const html = `
<section class="checkout-payment-selector">
  <h2>Wybierz płatność</h2>
  <ul class="payment-methods">${options}</ul>
  <button type="button" id="confirm-payment">Dalej — Podsumowanie</button>
</section>`.trim();

    return { html, state: context.currentState, errors: [] };
  }
}

// ── OrderReview Component ────────────────────────────────────────────────────

export class OrderReviewComponent implements CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult {
    const shipping = context.shippingMethods.find((m) => m.id === context.selectedShippingId);
    const payment = context.paymentMethods.find((m) => m.id === context.selectedPaymentMethod);

    const html = `
<section class="checkout-order-review">
  <h2>Podsumowanie zamówienia</h2>
  <p>Koszyk: ${context.cartId}</p>
  <p>Wysyłka: ${shipping ? `${shipping.name} — ${(shipping.priceCents / 100).toFixed(2)} ${shipping.currency}` : 'Brak'}</p>
  <p>Płatność: ${payment ? payment.label : 'Brak'}</p>
  <p class="total">Do zapłaty: ${(context.cartSummary.totalCents / 100).toFixed(2)} ${context.currency}</p>
  <button type="button" id="place-order">Zamów i zapłać</button>
</section>`.trim();

    return { html, state: context.currentState, errors: [] };
  }
}

// ── ConfirmationView Component ───────────────────────────────────────────────

export class ConfirmationViewComponent implements CheckoutComponent {
  constructor(private readonly orderId?: string) {}

  render(context: CheckoutContext): CheckoutRenderResult {
    const html = `
<section class="checkout-confirmation">
  <h1>✅ Dziękujemy za zamówienie!</h1>
  ${this.orderId ? `<p>Numer zamówienia: <strong>${this.orderId}</strong></p>` : ''}
  <p>Na Twój adres e-mail zostanie wysłane potwierdzenie.</p>
  <a href="/">Wróć do sklepu</a>
</section>`.trim();

    return { html, state: 'CONFIRMATION', errors: [] };
  }
}

// ── Checkout Error Boundary Wrapper ─────────────────────────────────────────

export function renderWithErrorBoundary(
  component: CheckoutComponent,
  context: CheckoutContext
): CheckoutRenderResult {
  try {
    return component.render(context);
  } catch (err: any) {
    return {
      html: `<div class="checkout-error"><!-- Checkout Component Error: ${err.message} --></div>`,
      state: context.currentState,
      errors: [err.message],
    };
  }
}
