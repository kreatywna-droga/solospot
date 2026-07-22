import { vi } from 'vitest';

export const mockDb: { [table: string]: any[] } = {
  tenants: [],
  stores: [],
  timeline: [],
  idempotency_store: [],
  audit_logs: [],
  webhook_events: [],
  payment_intents: [],
  timeline_events: [],
};

export const clearMockDb = () => {
  for (const table of Object.keys(mockDb)) {
    mockDb[table] = [];
  }
};

export class MockQueryBuilder {
  private table: string;
  private data: any[];
  private error: any | null = null;

  constructor(table: string, data: any[], error: any | null = null) {
    this.table = table;
    this.data = [...data];
    this.error = error;
  }

  select(columns: string = '*') {
    return this;
  }

  insert(payload: any) {
    if (this.error) return this;
    const records = Array.isArray(payload) ? payload : [payload];
    
    // Simulate unique constraint for tenants owner_email
    if (this.table === 'tenants') {
      for (const r of records) {
        if (mockDb.tenants.some(t => t.owner_email === r.owner_email)) {
          this.error = { message: 'duplicate key value violates unique constraint' };
          this.data = [];
          return this;
        }
      }
    }

    // Simulate unique constraint for webhook_events provider and provider_event_id
    if (this.table === 'webhook_events') {
      for (const r of records) {
        const dup = mockDb.webhook_events.find(
          x => x.provider === r.provider && x.provider_event_id === r.provider_event_id
        );
        if (dup) {
          this.error = {
            code: '23505',
            message: 'duplicate key value violates unique constraint',
            details: 'Key already exists',
          };
          this.data = [];
          return this;
        }
      }
    }

    const inserted = records.map(r => {
      const rec = { id: r.id ?? `gen_${Math.random()}`, ...r };
      mockDb[this.table].push(rec);
      return rec;
    });

    this.data = inserted;
    return this;
  }

  update(patch: any) {
    if (this.error) return this;
    // Apply patch to matched records
    const ids = this.data.map(r => r.id);
    mockDb[this.table] = mockDb[this.table].map(r => {
      if (ids.includes(r.id)) {
        const updated = { ...r, ...patch };
        // Update local reference
        const localIdx = this.data.findIndex(ld => ld.id === r.id);
        if (localIdx !== -1) this.data[localIdx] = updated;
        return updated;
      }
      return r;
    });
    return this;
  }

  delete() {
    if (this.error) return this;
    const ids = this.data.map(r => r.id);
    mockDb[this.table] = mockDb[this.table].filter(r => !ids.includes(r.id));
    this.data = [];
    return this;
  }

  upsert(payload: any) {
    if (this.error) return this;
    const records = Array.isArray(payload) ? payload : [payload];
    
    const upserted = records.map(r => {
      const existingIdx = mockDb[this.table].findIndex(dbR => dbR.id === r.id);
      if (existingIdx !== -1) {
        mockDb[this.table][existingIdx] = { ...mockDb[this.table][existingIdx], ...r };
        return mockDb[this.table][existingIdx];
      } else {
        const rec = { id: r.id ?? `gen_${Math.random()}`, ...r };
        mockDb[this.table].push(rec);
        return rec;
      }
    });

    this.data = upserted;
    return this;
  }

  eq(field: string, value: any) {
    if (this.error) return this;
    this.data = this.data.filter(r => r[field] === value);
    return this;
  }

  neq(field: string, value: any) {
    if (this.error) return this;
    this.data = this.data.filter(r => r[field] !== value);
    return this;
  }

  gt(field: string, value: any) {
    if (this.error) return this;
    this.data = this.data.filter(r => r[field] > value);
    return this;
  }

  gte(field: string, value: any) {
    if (this.error) return this;
    this.data = this.data.filter(r => r[field] >= value);
    return this;
  }

  lt(field: string, value: any) {
    if (this.error) return this;
    this.data = this.data.filter(r => r[field] < value);
    return this;
  }

  lte(field: string, value: any) {
    if (this.error) return this;
    this.data = this.data.filter(r => r[field] <= value);
    return this;
  }

  in(field: string, values: any[]) {
    if (this.error) return this;
    this.data = this.data.filter(r => values.includes(r[field]));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    if (this.error) return this;
    const asc = options?.ascending !== false;
    this.data.sort((a, b) => {
      if (a[field] < b[field]) return asc ? -1 : 1;
      if (a[field] > b[field]) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(count: number) {
    if (this.error) return this;
    this.data = this.data.slice(0, count);
    return this;
  }

  range(from: number, to: number) {
    if (this.error) return this;
    this.data = this.data.slice(from, to + 1);
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return Promise.resolve({ data: this.error ? null : this.data, error: this.error }).then(onfulfilled, onrejected);
  }

  async single() {
    if (this.error) return { data: null, error: this.error };
    const data = this.data.length > 0 ? this.data[0] : null;
    if (!data) {
      return { data: null, error: { message: 'No rows found' } };
    }
    return { data, error: null };
  }

  async maybeSingle() {
    if (this.error) return { data: null, error: this.error };
    const data = this.data.length > 0 ? this.data[0] : null;
    return { data, error: null };
  }
}

export const isSupabaseConfigured = vi.fn(() => true);

const createMockClient = () => ({
  from: vi.fn((table: string) => {
    if (!mockDb[table]) {
      mockDb[table] = [];
    }
    return new MockQueryBuilder(table, mockDb[table]);
  }),
});

export const supabase = createMockClient();
export const getServiceSupabase = vi.fn(() => supabase);
