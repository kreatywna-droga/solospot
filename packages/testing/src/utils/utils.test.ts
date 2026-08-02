import { describe, it, expect } from 'vitest';
import { RandomDataHelpers } from './RandomDataHelpers';
import { AssertionHelpers } from './AssertionHelpers';
import { TestEnvironment } from './TestEnvironment';

describe('Test Utilities', () => {
  it('should generate random helpers correctly', () => {
    const id = RandomDataHelpers.randomId('test');
    expect(id).toMatch(/^test_/);

    const str = RandomDataHelpers.randomString(10);
    expect(str.length).toBe(10);

    const num = RandomDataHelpers.randomNumber(5, 10);
    expect(num).toBeGreaterThanOrEqual(5);
    expect(num).toBeLessThanOrEqual(10);
  });

  it('should pass valid JSON equality assertion', () => {
    expect(() => {
      AssertionHelpers.assertJSONEqual({ a: 1 }, { a: 1 });
    }).not.toThrow();

    expect(() => {
      AssertionHelpers.assertJSONEqual({ a: 1 }, { a: 2 });
    }).toThrow();
  });

  it('should assert valid rects', () => {
    expect(() => {
      AssertionHelpers.assertValidRect({ x: 0, y: 10, width: 100, height: 50 });
    }).not.toThrow();

    expect(() => {
      AssertionHelpers.assertValidRect({ x: 0, y: 10, width: -10, height: 50 });
    }).toThrow();
  });

  it('should manage test environment state', () => {
    TestEnvironment.setup();
    TestEnvironment.setVar('foo', 'bar');
    expect(TestEnvironment.getVar('foo')).toBe('bar');
    TestEnvironment.teardown();
    expect(TestEnvironment.getVar('foo')).toBeUndefined();
  });
});
