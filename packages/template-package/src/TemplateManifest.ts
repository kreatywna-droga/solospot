export interface TemplateCompatibility {
  builder?: string;
  runtime?: string;
}

export interface TemplateManifest {
  id: string;
  version: string;
  type: 'storefront' | 'theme' | 'component' | 'page';
  name: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;
  price: {
    amount: number;
    currency: string;
  } | null;
  tags: string[];
  previewUrl: string;
  screenshots: string[];
  compatibility: TemplateCompatibility;
  dependencies: string[];
  commerceFeatures: ('checkout' | 'products' | 'inventory' | 'customers')[];
  uiCapabilities: ('media-library' | 'component-editor' | 'theme-editor')[];
}

export interface TemplateManifestData {
  manifest: TemplateManifest;
  pages: Record<string, unknown>;
  sections: Record<string, unknown>;
  components: Record<string, unknown>;
  themes: Record<string, unknown>;
  assets: Record<string, unknown>;
  commerce: Record<string, unknown>;
  runtime: Record<string, unknown>;
}

export interface PackageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}