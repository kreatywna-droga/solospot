import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, subject } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Brak wymaganych pól' }, { status: 400 });
    }

    const safeName = escapeHtml(String(name));
    const safeEmail = escapeHtml(String(email));
    const safeMessage = escapeHtml(String(message)).replace(/\n/g, '<br>');
    const safeSubject = subject ? escapeHtml(String(subject)) : '';

    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL || 'kreatywna.droga@gmail.com';
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!gmailUser || !gmailPass) {
      console.warn('[CONTACT FORM] Brak konfiguracji Gmaila w zmiennych środowiskowych!');
      return NextResponse.json(
        { error: 'Brak poprawnej konfiguracji GMAIL_USER i GMAIL_APP_PASSWORD na Vercelu.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"SoloSpot - Centrum Pomocy" <${gmailUser}>`,
      to: recipientEmail,
      replyTo: email,
      subject: safeSubject ? `📩 ${safeSubject} | od ${safeName}` : `📩 Nowa wiadomość od ${safeName} | SoloSpot`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
            📩 Nowa zgłoszenie w Centrum Pomocy SoloSpot
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555; width: 120px;">Nadawca:</td>
              <td style="padding: 10px; color: #222;">${safeName}</td>
            </tr>
            <tr style="background: #f0ebff;">
              <td style="padding: 10px; font-weight: bold; color: #555;">E-mail:</td>
              <td style="padding: 10px;"><a href="mailto:${safeEmail}" style="color: #7c3aed;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555; vertical-align: top;">Wiadomość:</td>
              <td style="padding: 10px; color: #222; line-height: 1.6;">${safeMessage}</td>
            </tr>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #aaa; text-align: center;">
            Wiadomość przekierowana na adres: <strong>${recipientEmail}</strong>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Wiadomość została pomyślnie wysłana!' });
  } catch (error) {
    console.error('Błąd wysyłania e-maila:', error);
    return NextResponse.json({ error: 'Błąd serwera podczas wysyłania wiadomości' }, { status: 500 });
  }
}
