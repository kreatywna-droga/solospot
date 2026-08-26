import { describe, it, expect } from 'vitest';
import {
  createMacroRecorderState,
  startRecordingMacro,
  recordMacroAction,
  stopRecordingMacro,
} from '../MacroRecorder';

describe('MacroRecorder (Sprint S6)', () => {
  it('records actions when started and saves macro on stop', () => {
    let state = createMacroRecorderState();
    
    // Not recording yet
    state = recordMacroAction(state, 'cmd-1');
    expect(state.currentRecordingActions).toHaveLength(0);

    // Start
    state = startRecordingMacro(state);
    expect(state.isRecording).toBe(true);

    // Record
    state = recordMacroAction(state, 'cmd-1');
    state = recordMacroAction(state, 'cmd-2', { val: 42 });
    expect(state.currentRecordingActions).toHaveLength(2);
    expect(state.currentRecordingActions[1].payload).toEqual({ val: 42 });

    // Stop
    state = stopRecordingMacro(state, 'macro-1', 'My Macro');
    expect(state.isRecording).toBe(false);
    expect(state.macros).toHaveLength(1);
    expect(state.macros[0].id).toBe('macro-1');
    expect(state.macros[0].actions).toHaveLength(2);
  });
});
