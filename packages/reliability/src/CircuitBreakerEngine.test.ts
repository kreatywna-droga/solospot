import { describe, it, expect } from 'vitest';
import { CircuitBreakerEngine } from './CircuitBreakerEngine';
import { CircuitState } from './ReliabilityDomain';

describe('CircuitBreakerEngine', () => {
  const engine = new CircuitBreakerEngine();

  it('should start in closed state', () => {
    const breaker = engine.get('test');
    expect(breaker.state).toBe(CircuitState.CLOSED);
  });

  it('should execute successful operation', async () => {
    const breaker = engine.get('success');
    const result = await engine.execute('success', async () => 'ok');
    expect(result).toBe('ok');
    expect(breaker.state).toBe(CircuitState.CLOSED);
  });

  it('should open circuit after failures', async () => {
    const breaker = engine.get('failing');
    for (let i = 0; i < 6; i++) {
      try {
        await engine.execute('failing', async () => { throw new Error('fail'); });
      } catch {}
    }
    expect(breaker.state).toBe(CircuitState.OPEN);
  });
});