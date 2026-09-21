/**
 * /api/ai/models/route.ts — SoloSpot OpenCode Models Endpoint
 *
 * Exposes dynamic models discovery, categories (free/paid), and capability status
 * to the Studio UI Model Picker.
 */

import { NextResponse } from 'next/server';
import { OpenCodeModelDiscovery } from '@/lib/ai/OpenCodeModelDiscovery';
import { OpenCodeModelRouter } from '@/lib/ai/OpenCodeModelRouter';

export async function GET() {
  try {
    const discovery = OpenCodeModelDiscovery.getInstance();
    const router = OpenCodeModelRouter.getInstance();

    const catalog = await discovery.discoverModels();
    const autoResolution = await router.resolveModel('AUTO');

    return NextResponse.json({
      status: 'SUCCESS',
      provider: 'OpenCode',
      currentModel: autoResolution.selectedModel,
      source: catalog.source,
      models: catalog.models,
      freeModels: catalog.freeModels,
      paidModels: catalog.paidModels,
      counts: {
        total: catalog.models.length,
        free: catalog.freeModels.length,
        paid: catalog.paidModels.length,
      },
    });
  } catch (err: any) {
    console.error('[/api/ai/models] Error:', err);
    return NextResponse.json(
      {
        status: 'ERROR',
        provider: 'OpenCode',
        message: 'Nie udało się pobrać katalogu modeli OpenCode.',
        error: String(err?.message || err),
        models: [],
        freeModels: [],
        paidModels: [],
      },
      { status: 500 }
    );
  }
}
