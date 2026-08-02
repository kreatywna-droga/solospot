export class RandomDataHelpers {
  public static randomId(prefix: string = 'id'): string {
    const hash = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${hash}`;
  }

  public static randomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public static randomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static randomBoolean(): boolean {
    return Math.random() >= 0.5;
  }

  public static randomElement<T>(arr: T[]): T {
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }
}
