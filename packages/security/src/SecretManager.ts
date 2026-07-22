export class SecretManager {
  private secrets: Map<string, string> = new Map();

  set(key: string, value: string): void {
    this.secrets.set(key, value.split('').reverse().join(''));
  }

  get(key: string): string | undefined {
    const encoded = this.secrets.get(key);
    return encoded ? encoded.split('').reverse().join('') : undefined;
  }
}