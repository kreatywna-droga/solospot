import { describe, it, expect } from 'vitest';
import { DeveloperPortal } from './DeveloperPortal';
import { ApiDocumentationGenerator } from './ApiDocumentationGenerator';

describe('DeveloperPortal', () => {
  const portal = new DeveloperPortal();

  it('should register developer account', () => {
    const account = portal.registerAccount({
      id: 'dev-1',
      email: 'dev@example.com',
      name: 'Developer',
      createdAt: new Date().toISOString()
    });

    expect(account.id).toBe('dev-1');
    expect(portal.getAccount('dev-1')).toBeDefined();
  });

  it('should create organization', () => {
    const org = portal.createOrganization({
      id: 'org-dev-1',
      name: 'Dev Org',
      developerId: 'dev-1',
      createdAt: new Date().toISOString()
    });

    expect(org.name).toBe('Dev Org');
  });

  it('should list applications by developer', () => {
    portal.createApplication({
      id: 'app-1',
      name: 'App 1',
      developerId: 'dev-1',
      description: 'Test app',
      permissions: ['stores:read'],
      createdAt: new Date().toISOString()
    });

    const apps = portal.getApplications('dev-1');
    expect(apps.length).toBe(1);
  });
});

describe('ApiDocumentationGenerator', () => {
  const gen = new ApiDocumentationGenerator();

  it('should generate OpenAPI spec', () => {
    gen.registerEndpoint({
      path: '/stores',
      method: 'GET',
      authRequired: true,
      rateLimit: 100,
      description: 'List stores',
      response: { status: 200, body: {} },
    });

    const spec = gen.getOpenApiSpec('1.0.0');
    expect(spec.openapi).toBe('3.0.0');
  });
});