import { NextRequest, NextResponse } from 'next/server';
import type { UniversalAsset } from '@/lib/assets/AssetTypes';

// Curated Shutterstock Sandbox Mock Fallbacks for testing without active API key
const SHUTTERSTOCK_SANDBOX_MOCK_IMAGES: UniversalAsset[] = [
  {
    id: 'ss_img_101',
    provider: 'shutterstock',
    providerAssetId: 'ss_101',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80',
    title: 'Luxury Modern Living Room Interior',
    author: 'Shutterstock Contributor Studio',
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_STANDARD',
      usageRights: 'Commercial SaaS Website Usage',
    },
  },
  {
    id: 'ss_img_102',
    provider: 'shutterstock',
    providerAssetId: 'ss_102',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80',
    title: 'High-End Retail Fashion Store Concept',
    author: 'Shutterstock Premium Lens',
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_STANDARD',
      usageRights: 'Commercial SaaS Website Usage',
    },
  },
  {
    id: 'ss_img_103',
    provider: 'shutterstock',
    providerAssetId: 'ss_103',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1920&q=80',
    title: 'Minimalist Smart Watch Product Showcase',
    author: 'Shutterstock Product Lab',
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_STANDARD',
      usageRights: 'Commercial SaaS Website Usage',
    },
  },
  {
    id: 'ss_img_104',
    provider: 'shutterstock',
    providerAssetId: 'ss_104',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1920&q=80',
    title: 'Wireless Audio Headphones Studio Lighting',
    author: 'Shutterstock AudioVisuals',
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_STANDARD',
      usageRights: 'Commercial SaaS Website Usage',
    },
  },
  {
    id: 'ss_img_105',
    provider: 'shutterstock',
    providerAssetId: 'ss_105',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
    title: 'Artisanal Specialty Coffee Espresso Bar',
    author: 'Shutterstock Gourmet',
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_STANDARD',
      usageRights: 'Commercial SaaS Website Usage',
    },
  },
  {
    id: 'ss_img_106',
    provider: 'shutterstock',
    providerAssetId: 'ss_106',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    sourceUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    title: 'Abstract Fluid Holographic Dark Background',
    author: 'Shutterstock 3D Motion',
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_STANDARD',
      usageRights: 'Commercial SaaS Website Usage',
    },
  },
];

const SHUTTERSTOCK_SANDBOX_MOCK_VIDEOS: UniversalAsset[] = [
  {
    id: 'ss_vid_201',
    provider: 'shutterstock',
    providerAssetId: 'ss_v201',
    type: 'video',
    previewUrl: 'https://assets.mixkit.co/videos/preview/mixkit-luxury-modern-interior-architecture-42353-large.mp4',
    sourceUrl: 'https://assets.mixkit.co/videos/preview/mixkit-luxury-modern-interior-architecture-42353-large.mp4',
    title: 'Cinematic Architectural Tour Loop',
    author: 'Shutterstock Video Lab',
    duration: 15,
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_VIDEO_STANDARD',
      usageRights: 'Commercial Background Video',
    },
  },
  {
    id: 'ss_vid_202',
    provider: 'shutterstock',
    providerAssetId: 'ss_v202',
    type: 'video',
    previewUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-in-slow-motion-42588-large.mp4',
    sourceUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-in-slow-motion-42588-large.mp4',
    title: 'Coffee Beans Slow Motion Macro Background',
    author: 'Shutterstock HighSpeed',
    duration: 12,
    width: 1920,
    height: 1080,
    license: {
      attributionRequired: false,
      licenseType: 'SHUTTERSTOCK_SANDBOX_VIDEO_STANDARD',
      usageRights: 'Commercial Background Video',
    },
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('query') || '').trim().toLowerCase();
  const type = searchParams.get('type') || 'image';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const clientId = process.env.SHUTTERSTOCK_CLIENT_ID;
  const clientSecret = process.env.SHUTTERSTOCK_CLIENT_SECRET;
  const apiToken = process.env.SHUTTERSTOCK_API_TOKEN;

  // If live Shutterstock credentials exist, call Shutterstock API Sandbox
  if (apiToken || (clientId && clientSecret)) {
    try {
      const endpoint = type === 'video'
        ? `https://api.shutterstock.com/v2/videos/search?query=${encodeURIComponent(query || 'luxury')}&page=${page}&per_page=${limit}`
        : `https://api.shutterstock.com/v2/images/search?query=${encodeURIComponent(query || 'luxury')}&page=${page}&per_page=${limit}`;

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      } else if (clientId && clientSecret) {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const res = await fetch(endpoint, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rawItems = data.data || [];
        const assets: UniversalAsset[] = rawItems.map((item: any) => ({
          id: `ss_${item.id}`,
          provider: 'shutterstock',
          providerAssetId: String(item.id),
          type: type === 'video' ? 'video' : 'image',
          previewUrl: item.assets?.preview?.url || item.assets?.huge_thumb?.url || item.assets?.small_thumb?.url || '',
          sourceUrl: item.assets?.preview?.url || item.assets?.huge_thumb?.url || '',
          title: item.description || 'Shutterstock Asset',
          author: item.contributor?.id || 'Shutterstock Contributor',
          width: item.assets?.preview?.width || 1920,
          height: item.assets?.preview?.height || 1080,
          license: {
            attributionRequired: false,
            licenseType: 'SHUTTERSTOCK_STANDARD',
            usageRights: 'Commercial SaaS Website Usage',
          },
        }));

        return NextResponse.json({
          success: true,
          assets,
          total: data.total_count || assets.length,
          page: data.page || page,
          totalPages: Math.ceil((data.total_count || assets.length) / limit),
          provider: 'shutterstock',
          mode: 'live_api',
        });
      }
    } catch (err) {
      console.warn('[Shutterstock API] Call failed, using Sandbox fallback:', err);
    }
  }

  // Sandbox Mode Fallback Response
  const itemsPool = type === 'video' ? SHUTTERSTOCK_SANDBOX_MOCK_VIDEOS : SHUTTERSTOCK_SANDBOX_MOCK_IMAGES;
  const filtered = itemsPool.filter(item => {
    if (!query) return true;
    return item.title?.toLowerCase().includes(query) || item.author?.toLowerCase().includes(query);
  });

  return NextResponse.json({
    success: true,
    assets: filtered.length > 0 ? filtered : itemsPool,
    total: filtered.length > 0 ? filtered.length : itemsPool.length,
    page: 1,
    totalPages: 1,
    provider: 'shutterstock',
    mode: 'sandbox_mock',
  });
}
