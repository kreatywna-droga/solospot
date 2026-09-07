import { NextRequest, NextResponse } from 'next/server';
import type { UniversalAsset } from '@/lib/assets/AssetTypes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assetId, tenantId, storeId, projectId, type } = body;

    if (!assetId || !tenantId || !storeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters (assetId, tenantId, storeId)' },
        { status: 400 }
      );
    }

    const licenseId = `lic_ss_${crypto.randomUUID()}`;
    const licensedAt = new Date().toISOString();

    const licensedAsset: UniversalAsset = {
      id: assetId,
      provider: 'shutterstock',
      providerAssetId: String(assetId).replace(/^ss_/, ''),
      type: type || 'image',
      previewUrl: body.previewUrl || body.sourceUrl || '',
      sourceUrl: body.sourceUrl || body.previewUrl || '',
      title: body.title || 'Shutterstock Licensed Asset',
      author: body.author || 'Shutterstock Contributor',
      license: {
        licenseId,
        licenseType: 'SHUTTERSTOCK_SANDBOX_LICENSED',
        licensedAt,
        usageRights: 'Commercial SaaS SoloSpot Web License',
        attributionRequired: false,
        tenantId,
        storeId,
        projectId,
      },
      metadata: {
        licensedInSandbox: true,
        tenantId,
        storeId,
      },
    };

    return NextResponse.json({
      success: true,
      asset: licensedAsset,
      licenseId,
      licensedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Licensing failed' },
      { status: 500 }
    );
  }
}
