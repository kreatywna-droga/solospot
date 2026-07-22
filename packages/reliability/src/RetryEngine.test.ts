import { describe, it, expect } from 'vitest';
import { RetryEngine } from './RetryEngine';

describe('RetryEngine', () => {
  const engine = new RetryEngine();

  it('should execute without retry on success', async () => {
    const result = await engine.execute('op-1', async () => 42);
    expect(result).toBe(42);
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const result = await engine.execute('op-2', async () => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return 'success';
    });

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  it('should support idempotency', () => {
    engine.setIdempotency('key-1', 'create-store', { id: 'store-1' });
    const key = engine.getIdempotency('key-1');
    expect(key?.operation).toBe('create-store');
  });
});