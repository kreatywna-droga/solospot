export class AssertionHelpers {
  public static assertJSONEqual(actual: any, expected: any, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        `${message || 'JSON mismatch'}:\nActual:   ${actualStr}\nExpected: ${expectedStr}`
      );
    }
  }

  public static assertValidRect(rect: { x: number; y: number; width: number; height: number }): void {
    if (
      typeof rect.x !== 'number' ||
      typeof rect.y !== 'number' ||
      typeof rect.width !== 'number' ||
      typeof rect.height !== 'number' ||
      rect.width < 0 ||
      rect.height < 0
    ) {
      throw new Error(`Invalid DOMRect: ${JSON.stringify(rect)}`);
    }
  }
}
