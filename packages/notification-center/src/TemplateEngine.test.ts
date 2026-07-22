import { describe, it, expect } from 'vitest';
import { TemplateEngine } from './TemplateEngine';
import { NotificationChannel } from './NotificationDomain';

describe('TemplateEngine', () => {
  const engine = new TemplateEngine();

  it('should render template with variables', () => {
    engine.addTemplate({
      key: 'billing.invoice',
      channel: NotificationChannel.EMAIL,
      subject: 'Invoice {{invoiceId}}',
      body: 'Hello {{name}}, your invoice for {{amount}} is ready',
      variables: ['name', 'amount', 'invoiceId'],
      locale: 'en',
      version: 1
    });

    const result = engine.render('billing.invoice', { name: 'John', amount: '29', invoiceId: 'INV-123' });
    expect(result.subject).toBe('Invoice INV-123');
    expect(result.body).toContain('John');
    expect(result.body).toContain('29');
  });

  it('should return empty body for missing template', () => {
    const result = engine.render('unknown', {});
    expect(result.body).toBe('');
  });

  it('should list templates by channel', () => {
    engine.addTemplate({
      key: 'test.sms',
      channel: NotificationChannel.SMS,
      body: 'Test message',
      variables: [],
      locale: 'en',
      version: 1
    });

    const emails = engine.listTemplates(NotificationChannel.EMAIL);
    const sms = engine.listTemplates(NotificationChannel.SMS);
    expect(emails.length).toBeGreaterThan(0);
    expect(sms.length).toBe(1);
  });
});