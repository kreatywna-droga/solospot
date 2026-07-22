import { describe, it, expect } from 'vitest';
import { OrganizationManager } from './OrganizationManager';
import { Organization } from '../../platform-identity/src/PlatformIdentity';

describe('OrganizationManager', () => {
  const manager = new OrganizationManager();

  it('should create organization', () => {
    const org: Organization = {
      id: 'org-1',
      name: 'Acme Corp',
      createdAt: new Date().toISOString()
    };

    const created = manager.create(org);
    expect(created.id).toBe('org-1');
    expect(created.name).toBe('Acme Corp');
  });

  it('should update organization', () => {
    manager.create({ id: 'org-2', name: 'Old Name', createdAt: '' });
    const updated = manager.update('org-2', { name: 'New Name' });

    expect(updated?.name).toBe('New Name');
  });

  it('should delete organization', () => {
    manager.create({ id: 'org-3', name: 'To Delete', createdAt: '' });
    const deleted = manager.delete('org-3');

    expect(deleted).toBe(true);
    expect(manager.get('org-3')).toBeUndefined();
  });

  it('should list organizations', () => {
    const list = manager.list();
    expect(list.length).toBeGreaterThan(0);
  });
});