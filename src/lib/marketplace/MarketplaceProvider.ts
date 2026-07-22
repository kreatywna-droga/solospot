import { InMemoryPackageRegistry } from '../../../packages/package-registry/src/PackageRegistry';
import { InMemoryMarketplace } from '../../../packages/package-registry/src/marketplace/InMemoryMarketplace';
import { DefaultMarketplaceInstaller } from '../../../packages/package-registry/src/marketplace/DefaultMarketplaceInstaller';
import { PackageManifest } from '../../../packages/package-registry/src/PackageManifest';
import { MarketplaceListing } from '../../../packages/package-registry/src/marketplace/MarketplaceListing';

class MarketplaceProvider {
  readonly registry = new InMemoryPackageRegistry();
  readonly marketplace = new InMemoryMarketplace(this.registry);
  readonly installer = new DefaultMarketplaceInstaller(this.registry);

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed templates, themes, payment gateways, etc.
    const packages: PackageManifest[] = [
      {
        id: 'theme-ocean',
        name: 'Ocean Theme',
        version: '1.0.0',
        type: 'theme',
        dependencies: {},
        capabilities: ['theme'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'Oceanic Inc',
        license: 'MIT'
      },
      {
        id: 'theme-sunset',
        name: 'Sunset Theme',
        version: '1.2.0',
        type: 'theme',
        dependencies: {},
        capabilities: ['theme'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'Sunsets Dev',
        license: 'MIT',
        deprecated: true,
        deprecatedSince: '2026-06-01',
        replacement: 'theme-ocean'
      },
      {
        id: 'payment-stripe',
        name: 'Stripe Gateway',
        version: '1.5.0',
        type: 'payment',
        dependencies: {},
        capabilities: ['payments'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'Stripe Inc',
        license: 'MIT',
        migrations: [
          { from: '1.0.0', to: '1.5.0', description: 'Migrate stripe config metadata format' }
        ]
      },
      {
        id: 'payment-paypal',
        name: 'PayPal Gateway',
        version: '1.0.0',
        type: 'payment',
        dependencies: {},
        capabilities: ['payments'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'PayPal Inc',
        license: 'MIT'
      },
      {
        id: 'analytics-posthog',
        name: 'PostHog Analytics',
        version: '1.0.0',
        type: 'analytics',
        dependencies: {},
        capabilities: ['analytics'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'PostHog Devs',
        license: 'MIT'
      }
    ];

    const listings: MarketplaceListing[] = [
      {
        id: 'theme-ocean',
        title: 'Oceanic Storefront Theme',
        description: 'Vibrant blue layout for retail stores and digital goods.',
        author: 'Oceanic Inc',
        publisher: 'Oceanic Publishing',
        category: 'Themes',
        tags: ['blue', 'clean', 'retail'],
        rating: 4.8,
        downloads: 1520,
        license: 'MIT',
        price: 0,
        visibility: 'public',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-07-19T00:00:00Z'
      },
      {
        id: 'theme-sunset',
        title: 'Sunset Scenic Storefront Theme',
        description: 'Warm color palette theme, deprecated in favor of Ocean.',
        author: 'Sunsets Dev',
        publisher: 'ThemeDevs',
        category: 'Themes',
        tags: ['warm', 'scenic'],
        rating: 4.1,
        downloads: 890,
        license: 'MIT',
        price: 29,
        visibility: 'public',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z'
      },
      {
        id: 'payment-stripe',
        title: 'Stripe Payments Integration',
        description: 'Accept credit card payments worldwide instantly.',
        author: 'Stripe Inc',
        publisher: 'Stripe Official',
        category: 'Payments',
        tags: ['credit card', 'global', 'stripe'],
        rating: 4.9,
        downloads: 4890,
        license: 'MIT',
        price: 0,
        visibility: 'public',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      },
      {
        id: 'payment-paypal',
        title: 'PayPal Checkout Gateway',
        description: 'Allow customers to check out via PayPal buttons.',
        author: 'PayPal Inc',
        publisher: 'PayPal Official',
        category: 'Payments',
        tags: ['paypal', 'express'],
        rating: 4.6,
        downloads: 2310,
        license: 'MIT',
        price: 0,
        visibility: 'public',
        createdAt: '2026-01-12T00:00:00Z',
        updatedAt: '2026-05-10T00:00:00Z'
      },
      {
        id: 'analytics-posthog',
        title: 'PostHog Product Analytics',
        description: 'Track user behaviour, page views, and conversion flows.',
        author: 'PostHog Devs',
        publisher: 'PostHog',
        category: 'Analytics',
        tags: ['telemetry', 'product analytics'],
        rating: 4.7,
        downloads: 720,
        license: 'MIT',
        price: 0,
        visibility: 'public',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-07-18T00:00:00Z'
      }
    ];

    for (const pkg of packages) {
      this.registry.register(pkg, new Uint8Array()).catch(() => {});
    }

    for (const listing of listings) {
      this.marketplace.addListing(listing).catch(() => {});
    }
  }
}

// Global singleton to prevent hot-reload re-instantiation in Next.js dev server
const globalVar = globalThis as any;
if (!globalVar.marketplaceProvider) {
  globalVar.marketplaceProvider = new MarketplaceProvider();
}

export const marketplaceProvider = globalVar.marketplaceProvider as MarketplaceProvider;
