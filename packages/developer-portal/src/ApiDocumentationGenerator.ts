import { ApiEndpoint } from '../../public-api/src/PublicApiDomain';

export interface ApiDocumentation {
  version: string;
  endpoints: ApiEndpoint[];
  schemas: Record<string, unknown>;
}

export class ApiDocumentationGenerator {
  private endpoints: Map<string, ApiEndpoint> = new Map();

  registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.set(endpoint.path, endpoint);
  }

  generate(version: string): ApiDocumentation {
    return {
      version,
      endpoints: Array.from(this.endpoints.values()),
      schemas: {}
    };
  }

  getOpenApiSpec(version: string): Record<string, unknown> {
    const doc = this.generate(version);
    return {
      openapi: '3.0.0',
      info: { title: 'WEB FACTOR API', version: doc.version },
      paths: this.buildPaths(),
      components: { schemas: doc.schemas }
    };
  }

  private buildPaths(): Record<string, unknown> {
    const paths: Record<string, unknown> = {};
    for (const endpoint of this.endpoints.values()) {
      paths[endpoint.path] = {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.description,
          responses: { '200': { description: 'Success' } }
        }
      };
    }
    return paths;
  }
}