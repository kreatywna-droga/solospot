import { getServiceSupabase } from '@/lib/supabase';
import { CustomerContext } from './CustomerContext';

export interface StoreDashboardService {
  getOverview(ctx: CustomerContext): Promise<any>;
  getStoreStatus(ctx: CustomerContext): Promise<any>;
  getUsage(ctx: CustomerContext): Promise<any>;
}

export class DefaultStoreDashboardService implements StoreDashboardService {
  private checkAccess(ctx: CustomerContext) {
    if (!ctx.tenantId || !ctx.storeId) {
      throw new Error('Unauthorized: Invalid customer context');
    }
  }

  async getOverview(ctx: CustomerContext): Promise<any> {
    this.checkAccess(ctx);
    const supabase = getServiceSupabase();

    // 1. Fetch store info
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('name, status, config, domain, slug')
      .eq('id', ctx.storeId)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();

    if (storeErr || !store) {
      throw new Error(`Store not found or access denied: ${storeErr?.message || ''}`);
    }

    // 2. Fetch page and product counts
    const { count: pagesCount } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', ctx.storeId);

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', ctx.storeId);

    // 3. Fetch orders / revenue from commerce orders table (mock fallback if table doesn't exist yet)
    let ordersCount = 0;
    let revenue = 0;
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('store_id', ctx.storeId);

      if (orders) {
        ordersCount = orders.length;
        revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      }
    } catch {
      // Fallback if orders table doesn't exist/empty
    }

    return {
      storeId: ctx.storeId,
      name: store.name,
      slug: store.slug,
      domain: store.domain,
      status: store.status,
      pagesCount: pagesCount || 0,
      productsCount: productsCount || 0,
      ordersCount,
      revenue,
      branding: store.config?.branding || {},
    };
  }

  async getStoreStatus(ctx: CustomerContext): Promise<any> {
    this.checkAccess(ctx);
    const supabase = getServiceSupabase();

    const { data: store, error } = await supabase
      .from('stores')
      .select('status, config, updated_at')
      .eq('id', ctx.storeId)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();

    if (error || !store) {
      throw new Error(`Failed to retrieve store status: ${error?.message || ''}`);
    }

    // Find the latest deployment
    const { data: deployment } = await supabase
      .from('deployments')
      .select('id, status, url, created_at')
      .eq('store_id', ctx.storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      status: store.status,
      publicationStatus: store.config?.publicationStatus || 'DRAFT',
      lastUpdated: store.updated_at,
      latestDeployment: deployment ? {
        id: deployment.id,
        status: deployment.status,
        url: deployment.url,
        deployedAt: deployment.created_at
      } : null
    };
  }

  async getUsage(ctx: CustomerContext): Promise<any> {
    this.checkAccess(ctx);
    const supabase = getServiceSupabase();

    // Fetch tenant limits
    const { data: tenant } = await supabase
      .from('tenants')
      .select('package_id')
      .eq('id', ctx.tenantId)
      .maybeSingle();

    // Mock limits based on tier package
    const packageId = tenant?.package_id || 'standard';
    const limits = packageId === 'enterprise'
      ? { maxPages: 100, maxProducts: 5000 }
      : packageId === 'growth'
        ? { maxPages: 25, maxProducts: 500 }
        : { maxPages: 5, maxProducts: 50 }; // standard/free fallback

    const { count: pagesCount } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', ctx.storeId);

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', ctx.storeId);

    return {
      packageId,
      usage: {
        pages: {
          current: pagesCount || 0,
          limit: limits.maxPages
        },
        products: {
          current: productsCount || 0,
          limit: limits.maxProducts
        }
      }
    };
  }
}
