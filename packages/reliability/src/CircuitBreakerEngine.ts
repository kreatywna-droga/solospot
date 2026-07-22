import { CircuitBreaker, CircuitState, RetryPolicy } from './ReliabilityDomain';

export class CircuitBreakerEngine {
  private breakers: Map<string, CircuitBreaker> = new Map();

  get(name: string, timeout = 60000): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, { name, state: CircuitState.CLOSED, failureCount: 0, timeout });
    }
    return this.breakers.get(name)!;
  }

  async execute<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const breaker = this.get(name);

    if (breaker.state === CircuitState.OPEN) {
      const canRetry = breaker.lastFailure && Date.now() - breaker.lastFailure.getTime() > breaker.timeout;
      if (!canRetry) {
        throw new Error(`Circuit breaker ${name} is open`);
      }
      breaker.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await operation();
      breaker.failureCount = 0;
      breaker.state = CircuitState.CLOSED;
      return result;
    } catch (error) {
      breaker.failureCount++;
      breaker.lastFailure = new Date();

      if (breaker.failureCount >= 5) {
        breaker.state = CircuitState.OPEN;
      }

      throw error;
    }
  }
}