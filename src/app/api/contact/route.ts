import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Brak wymaganych pól' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"SoloSpot - Kontakt" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `📩 Nowa wiadomość od ${name} | SoloSpot`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
            📩 Nowa wiadomość z formularza kontaktowego
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555; width: 120px;">Imię:</td>
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
            Wiadomość wysłana przez formularz kontaktowy SoloSpot
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Błąd wysyłania e-maila:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
