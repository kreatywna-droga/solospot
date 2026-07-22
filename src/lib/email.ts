import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface WelcomeEmailParams {
  to: string
  storeName: string
  storeUrl: string
  dashboardUrl: string
  templateName: string
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured, skipping welcome email')
    return
  }

  const { to, storeName, storeUrl, dashboardUrl, templateName } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #050508; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #080a12; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #ec4899 100%); padding: 40px 32px; text-align: center;">
        <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 11.08 12 21.08 9 18.08"></polyline><path d="M22 4V4a10 10 0 0 1-5.93 9.14"></path></svg>
        </div>
        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Twój sklep jest gotowy! 🚀</h1>
        <p style="margin: 12px 0 0; color: rgba(255,255,255,0.85); font-size: 16px;">${templateName} został automatycznie wdrożony</p>
      </div>

      <div style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 8px 20px; border-radius: 100px; font-weight: 700; font-size: 14px; letter-spacing: 0.05em;">${storeName}</div>
        </div>

        <p style="color: #94a3b8; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">Gratulacje! Kupiłeś gotowy produkt cyfrowy i my zadbaliśmy o resztę. W ciągu <strong style="color: #10b981;">5 minut po płatności</strong> Twój sklep został:</p>

        <ul style="color: #cbd5e1; font-size: 15px; line-height: 2; padding-left: 20px; margin-bottom: 32px;">
          <li>Utworzony tenant i sklep</li>
          <li>Zainstalowany szablon <strong>${templateName}</strong> z produktami</li>
          <li>Skonfigurowany branding (kolory, czcionki, logo placeholder)</li>
          <li>Opublikowany pod unikalnym adresem</li>
          <li>Gotowy do przyjmowania zamówień</li>
        </ul>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </div>
            <strong style="color: #10b981; font-size: 16px;">Twój sklep jest na żywo</strong>
          </div>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">Klienci mogą już kupować. Ty zarządzasz wszystkim z panelu.</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
          <a href="${storeUrl}" target="_blank" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #d946ef 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 700; font-size: 16px; text-align: center;">
            🌐 Zobacz swój sklep
          </a>
          <a href="${dashboardUrl}" target="_blank" style="display: block; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 700; font-size: 16px; text-align: center;">
            ⚙️ Przejdź do panelu zarządzania
          </a>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
          <h3 style="color: white; font-size: 16px; font-weight: 700; margin: 0 0 16px;">Co dalej?</h3>
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #7c3aed, #d946ef); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path></svg></div>
              <div><strong style="color: white;">Dostosuj branding</strong><br><span style="color: #94a3b8; font-size: 14px;">Logo, kolory, czcionki w panelu sklepu</span></div>
            </div>
            <div style="display: flex; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #34d399); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 12V7H5a2 2 0 0 1 0-4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"></path><polyline points="16 8 12 12 8 8"></polyline></svg></div>
              <div><strong style="color: white;">Dodaj własne produkty</strong><br><span style="color: #94a3b8; font-size: 14px;">Zastąp produkty demo swoimi</span></div>
            </div>
            <div style="display: flex; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #fbbf24); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
              <div><strong style="color: white;">Podłącz domenę</strong><br><span style="color: #94a3b8; font-size: 14px;">Własna domena w ustawieniach sklepu</span></div>
            </div>
          </div>
        </div>
      </div>

      <div style="background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); padding: 24px 32px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #475569;">© ${new Date().getFullYear()} SoloSpot. Wszelkie prawa zastrzeżone.</p>
        <p style="margin: 0; font-size: 11px; color: #334155;">Potrzebujesz pomocy? Odpisz na ten email lub napisz do <a href="mailto:support@solospot.pl" style="color: #7c3aed;">support@solospot.pl</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `"SoloSpot" <${process.env.SMTP_USER}>`,
    to,
    subject: `🚀 Twój sklep ${storeName} jest gotowy! Zobacz go na żywo.`,
    html,
  })
}

interface OrderEmailParams {
  to: string
  orderId: string
  customerName: string
  total: number
  currency: string
  storeUrl: string
}

export async function sendOrderNotificationEmail(params: OrderEmailParams) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured, skipping order email')
    return
  }

  const { to, orderId, customerName, total, currency, storeUrl } = params
  const sym = { PLN: 'zł', EUR: '€', USD: '$', GBP: '£' }[currency] || currency

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; background: #050508; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #080a12; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 32px; text-align: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="margin-bottom: 16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">Nowe zamówienie! 🛍️</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">Otrzymałeś nowe zamówienie <strong style="color: white;">#${orderId}</strong> od <strong style="color: white;">${customerName}</strong>.</p>
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 13px; color: #6ee7b7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Wartość zamówienia</div>
          <div style="font-size: 28px; font-weight: 800; color: #10b981;">${(total / 100).toFixed(2)} ${sym}</div>
        </div>
        <div style="text-align: center;">
          <a href="${storeUrl}/dashboard/orders/${orderId}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #d946ef 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">Zobacz zamówienie →</a>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); padding: 20px 32px; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #334155;">SoloSpot • Automatyczne powiadomienie</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `"SoloSpot" <${process.env.SMTP_USER}>`,
    to,
    subject: `🛍️ Nowe zamówienie #${orderId} – ${(total / 100).toFixed(2)} ${sym}`,
    html,
  })
}