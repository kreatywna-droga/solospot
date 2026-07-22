export interface WorkerTask {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  attempts: number;
  maxAttempts: number;
}

export interface Queue {
  name: string;
  tasks: WorkerTask[];
  processing: boolean;
}

export interface Worker {
  id: string;
  type: string;
  status: 'idle' | 'processing' | 'paused';
  processed: number;
}