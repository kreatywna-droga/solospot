import { User, UserRole } from './TenantAdminDomain';

export class UserManager {
  private users: Map<string, User> = new Map();

  create(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  update(id: string, updates: Partial<User>): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.users.delete(id);
  }

  get(id: string): User | undefined {
    return this.users.get(id);
  }

  listByOrg(organizationId: string): User[] {
    return Array.from(this.users.values()).filter(u => u.organizationId === organizationId);
  }

  checkPermission(userId: string, permission: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    if (user.role === UserRole.OWNER) return true;
    if (user.role === UserRole.ADMIN && permission !== 'owner_only') return true;

    return false;
  }
}