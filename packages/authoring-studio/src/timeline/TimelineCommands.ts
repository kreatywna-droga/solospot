/**
 * TimelineCommands.ts — PM40 Productivity Command DTO Primitives (ETAP 8)
 *
 * DECISION-068: Command Layer pozostaje całkowicie odseparowana od Runtime.
 *
 * Productivity Command DTOs:
 *   - DuplicateCommand
 *   - DeleteCommand
 *   - GroupCommand
 *   - UngroupCommand
 *   - LockCommand
 *   - UnlockCommand
 *   - HideCommand
 *   - ShowCommand
 *
 * ZERO Runtime execution logic. Pure command descriptors.
 * NO DOM, NO React, NO Browser API.
 */

export type ProductivityCommandType =
  | 'DUPLICATE'
  | 'DELETE'
  | 'GROUP'
  | 'UNGROUP'
  | 'LOCK'
  | 'UNLOCK'
  | 'HIDE'
  | 'SHOW';

export interface BaseProductivityCommand {
  readonly type: ProductivityCommandType;
  readonly targetIds: ReadonlyArray<string>;
  readonly timestamp: number;
}

export interface DuplicateCommand extends BaseProductivityCommand {
  readonly type: 'DUPLICATE';
  readonly timeOffsetShiftMs?: number;
}

export interface DeleteCommand extends BaseProductivityCommand {
  readonly type: 'DELETE';
}

export interface GroupCommand extends BaseProductivityCommand {
  readonly type: 'GROUP';
  readonly groupName: string;
}

export interface UngroupCommand extends BaseProductivityCommand {
  readonly type: 'UNGROUP';
  readonly groupId: string;
}

export interface LockCommand extends BaseProductivityCommand {
  readonly type: 'LOCK';
}

export interface UnlockCommand extends BaseProductivityCommand {
  readonly type: 'UNLOCK';
}

export interface HideCommand extends BaseProductivityCommand {
  readonly type: 'HIDE';
}

export interface ShowCommand extends BaseProductivityCommand {
  readonly type: 'SHOW';
}

export type TimelineProductivityCommand =
  | DuplicateCommand
  | DeleteCommand
  | GroupCommand
  | UngroupCommand
  | LockCommand
  | UnlockCommand
  | HideCommand
  | ShowCommand;

export const TimelineCommands = {
  duplicate(targetIds: ReadonlyArray<string>, timeOffsetShiftMs = 100): DuplicateCommand {
    return {
      type: 'DUPLICATE',
      targetIds,
      timeOffsetShiftMs,
      timestamp: Date.now(),
    };
  },

  delete(targetIds: ReadonlyArray<string>): DeleteCommand {
    return {
      type: 'DELETE',
      targetIds,
      timestamp: Date.now(),
    };
  },

  group(targetIds: ReadonlyArray<string>, groupName = 'New Folder'): GroupCommand {
    return {
      type: 'GROUP',
      targetIds,
      groupName,
      timestamp: Date.now(),
    };
  },

  ungroup(groupId: string): UngroupCommand {
    return {
      type: 'UNGROUP',
      targetIds: [groupId],
      groupId,
      timestamp: Date.now(),
    };
  },

  lock(targetIds: ReadonlyArray<string>): LockCommand {
    return {
      type: 'LOCK',
      targetIds,
      timestamp: Date.now(),
    };
  },

  unlock(targetIds: ReadonlyArray<string>): UnlockCommand {
    return {
      type: 'UNLOCK',
      targetIds,
      timestamp: Date.now(),
    };
  },

  hide(targetIds: ReadonlyArray<string>): HideCommand {
    return {
      type: 'HIDE',
      targetIds,
      timestamp: Date.now(),
    };
  },

  show(targetIds: ReadonlyArray<string>): ShowCommand {
    return {
      type: 'SHOW',
      targetIds,
      timestamp: Date.now(),
    };
  },
};
