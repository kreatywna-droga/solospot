import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { TimelineEntry } from './TimelineEntry';

export class TimelineRepository {
  private readonly tableName = 'timeline_events';

  async saveEntry(entry: TimelineEntry): Promise<TimelineEntry> {
    if (!isSupabaseConfigured()) {
      // Środowisko dev bez Supabase — symuluj zapis (zwróć wejście z placeholder ID)
      return { ...entry, id: entry.id ?? `dev-${Date.now()}` };
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        tenant_id: entry.tenantId,
        correlation_id: entry.correlationId,
        event_type: entry.eventType,
        timestamp: entry.timestamp || new Date().toISOString(),
        actor: entry.actor,
        metadata: entry.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`TimelineRepository.saveEntry failed: ${error.message}`);
    }

    return this.mapRow(data);
  }

  async getTimelineByTenant(tenantId: string): Promise<TimelineEntry[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`TimelineRepository.getTimelineByTenant failed: ${error.message}`);
    }

    return (data || []).map(row => this.mapRow(row));
  }

  async getTimelineByCorrelationId(correlationId: string): Promise<TimelineEntry[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('correlation_id', correlationId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`TimelineRepository.getTimelineByCorrelationId failed: ${error.message}`);
    }

    return (data || []).map(row => this.mapRow(row));
  }

  async getAllEntries(limit = 100): Promise<TimelineEntry[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`TimelineRepository.getAllEntries failed: ${error.message}`);
    }

    return (data || []).map(row => this.mapRow(row));
  }

  private mapRow(row: any): TimelineEntry {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      correlationId: row.correlation_id,
      eventType: row.event_type,
      timestamp: row.timestamp,
      actor: row.actor,
      metadata: row.metadata || {},
    };
  }
}

