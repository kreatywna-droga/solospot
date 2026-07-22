# Sprint 10.7.5 — Marketplace Production Flow

## Cel
Zamknąć pełną ścieżkę zakupową: **Marketplace → Payment → Provisioning → Working Store**
Time To Business < 5 minut

---

## Checklist zadań

### ✅ Zadanie 1 — Supabase Deployment (MIGRACJE)

**Wymagane migracje do zastosowania:**
```bash
supabase db push
```

Lub ręcznie w Dashboard > SQL Editor:
1. `0007_templates.sql` - tabele `templates`, `template_installs`
2. `0008_template_install_rpc.sql` - funkcja `install_template_to_store()`

**Weryfikacja:**
```sql
-- Sprawdź czy funkcja istnieje
SELECT * FROM pg_proc WHERE proname = 'install_template_to_store';

-- Sprawdź czy tabele istnieją
SELECT * FROM information_schema.tables 
WHERE table_name IN ('templates', 'template_installs');
```

---

### ✅ Zadanie 2 — Environment Variables

Uzupełnij w Vercel / `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...          # lub sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP (dla welcome email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App URL (używane w emailach i redirectach)
NEXT_PUBLIC_APP_URL=https://twoja-domena.vercel.app

# Supabase (już skonfigurowane)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Weryfikacja:**
- `isSupabaseConfigured()` zwraca `true`
- Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

### ✅ Zadanie 3 — Stripe Webhook Configuration

**W Stripe Dashboard > Developers > Webhooks:**

1. **Endpoint:** `https://twoja-domena.vercel.app/api/webhooks/stripe`
2. **Events to send:**
   - `checkout.session.completed`
3. **Signing secret:** Skopiuj do `STRIPE_WEBHOOK_SECRET`

**Test lokalny:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Skopiuj webhook signing secret do .env.local
```

---

### ✅ Zadanie 4 — Seed Templates (Dane startowe)

Uruchom skrypt seedy (wymaga skonfigurowanego Supabase):

```bash
npx tsx scripts/seed-templates.ts
```

Lub ręcznie w SQL Editor (dla każdego template):
```sql
-- Przykład dla fashion-pro
INSERT INTO templates (slug, name, category, description, price, currency, theme_config, page_structure, products)
VALUES ('fashion-pro', 'Fashion Store Pro', 'fashion', '...', 149900, 'PLN', 
  '{"primaryColor":"#1a1a2e","secondaryColor":"#e94560","font":"Poppins","description":"..."}',
  '[...pages...]',
  '[...products...]'
);
```

**Weryfikacja:**
```sql
SELECT slug, name, price, currency FROM templates;
-- Powinno zwrócić 4 wiersze: fashion-pro, beauty, restaurant, digital
```

---

### ✅ Zadanie 5 — Test Golden Flow (END-TO-END)

**Scenariusz testowy:**

1. **Marketplace:** Wejdź na `/marketplace`
2. **Product:** Kliknij "Fashion Store Pro" → `/marketplace/fashion-pro`
3. **Checkout:** Klik "Kup gotowy sklep" → redirect do Stripe Checkout
4. **Payment:** Zapłać kartą testową `4242 4242 4242 4242`
5. **Webhook:** Stripe wyśle `checkout.session.completed` → `/api/webhooks/stripe`
6. **Provisioning:** System stworzy:
   - Tenant
   - Store  
   - Zainstaluje template (RPC)
   - Stworzy produkty
   - Wyśle welcome email
7. **Email:** Sprawdź skrzynkę - powinien przyjść email z linkami do sklepu i dashboardu
8. **Store:** Wejdź na `/store/{slug}` - sklep ma działać
9. **Dashboard:** Zaloguj się → `/dashboard/stores/{id}` - widzisz sklep

**Kryteria sukcesu:**
- [ ] Płatność przechodzi
- [ ] Webhook się wykonuje (sprawdź logi Vercel Functions)
- [ ] Tenant + Store utworzone w bazie
- [ ] Template zainstalowany (sprawdź `template_installs`)
- [ ] Produkty widoczne w sklepie
- [ ] Email doręczony
- [ ] Time To Business < 5 minut

---

## Struktura plików do wdrożenia

```
supabase/
  migrations/
    0007_templates.sql           ✅ Gotowe
    0008_template_install_rpc.sql ✅ Gotowe (z produktami)

scripts/
  seed-templates.ts              ✅ Gotowy (4 templates)

src/
  app/api/webhooks/stripe/route.ts  ✅ Gotowy
  app/api/checkout/route.ts         ✅ Gotowy
  app/marketplace/[slug]/page.tsx   ✅ Gotowy
  lib/email.ts                      ✅ Gotowy (sendWelcomeEmail)
  lib/template/TemplateRegistry.ts  ✅ Gotowy
```

---

## Debugging Tips

**Webhook nie działa?**
```bash
# Sprawdź logi w Vercel
vercel logs --follow

# Lub lokalnie z stripe CLI
stripe trigger checkout.session.completed
```

**Template nie instaluje się?**
```sql
-- Sprawdź błędy RPC
SELECT * FROM template_installs WHERE status = 'FAILED';

-- Ręczne wywołanie RPC
SELECT install_template_to_store('store-uuid', 'fashion-pro');
```

**Email nie dochodzi?**
- Sprawdź `SMTP_USER` / `SMTP_PASS`
- Logi: `console.warn('SMTP not configured')` w `sendWelcomeEmail`

---

## Po Sprint 10.7.5 → Sprint 10.8 (HTML Export Engine)

Gdy Golden Flow działa:
1. HTML Export Engine - "pobierz cały sklep i zabierz go ze sobą"
2. Visual Builder - edycja wizualna
3. Custom Domains - własna domena dla sklepu

---

## Status

| Zadanie | Status |
|---------|--------|
| 1. Supabase migrations | 🟢 Zakończone |
| 2. Environment variables | 🟢 Częściowo gotowe (Supabase skonfigurowane) |
| 3. Stripe webhook | 🟡 Do skonfigurowania |
| 4. Seed templates | 🟢 Zakończone |
| 5. Golden Flow Test | 🟡 Do przetestowania |

**Baza danych i połączenie Vercel <> Supabase są w pełni skonfigurowane i wdrożone! Pozostaje Stripe oraz finalny test.**