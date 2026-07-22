import { NotificationTemplate, NotificationChannel } from './NotificationDomain';

export class TemplateEngine {
  private templates: Map<string, NotificationTemplate[]> = new Map();

  getTemplate(key: string, locale: string = 'en'): NotificationTemplate | undefined {
    const all = this.templates.get(key);
    return all?.find(t => t.locale === locale);
  }

  listTemplates(channel?: NotificationChannel): NotificationTemplate[] {
    const all = Array.from(this.templates.values()).flat();
    return channel ? all.filter(t => t.channel === channel) : all;
  }

  render(templateKey: string, variables: Record<string, string>, locale: string = 'en'): { subject?: string; body: string } {
    const template = this.getTemplate(templateKey, locale);
    if (!template) return { body: '' };

    let body = template.body;
    let subject = template.subject;

    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      if (subject) subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return { subject, body };
  }

  addTemplate(template: NotificationTemplate): void {
    const existing = this.templates.get(template.key) || [];
    existing.push(template);
    this.templates.set(template.key, existing);
  }
}