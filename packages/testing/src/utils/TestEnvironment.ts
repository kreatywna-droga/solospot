export class TestEnvironment {
  private static envState: Map<string, any> = new Map();

  public static setup(): void {
    TestEnvironment.envState.clear();
    TestEnvironment.envState.set('startTime', Date.now());
  }

  public static teardown(): void {
    TestEnvironment.envState.clear();
  }

  public static setVar(key: string, value: any): void {
    TestEnvironment.envState.set(key, value);
  }

  public static getVar<T>(key: string): T | undefined {
    return TestEnvironment.envState.get(key);
  }
}
