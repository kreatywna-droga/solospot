export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreaker {
  name: string;
  state: CircuitState;
  failureCount: number;
  lastFailure?: Date;
  timeout: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  exponential: boolean;
}

export interface IdempotencyKey {
  key: string;
  operation: string;
  result?: unknown;
  createdAt: Date;
}