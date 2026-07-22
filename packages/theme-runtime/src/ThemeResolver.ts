import { ThemeManifest, ThemeManifestSchema } from './ThemeManifest';
import { TenantSecurityException } from '../../commerce-engine/src/CommerceEngine';

export class ThemeNotFoundException extends Error {
  constructor(themeId: string) {
    super(`Theme manifest not found: '${themeId}'`);
    this.name = 'ThemeNotFoundException';
  }
}

export class ThemeResolver {
  private readonly manifests = new Map<string, ThemeManifest & { tenantId?: string }>();

  /**
   * Register a theme manifest with an optional tenantId owner (system/global themes have undefined tenantId)
   */
  public registerTheme(manifest: ThemeManifest, tenantId?: string): void {
    ThemeManifestSchema.parse(manifest);
    this.manifests.set(manifest.id, { ...manifest, tenantId });
  }

  public async resolveTheme(tenantId: string, themeId: string): Promise<ThemeManifest> {
    const theme = this.manifests.get(themeId);
    if (!theme) {
      throw new ThemeNotFoundException(themeId);
    }

    // Tenant Isolation Check
    if (theme.tenantId && theme.tenantId !== tenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked for Theme '${themeId}'. Active: ${tenantId}, Owner: ${theme.tenantId}`
      );
    }

    return theme;
  }

  public clear(): void {
    this.manifests.clear();
  }
}
