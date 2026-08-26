import { describe, it, expect } from 'vitest';
import { TimelineCommands } from '../TimelineCommands';

describe('TimelineCommands (PM40, ETAP 8 & DECISION-068)', () => {
  it('emits pure Productivity Command DTOs without Runtime execution (DECISION-068)', () => {
    const dupCmd = TimelineCommands.duplicate(['kf-1', 'kf-2'], 150);
    expect(dupCmd.type).toBe('DUPLICATE');
    expect(dupCmd.targetIds).toEqual(['kf-1', 'kf-2']);
    expect(dupCmd.timeOffsetShiftMs).toBe(150);
    expect(dupCmd.timestamp).toBeGreaterThan(0);

    const delCmd = TimelineCommands.delete(['kf-1']);
    expect(delCmd.type).toBe('DELETE');
    expect(delCmd.targetIds).toEqual(['kf-1']);

    const groupCmd = TimelineCommands.group(['tr-1', 'tr-2'], 'Header Group');
    expect(groupCmd.type).toBe('GROUP');
    expect(groupCmd.groupName).toBe('Header Group');

    const ungroupCmd = TimelineCommands.ungroup('folder-1');
    expect(ungroupCmd.type).toBe('UNGROUP');
    expect(ungroupCmd.groupId).toBe('folder-1');

    const lockCmd = TimelineCommands.lock(['tr-1']);
    expect(lockCmd.type).toBe('LOCK');

    const unlockCmd = TimelineCommands.unlock(['tr-1']);
    expect(unlockCmd.type).toBe('UNLOCK');

    const hideCmd = TimelineCommands.hide(['tr-1']);
    expect(hideCmd.type).toBe('HIDE');

    const showCmd = TimelineCommands.show(['tr-1']);
    expect(showCmd.type).toBe('SHOW');
  });
});
