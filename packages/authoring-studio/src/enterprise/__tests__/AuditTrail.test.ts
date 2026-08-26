import { describe, it, expect } from 'vitest';
import { createAuditLogState, appendAuditEntry } from '../AuditTrail';

describe('AuditTrail (PM46, ETAP 4 & DECISION-098)', () => {
  it('appends audit log entries immutably (DECISION-098)', () => {
    let state = createAuditLogState();
    state = appendAuditEntry(state, 'security', 'user_login', 'user-101', { ip: '127.0.0.1' });

    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].action).toBe('user_login');
    expect(state.entries[0].category).toBe('security');
  });
});
