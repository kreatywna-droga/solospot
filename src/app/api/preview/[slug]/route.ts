import { NextResponse } from 'next/server';
import { renderStore, clearRenderStoreCache } from '@/lib/runtime';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/[slug]
 *
 * Renders a store in PREVIEW mode using the unified renderStore() pipeline.
 * Used by BuilderCanvas to display sections with preview markers.
 *
 * Query params:
 *   - mode: 'PREVIEW' | 'LIVE' | 'EXPORT' (default: PREVIEW)
 *   - locale: string (default: pl)
 *   - currency: string (default: PLN)
 *   - noCache: boolean (default: false)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const mode = (url.searchParams.get('mode') || 'PREVIEW') as 'PREVIEW' | 'LIVE' | 'EXPORT';
  const locale = url.searchParams.get('locale') || 'pl';
  const currency = url.searchParams.get('currency') || 'PLN';
  const noCache = url.searchParams.get('noCache') === 'true';

  if (noCache) {
    clearRenderStoreCache();
  }

  try {
    const result = await renderStore({
      slug,
      mode,
      locale,
      currency,
      correlationId: `api_preview_${Date.now()}`,
    });

    if (!result) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: 'Store is not available',
        details: result.errors,
        publicationStatus: result.publicationStatus,
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Preview API error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    );
  }
}

