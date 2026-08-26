import { describe, it, expect } from 'vitest';
import {
  createApprovalsState,
  submitSignOff,
} from '../Approvals';

describe('Approvals (Sprint S7)', () => {
  it('submits a sign-off', () => {
    let state = createApprovalsState();
    
    state = submitSignOff(state, 'p1', 'rev-1', 'approver-1', 'approve', 'Looks good!');
    
    expect(state.signOffs).toHaveLength(1);
    expect(state.signOffs[0].decision).toBe('approve');
    expect(state.signOffs[0].note).toBe('Looks good!');
  });
});
