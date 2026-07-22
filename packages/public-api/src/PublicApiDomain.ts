export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authRequired: boolean;
  rateLimit: number;
  description: string;
  request?: {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
  };
  response: {
    status: number;
    body: Record<string, unknown>;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface ApiClient {
  key: string;
  baseUrl: string;
  version: string;
}