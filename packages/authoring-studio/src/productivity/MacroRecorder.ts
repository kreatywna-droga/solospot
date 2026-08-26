/**
 * MacroRecorder.ts — Sprint S6 Macro Recorder
 *
 * Records and replays sequences of commands (macros) for productivity automation.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface MacroAction {
  readonly commandId: string;
  readonly payload?: unknown;
  readonly timestampOffsetMs: number;
}

export interface StudioMacro {
  readonly id: string;
  readonly name: string;
  readonly actions: ReadonlyArray<MacroAction>;
}

export interface MacroRecorderState {
  readonly macros: ReadonlyArray<StudioMacro>;
  readonly isRecording: boolean;
  readonly recordingStartTime: number | null;
  readonly currentRecordingActions: ReadonlyArray<MacroAction>;
}

export function createMacroRecorderState(): MacroRecorderState {
  return {
    macros: [],
    isRecording: false,
    recordingStartTime: null,
    currentRecordingActions: [],
  };
}

export function startRecordingMacro(state: MacroRecorderState): MacroRecorderState {
  return {
    ...state,
    isRecording: true,
    recordingStartTime: Date.now(),
    currentRecordingActions: [],
  };
}

export function recordMacroAction(
  state: MacroRecorderState,
  commandId: string,
  payload?: unknown
): MacroRecorderState {
  if (!state.isRecording || state.recordingStartTime === null) {
    return state;
  }

  const action: MacroAction = {
    commandId,
    payload,
    timestampOffsetMs: Date.now() - state.recordingStartTime,
  };

  return {
    ...state,
    currentRecordingActions: [...state.currentRecordingActions, action],
  };
}

export function stopRecordingMacro(
  state: MacroRecorderState,
  macroId: string,
  macroName: string
): MacroRecorderState {
  if (!state.isRecording) {
    return state;
  }

  const macro: StudioMacro = {
    id: macroId,
    name: macroName,
    actions: state.currentRecordingActions,
  };

  return {
    ...state,
    isRecording: false,
    recordingStartTime: null,
    currentRecordingActions: [],
    macros: [...state.macros, macro],
  };
}
