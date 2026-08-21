/**
 * VectorEditorInteractionStateMachine.ts — Sprint G1-47 Interaction State Machine (Night Shift Level 9)
 *
 * Defines explicit deterministic 14-state vector editor interaction state machine,
 * legal transition validation rules, and transient state isolation.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

export type VectorEditorState =
  | 'IDLE'
  | 'SELECTING'
  | 'INTERACTING'
  | 'PREVIEWING'
  | 'SNAPPING'
  | 'COMMAND_BUILDING'
  | 'TRANSACTION_PENDING'
  | 'COMMITTING'
  | 'VALIDATING'
  | 'COMMITTED'
  | 'CANCELLED'
  | 'ROLLING_BACK'
  | 'RECOVERING'
  | 'ERROR';

export interface StateTransitionEntry {
  readonly from: VectorEditorState;
  readonly to: VectorEditorState;
  readonly timestamp: number;
}

export class VectorEditorInteractionStateMachine {
  private currentState: VectorEditorState = 'IDLE';
  private history: StateTransitionEntry[] = [];

  // Transition Validation Matrix: maps allowed target states from each source state
  private static readonly LEGAL_TRANSITIONS: Record<VectorEditorState, ReadonlyArray<VectorEditorState>> = {
    IDLE: ['SELECTING', 'INTERACTING', 'PREVIEWING', 'COMMAND_BUILDING', 'RECOVERING', 'ERROR'],
    SELECTING: ['IDLE', 'INTERACTING', 'CANCELLED', 'ERROR'],
    INTERACTING: ['PREVIEWING', 'SNAPPING', 'COMMAND_BUILDING', 'CANCELLED', 'ERROR'],
    PREVIEWING: ['INTERACTING', 'SNAPPING', 'COMMAND_BUILDING', 'CANCELLED', 'ERROR'],
    SNAPPING: ['PREVIEWING', 'COMMAND_BUILDING', 'CANCELLED', 'ERROR'],
    COMMAND_BUILDING: ['TRANSACTION_PENDING', 'CANCELLED', 'ERROR'],
    TRANSACTION_PENDING: ['COMMITTING', 'VALIDATING', 'ROLLING_BACK', 'ERROR'],
    COMMITTING: ['COMMITTED', 'ROLLING_BACK', 'ERROR'],
    VALIDATING: ['COMMITTED', 'ROLLING_BACK', 'ERROR'],
    COMMITTED: ['IDLE', 'ERROR'],
    CANCELLED: ['IDLE', 'ERROR'],
    ROLLING_BACK: ['RECOVERING', 'IDLE', 'ERROR'],
    RECOVERING: ['IDLE', 'ERROR'],
    ERROR: ['IDLE', 'RECOVERING'],
  };

  /**
   * Returns current interaction state.
   */
  public getCurrentState(): VectorEditorState {
    return this.currentState;
  }

  /**
   * Checks if a transition from currentState to targetState is legal.
   */
  public canTransition(targetState: VectorEditorState): boolean {
    const allowed = VectorEditorInteractionStateMachine.LEGAL_TRANSITIONS[this.currentState];
    return Array.isArray(allowed) && allowed.includes(targetState);
  }

  /**
   * Executes state transition if legal; throws or returns false if illegal.
   */
  public transitionTo(nextState: VectorEditorState): boolean {
    if (!this.canTransition(nextState)) {
      return false;
    }

    const entry: StateTransitionEntry = {
      from: this.currentState,
      to: nextState,
      timestamp: Date.now(),
    };

    this.history.push(entry);
    this.currentState = nextState;
    return true;
  }

  /**
   * Resets interaction state machine to IDLE.
   */
  public resetToIdle(): void {
    this.currentState = 'IDLE';
  }

  /**
   * Returns transition history log.
   */
  public getTransitionHistory(): ReadonlyArray<StateTransitionEntry> {
    return [...this.history];
  }
}
