import { Domain, DomainBinding } from './DomainDomain';
import { PlatformContext } from '../../platform-identity/src/PlatformContracts';

export class DomainRouting {
  private bindings: Map<string, DomainBinding> = new Map();

  bindDomain(platformContext: PlatformContext, domain: Domain): DomainBinding | null {
    const maxDomains = platformContext.capabilities.customDomains ? 999999 : 1;
    const currentDomains = this.getBindings(platformContext.organizationId);

    if (currentDomains.length >= maxDomains) return null;

    const binding: DomainBinding = {
      domainId: domain.id,
      tenantId: domain.tenantId,
      organizationId: platformContext.organizationId,
      environmentId: '',
      hostname: domain.hostname,
      isPrimary: currentDomains.length === 0,
      redirectToPrimary: false,
      sslEnabled: false
    };

    this.bindings.set(domain.id, binding);
    return binding;
  }

  getBindings(organizationId: string): DomainBinding[] {
    return Array.from(this.bindings.values()).filter(b => b.organizationId === organizationId);
  }

  getPrimary(tenantId: string): DomainBinding | undefined {
    return Array.from(this.bindings.values()).find(b => b.tenantId === tenantId && b.isPrimary);
  }

  setPrimary(domainId: string): boolean {
    const binding = this.bindings.get(domainId);
    if (!binding) return false;

    for (const b of this.bindings.values()) {
      if (b.organizationId === binding.organizationId) {
        b.isPrimary = false;
      }
    }

    binding.isPrimary = true;
    return true;
  }

  removeBinding(domainId: string): void {
    this.bindings.delete(domainId);
  }
}