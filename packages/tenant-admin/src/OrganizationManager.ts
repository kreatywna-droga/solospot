import { Organization } from '../../platform-identity/src/PlatformIdentity';

export class OrganizationManager {
  private organizations: Map<string, Organization> = new Map();

  create(organization: Organization): Organization {
    this.organizations.set(organization.id, organization);
    return organization;
  }

  update(id: string, updates: Partial<Organization>): Organization | null {
    const org = this.organizations.get(id);
    if (!org) return null;

    const updated = { ...org, ...updates };
    this.organizations.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.organizations.delete(id);
  }

  get(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  list(): Organization[] {
    return Array.from(this.organizations.values());
  }
}