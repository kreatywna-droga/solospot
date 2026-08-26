/**
 * TaskAssignments.ts — Sprint S7 Collaboration Workspace
 *
 * Assign users to specific nodes (e.g. "Animate this layer") or general project tasks.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface TaskAssignment {
  readonly taskId: string;
  readonly projectId: string;
  readonly assigneeId: string;
  readonly assignerId: string;
  readonly targetNodeId?: string;
  readonly description: string;
  readonly status: 'todo' | 'in_progress' | 'done';
  readonly createdAtMs: number;
}

export interface TaskAssignmentsState {
  readonly tasks: ReadonlyArray<TaskAssignment>;
}

export function createTaskAssignmentsState(): TaskAssignmentsState {
  return { tasks: [] };
}

export function assignTask(
  state: TaskAssignmentsState,
  projectId: string,
  assigneeId: string,
  assignerId: string,
  description: string,
  targetNodeId?: string
): TaskAssignmentsState {
  const task: TaskAssignment = {
    taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    projectId,
    assigneeId,
    assignerId,
    targetNodeId,
    description,
    status: 'todo',
    createdAtMs: Date.now(),
  };

  return { ...state, tasks: [...state.tasks, task] };
}

export function updateTaskStatus(
  state: TaskAssignmentsState,
  taskId: string,
  status: 'todo' | 'in_progress' | 'done'
): TaskAssignmentsState {
  return {
    ...state,
    tasks: state.tasks.map((t) => (t.taskId === taskId ? { ...t, status } : t)),
  };
}
