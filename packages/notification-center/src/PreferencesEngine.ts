import { NotificationPreference, NotificationChannel } from './NotificationDomain';

export class PreferencesEngine {
  private preferences: Map<string, NotificationPreference> = new Map();

  getPreference(userId: string): NotificationPreference {
    return this.preferences.get(userId) || {
      userId,
      channels: [],
      categories: [],
      frequency: 'instant',
      locale: 'en'
    };
  }

  setPreference(preference: NotificationPreference): void {
    this.preferences.set(preference.userId, preference);
  }

  shouldSend(userId: string, channel: NotificationChannel, category: string): boolean {
    const pref = this.getPreference(userId);

    if (!pref.channels.includes(channel)) return false;
    if (!pref.categories.includes(category) && pref.categories.length > 0) return false;

    if (pref.frequency === 'quiet') return false;

    if (pref.quietHours && this.isInQuietHours(pref.quietHours)) {
      return pref.frequency === 'instant';
    }

    return true;
  }

  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const start = new Date(`1970-01-01T${quietHours.start}:00`);
    const end = new Date(`1970-01-01T${quietHours.end}:00`);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}