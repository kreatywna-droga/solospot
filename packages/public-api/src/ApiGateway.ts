import { ApiEndpoint, ApiKey } from './PublicApiDomain';

export class ApiGateway {
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private keys: Map<string, ApiKey> = new Map();

  registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.set(endpoint.path, endpoint);
  }

  createKey(name: string, scopes: string[]): ApiKey {
    const key: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      scopes,
      createdAt: new Date().toISOString()
    };

    this.keys.set(key.id, key);
    return key;
  }

  validateKey(keyId: string): boolean {
    return this.keys.has(keyId);
  }

  checkScope(keyId: string, scope: string): boolean {
    const key = this.keys.get(keyId);
    return key?.scopes.includes(scope) || false;
  }

  getEndpoint(path: string): ApiEndpoint | undefined {
    return this.endpoints.get(path);
  }
}