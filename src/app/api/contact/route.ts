import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, subject } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Brak wymaganych pól' }, { status: 400 });
    }

    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL || 'kreatywna.droga@gmail.com';
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (gmailUser && gmailPass) {
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
        subject: subject ? `📩 ${subject} | od ${name}` : `📩 Nowa wiadomość od ${name} | SoloSpot`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
              📩 Nowa zgłoszenie w Centrum Pomocy SoloSpot
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #555; width: 120px;">Nadawca:</td>
                <td style="padding: 10px; color: #222;">${name}</td>
              </tr>
              <tr style="background: #f0ebff;">
                <td style="padding: 10px; font-weight: bold; color: #555;">E-mail:</td>
                <td style="padding: 10px;"><a href="mailto:${email}" style="color: #7c3aed;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #555; vertical-align: top;">Wiadomość:</td>
                <td style="padding: 10px; color: #222; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
            <p style="margin-top: 30px; font-size: 12px; color: #aaa; text-align: center;">
              Wiadomość przekierowana na adres: <strong>${recipientEmail}</strong>
            </p>
          </div>
        `,
      });
    } else {
      console.log(`[CONTACT FORM] Message received for ${recipientEmail}:`, { name, email, subject, message });
    }

    return NextResponse.json({ success: true, message: 'Wiadomość została pomyślnie wysłana!' });
  } catch (error) {
    console.error('Błąd wysyłania e-maila:', error);
    return NextResponse.json({ error: 'Błąd serwera podczas wysyłania wiadomości' }, { status: 500 });
  }
}
