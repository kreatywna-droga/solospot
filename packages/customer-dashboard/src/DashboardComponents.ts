import {
  DashboardContext,
  CustomerOrder,
  CustomerAddress,
  CustomerPreferences,
} from './DashboardContext';

// ── Shared render result type ─────────────────────────────────────────────────

export interface DashboardRenderResult {
  html: string;
  errors: string[];
}

function renderWithBoundary(fn: () => string): DashboardRenderResult {
  try {
    return { html: fn(), errors: [] };
  } catch (err: any) {
    return {
      html: `<div class="dashboard-error"><!-- Dashboard Component Error: ${err.message} --></div>`,
      errors: [err.message],
    };
  }
}

// ── AccountHomeView ───────────────────────────────────────────────────────────

export class AccountHomeView {
  render(ctx: DashboardContext): DashboardRenderResult {
    return renderWithBoundary(() => `
<section class="dashboard-home">
  <h1>Witaj, ${ctx.firstName} ${ctx.lastName}!</h1>
  <p class="email">${ctx.email}</p>
  <nav class="dashboard-nav">
    <a href="/account/orders">Moje zamówienia</a>
    <a href="/account/addresses">Książka adresowa</a>
    <a href="/account/preferences">Preferencje</a>
  </nav>
</section>`.trim());
  }
}

// ── OrdersView ────────────────────────────────────────────────────────────────

export class OrdersView {
  render(ctx: DashboardContext, orders: CustomerOrder[]): DashboardRenderResult {
    return renderWithBoundary(() => {
      if (orders.length === 0) {
        return `
<section class="dashboard-orders">
  <h1>Moje zamówienia</h1>
  <p class="empty-state">Nie masz jeszcze żadnych zamówień.</p>
</section>`.trim();
      }

      const rows = orders.map((order) => `
<tr>
  <td><a href="/account/orders/${order.orderId}">${order.orderId}</a></td>
  <td class="status status--${order.status.toLowerCase()}">${order.status}</td>
  <td>${(order.totalCents / 100).toFixed(2)} ${order.currency}</td>
  <td>${new Date(order.createdAt).toLocaleDateString()}</td>
  ${order.trackingNumber ? `<td><a href="#track-${order.trackingNumber}">${order.trackingNumber}</a></td>` : '<td>—</td>'}
</tr>`).join('\n');

      return `
<section class="dashboard-orders">
  <h1>Moje zamówienia</h1>
  <table>
    <thead><tr><th>Nr zamówienia</th><th>Status</th><th>Kwota</th><th>Data</th><th>Śledzenie</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`.trim();
    });
  }
}

// ── OrderDetailView ───────────────────────────────────────────────────────────

export class OrderDetailView {
  render(ctx: DashboardContext, order: CustomerOrder): DashboardRenderResult {
    return renderWithBoundary(() => {
      const items = order.items.map((item) =>
        `<li>${item.name} × ${item.quantity} — ${(item.unitPriceCents / 100).toFixed(2)} ${item.currency}</li>`
      ).join('\n');

      return `
<section class="dashboard-order-detail">
  <h1>Zamówienie ${order.orderId}</h1>
  <p class="status">Status: <strong>${order.status}</strong></p>
  ${order.trackingNumber ? `<p>Numer śledzenia: <strong>${order.trackingNumber}</strong></p>` : ''}
  <ul class="order-items">${items}</ul>
  <p class="total">Suma: ${(order.totalCents / 100).toFixed(2)} ${order.currency}</p>
  <a href="/account/orders">← Wróć do listy zamówień</a>
</section>`.trim();
    });
  }
}

// ── AddressBookView ───────────────────────────────────────────────────────────

export class AddressBookView {
  render(ctx: DashboardContext, addresses: CustomerAddress[]): DashboardRenderResult {
    return renderWithBoundary(() => {
      const cards = addresses.map((addr) => `
<div class="address-card${addr.isDefault ? ' address-card--default' : ''}">
  <p>${addr.fullName}</p>
  <p>${addr.street}, ${addr.postalCode} ${addr.city}, ${addr.country}</p>
  ${addr.isDefault ? '<span class="badge">Domyślny</span>' : ''}
  <button data-action="set-default" data-id="${addr.addressId}">Ustaw domyślny</button>
  <button data-action="remove" data-id="${addr.addressId}">Usuń</button>
</div>`).join('\n');

      return `
<section class="dashboard-addresses">
  <h1>Książka adresowa</h1>
  ${cards || '<p class="empty-state">Brak zapisanych adresów.</p>'}
  <button data-action="add-address">Dodaj nowy adres</button>
</section>`.trim();
    });
  }
}

// ── PreferencesView ───────────────────────────────────────────────────────────

export class PreferencesView {
  render(ctx: DashboardContext, prefs: CustomerPreferences): DashboardRenderResult {
    return renderWithBoundary(() => `
<section class="dashboard-preferences">
  <h1>Preferencje konta</h1>
  <form id="preferences-form">
    <div class="field">
      <label>Język</label>
      <select name="locale">
        <option value="pl_PL"${prefs.locale === 'pl_PL' ? ' selected' : ''}>Polski</option>
        <option value="en_US"${prefs.locale === 'en_US' ? ' selected' : ''}>English</option>
        <option value="de_DE"${prefs.locale === 'de_DE' ? ' selected' : ''}>Deutsch</option>
      </select>
    </div>
    <div class="field">
      <label>Waluta</label>
      <select name="currency">
        <option value="PLN"${prefs.currency === 'PLN' ? ' selected' : ''}>PLN</option>
        <option value="EUR"${prefs.currency === 'EUR' ? ' selected' : ''}>EUR</option>
        <option value="USD"${prefs.currency === 'USD' ? ' selected' : ''}>USD</option>
      </select>
    </div>
    <div class="field">
      <label>
        <input type="checkbox" name="marketingConsent"${prefs.marketingConsent ? ' checked' : ''} />
        Zgoda na komunikację marketingową
      </label>
    </div>
    <div class="field">
      <label>
        <input type="checkbox" name="newsletterConsent"${prefs.newsletterConsent ? ' checked' : ''} />
        Newsletter
      </label>
    </div>
    <button type="submit">Zapisz preferencje</button>
  </form>
</section>`.trim());
  }
}
