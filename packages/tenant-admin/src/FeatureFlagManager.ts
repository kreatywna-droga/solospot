import { FeatureFlag, ResourceLimit } from './TenantAdminDomain';

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag[]> = new Map();

  set(flag: FeatureFlag): void {
    const existing = this.flags.get(flag.organizationId || 'global') || [];
    const filtered = existing.filter(f => f.key !== flag.key);
    filtered.push(flag);
    this.flags.set(flag.organizationId || 'global', filtered);
  }

  get(organizationId: string, key: string): boolean {
    const orgFlags = this.flags.get(organizationId);
    const orgFlag = orgFlags?.find(f => f.key === key);
    if (orgFlag) return orgFlag.enabled;

    const globalFlags = this.flags.get('global');
    const globalFlag = globalFlags?.find(f => f.key === key);
    return globalFlag?.enabled || false;
  }

  list(organizationId: string): FeatureFlag[] {
    const orgFlags = this.flags.get(organizationId) || [];
    const globalFlags = this.flags.get('global') || [];
    return [...globalFlags, ...orgFlags];
  }
}