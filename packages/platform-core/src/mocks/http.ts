export function createMockRequest(options: { url?: string; headers?: Record<string, string> } = {}) {
  const normalizedHeaders: Record<string, string> = {};
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      normalizedHeaders[key.toLowerCase()] = value;
    }
  }
  return {
    url: options.url || 'http://localhost/',
    headers: normalizedHeaders,
  };
}

export function createMockResponse() {
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    headers,
    body: undefined as string | undefined,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
    },
    end(body?: string) {
      this.body = body;
    },
  };
}
