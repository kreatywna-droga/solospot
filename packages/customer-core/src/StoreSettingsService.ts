import { getServiceSupabase } from '@/lib/supabase';
import { CustomerContext } from './CustomerContext';

export interface StoreSettings {
  name?: string;
  logoUrl?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    font?: string;
    description?: string;
  };
  domain?: string;
  seo?: {
    titleTemplate?: string;
    metaDescription?: string;
    ogImage?: string;
  };
}

export interface StoreSettingsService {
  getSettings(ctx: CustomerContext): Promise<StoreSettings>;
  updateSettings(ctx: CustomerContext, settings: StoreSettings): Promise<StoreSettings>;
}

export class DefaultStoreSettingsService implements StoreSettingsService {
  private checkAccess(ctx: CustomerContext) {
    if (!ctx.tenantId || !ctx.storeId) {
      throw new Error('Unauthorized: Invalid customer context');
    }
  }

  async getSettings(ctx: CustomerContext): Promise<StoreSettings> {
    this.checkAccess(ctx);
    const supabase = getServiceSupabase();

    const { data: store, error } = await supabase
      .from('stores')
      .select('name, domain, config')
      .eq('id', ctx.storeId)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();

    if (error || !store) {
      throw new Error(`Failed to retrieve store settings: ${error?.message || ''}`);
    }

    const config = store.config || {};

    return {
      name: store.name,
      domain: store.domain || undefined,
      logoUrl: config.logoUrl || undefined,
      branding: config.branding || undefined,
      seo: config.seo || undefined,
    };
  }

  async updateSettings(ctx: CustomerContext, settings: StoreSettings): Promise<StoreSettings> {
    this.checkAccess(ctx);
    const supabase = getServiceSupabase();

    // 1. Fetch current config to merge
    const { data: store, error: fetchErr } = await supabase
      .from('stores')
      .select('name, domain, config')
      .eq('id', ctx.storeId)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();

    if (fetchErr || !store) {
      throw new Error(`Store not found or access denied: ${fetchErr?.message || ''}`);
    }

    const currentConfig = store.config || {};

    // 2. Prepare updated config
    const updatedConfig = {
      ...currentConfig,
    };

    if (settings.logoUrl !== undefined) updatedConfig.logoUrl = settings.logoUrl;
    if (settings.branding !== undefined) {
      updatedConfig.branding = {
        ...(currentConfig.branding || {}),
        ...settings.branding,
      };
    }
    if (settings.seo !== undefined) {
      updatedConfig.seo = {
        ...(currentConfig.seo || {}),
        ...settings.seo,
      };
    }

    // 3. Update store row
    const updateData: Record<string, any> = {
      config: updatedConfig,
      updated_at: new Date().toISOString(),
    };

    if (settings.name !== undefined) updateData.name = settings.name;
    if (settings.domain !== undefined) updateData.domain = settings.domain;

    const { error: updateErr } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', ctx.storeId)
      .eq('tenant_id', ctx.tenantId);

    if (updateErr) {
      throw new Error(`Failed to update store settings: ${updateErr.message}`);
    }

    return {
      name: settings.name ?? store.name,
      domain: settings.domain ?? store.domain ?? undefined,
      logoUrl: updatedConfig.logoUrl,
      branding: updatedConfig.branding,
      seo: updatedConfig.seo,
    };
  }
}
