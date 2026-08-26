/**
 * Approvals.ts — Sprint S7 Collaboration Workspace
 *
 * Manages sign-offs and approvals for a document or specific revision.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface SignOff {
  readonly signOffId: string;
  readonly projectId: string;
  readonly revisionId: string;
  readonly approverId: string;
  readonly decision: 'approve' | 'request_changes';
  readonly note?: string;
  readonly timestampMs: number;
}

export interface ApprovalsState {
  readonly signOffs: ReadonlyArray<SignOff>;
}

export function createApprovalsState(): ApprovalsState {
  return { signOffs: [] };
}

export function submitSignOff(
  state: ApprovalsState,
  projectId: string,
  revisionId: string,
  approverId: string,
  decision: 'approve' | 'request_changes',
  note?: string
): ApprovalsState {
  const signOff: SignOff = {
    signOffId: `sig-${Date.now()}`,
    projectId,
    revisionId,
    approverId,
    decision,
    note,
    timestampMs: Date.now(),
  };

  return { ...state, signOffs: [...state.signOffs, signOff] };
}
