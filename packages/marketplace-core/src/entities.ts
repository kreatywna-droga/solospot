export interface MarketplaceAuthor {
  id: string;
  name: string;
  email?: string;
  url?: string;
  avatar?: string;
}

export interface MarketplaceCompatibility {
  builder?: string;
  runtime?: string;
  componentApi?: string;
  themeApi?: string;
  commerceApi?: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description?: string;
}

export interface MarketplaceTag {
  id: string;
  name: string;
  color?: string;
}

export interface MarketplaceRating {
  userId: string;
  score: number;
  review?: string;
  createdAt: string;
}

export interface MarketplaceVersionMetadata {
  id: string;
  version: string;
  releaseNotes?: string;
  publishedAt: string;
  author: MarketplaceAuthor;
  isStable: boolean;
  downloads: number;
}

export interface MarketplaceTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: MarketplaceAuthor;
  license: string;
  price: {
    amount: number;
    currency: string;
    free?: boolean;
  } | null;
  tags: string[];
  categories: string[];
  dependencies: string[];
  screenshots: string[];
  previewUrl: string;
  compatibility: MarketplaceCompatibility;
  ratings: MarketplaceRating[];
  versions: MarketplaceVersionMetadata[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInstallMetadata {
  requiredComponents: string[];
  requiredThemes: string[];
  requiredAssets: string[];
  requiredCommercePackages: string[];
  migrations: string[];
  minPlatformVersion: string;
}

export interface MarketplaceSearchQuery {
  query?: string;
  tags?: string[];
  categories?: string[];
  authorId?: string;
  type?: 'storefront' | 'theme' | 'component' | 'page';
  price?: 'free' | 'paid';
  sortBy?: 'popular' | 'recent' | 'rating' | 'name';
  limit?: number;
  offset?: number;
}

export interface MarketplaceSearchResult {
  total: number;
  templates: MarketplaceTemplate[];
}

export interface PlatformVersion {
  builder: string;
  runtime: string;
  componentApi: string;
  themeApi: string;
  commerceApi: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  issues: string[];
}