import { 
  MarketplaceTemplate, 
  MarketplaceAuthor,
  MarketplaceCategory,
  MarketplaceTag,
  MarketplaceVersionMetadata,
  TemplateInstallMetadata,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  PlatformVersion,
  CompatibilityResult
} from './entities';

export interface InstallOptions {
  tenantId: string;
  installAssets: boolean;
  installComponents: boolean;
  installThemes: boolean;
}

export interface InstallResult {
  success: boolean;
  templateId: string;
  tenantId: string;
  installedComponents: string[];
  installedThemes: string[];
  installedAssets: string[];
  errors: string[];
}

export interface MarketplaceRegistry {
  registerTemplate(template: MarketplaceTemplate): Promise<void>;
  updateTemplate(id: string, updates: Partial<MarketplaceTemplate>): Promise<void>;
  publishVersion(id: string, version: MarketplaceVersionMetadata): Promise<void>;
  archiveVersion(id: string, version: string): Promise<void>;

  getTemplate(id: string): Promise<MarketplaceTemplate | null>;
  getTemplateBySlug(slug: string): Promise<MarketplaceTemplate | null>;
  getVersions(id: string): Promise<MarketplaceVersionMetadata[]>;

  searchTemplates(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult>;

  installTemplate(id: string, options?: InstallOptions): Promise<InstallResult>;
  uninstallTemplate(id: string, tenantId: string): Promise<void>;

  getCompatibility(id: string, platformVersion: PlatformVersion): CompatibilityResult;
}