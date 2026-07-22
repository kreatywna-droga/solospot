import { WorkerTask, Queue, Worker } from './ScalabilityDomain';

export class WorkerPool {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  createQueue(name: string): Queue {
    const queue: Queue = { name, tasks: [], processing: false };
    this.queues.set(name, queue);
    return queue;
  }

  enqueue(queueName: string, task: WorkerTask): void {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    queue.tasks.push(task);
  }

  processQueue(queueName: string): void {
    const queue = this.queues.get(queueName);
    if (!queue || queue.processing) return;

    queue.processing = true;
    while (queue.tasks.length > 0) {
      const task = queue.tasks.shift();
      if (task) {
        this.assignTask(task);
      }
    }
    queue.processing = false;
  }

  private assignTask(task: WorkerTask): void {
    const worker = Array.from(this.workers.values()).find(w => w.status === 'idle');
    if (worker) {
      worker.status = 'processing';
    }
  }

  createWorker(type: string): Worker {
    const worker: Worker = { id: `worker-${Date.now()}`, type, status: 'idle', processed: 0 };
    this.workers.set(worker.id, worker);
    return worker;
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getWorker(id: string): Worker | undefined {
    return this.workers.get(id);
  }
}