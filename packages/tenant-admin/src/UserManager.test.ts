import { describe, it, expect } from 'vitest';
import { UserManager } from './UserManager';
import { UserRole } from './TenantAdminDomain';

describe('UserManager', () => {
  const manager = new UserManager();

  it('should create user', () => {
    const user = manager.create({
      id: 'user-1',
      organizationId: 'org-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.OWNER,
      createdAt: new Date().toISOString()
    });

    expect(user.id).toBe('user-1');
    expect(user.role).toBe(UserRole.OWNER);
  });

  it('should check owner permission', () => {
    expect(manager.checkPermission('user-1', 'any_permission')).toBe(true);
  });

  it('should check admin permission', () => {
    manager.create({
      id: 'user-2',
      organizationId: 'org-1',
      email: 'member@example.com',
      name: 'Member',
      role: UserRole.MEMBER,
      createdAt: ''
    });

    expect(manager.checkPermission('user-2', 'admin_only')).toBe(false);
  });

  it('should list users by organization', () => {
    const users = manager.listByOrg('org-1');
    expect(users.length).toBeGreaterThan(0);
  });
});