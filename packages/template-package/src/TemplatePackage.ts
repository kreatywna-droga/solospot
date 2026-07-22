import { TemplateManifest, TemplateManifestData, PackageValidationResult } from './TemplateManifest';

export class TemplatePackage {
  readonly manifest: TemplateManifest;
  private readonly _pages: Record<string, unknown>;
  private readonly _sections: Record<string, unknown>;
  private readonly _components: Record<string, unknown>;
  private readonly _themes: Record<string, unknown>;
  private readonly _assets: Record<string, unknown>;
  private readonly _commerce: Record<string, unknown>;
  private readonly _runtime: Record<string, unknown>;

  constructor(packageData: TemplateManifestData) {
    this.manifest = packageData.manifest;
    this._pages = packageData.pages || {};
    this._sections = packageData.sections || {};
    this._components = packageData.components || {};
    this._themes = packageData.themes || {};
    this._assets = packageData.assets || {};
    this._commerce = packageData.commerce || {};
    this._runtime = packageData.runtime || {};
  }

  get pages() { return this._pages; }
  get sections() { return this._sections; }
  get components() { return this._components; }
  get themes() { return this._themes; }
  get assets() { return this._assets; }
  get commerce() { return this._commerce; }
  get runtime() { return this._runtime; }

  validate(): PackageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.manifest.id) errors.push('Missing manifest.id');
    if (!this.manifest.version) errors.push('Missing manifest.version');
    if (!this.manifest.name) errors.push('Missing manifest.name');
    if (!this.manifest.type) errors.push('Missing manifest.type');
    if (!this.manifest.author?.name) errors.push('Missing manifest.author.name');
    if (!this.manifest.previewUrl) warnings.push('Missing manifest.previewUrl');

    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (this.manifest.version && !versionRegex.test(this.manifest.version)) {
      errors.push(`Invalid version format: ${this.manifest.version}. Expected semver (e.g., 1.0.0)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  getVersion(): string {
    return this.manifest.version;
  }

  getId(): string {
    return this.manifest.id;
  }

  getType(): string {
    return this.manifest.type;
  }

  getDependencies(): string[] {
    return this.manifest.dependencies || [];
  }

  hasCommerceFeature(feature: string): boolean {
    return this.manifest.commerceFeatures?.includes(feature as any) || false;
  }
}

export function createTemplatePackage(data: TemplateManifestData): TemplatePackageInstance {
  return new TemplatePackageInstance(data);
}

export class TemplatePackageInstance {
  private readonly _package: TemplatePackage;

  constructor(data: TemplateManifestData) {
    this._package = new TemplatePackage(data);
  }

  get manifest(): TemplateManifest { return this._package.manifest; }
  get pages() { return this._package.pages; }
  get sections() { return this._package.sections; }
  get components() { return this._package.components; }
  get themes() { return this._package.themes; }
  get assets() { return this._package.assets; }
  get commerce() { return this._package.commerce; }
  get runtime() { return this._package.runtime; }

  validate(): PackageValidationResult {
    return this._package.validate();
  }

  toJSON(): TemplateManifestData {
    return {
      manifest: this.manifest,
      pages: this.pages,
      sections: this.sections,
      components: this.components,
      themes: this.themes,
      assets: this.assets,
      commerce: this.commerce,
      runtime: this.runtime
    };
  }
}