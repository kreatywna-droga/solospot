import { RetryPolicy, IdempotencyKey } from './ReliabilityDomain';

export class RetryEngine {
  private policies: Map<string, RetryPolicy> = new Map();
  private idempotency: Map<string, IdempotencyKey> = new Map();

  setPolicy(name: string, policy: RetryPolicy): void {
    this.policies.set(name, policy);
  }

  async execute<T>(operationId: string, operation: () => Promise<T>, policyName = 'default'): Promise<T> {
    const policy = this.policies.get(policyName) || { maxRetries: 3, backoffMs: 1000, exponential: false };

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < policy.maxRetries) {
          const delay = policy.exponential ? policy.backoffMs * Math.pow(2, attempt) : policy.backoffMs;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed');
  }

  setIdempotency(key: string, operation: string, result?: unknown): void {
    this.idempotency.set(key, { key, operation, result, createdAt: new Date() });
  }

  getIdempotency(key: string): IdempotencyKey | undefined {
    return this.idempotency.get(key);
  }
}