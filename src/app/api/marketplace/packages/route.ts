import { NextRequest, NextResponse } from 'next/server';
import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text') || undefined;
    const categories = searchParams.getAll('category');
    const tags = searchParams.getAll('tag');
    const capabilities = searchParams.getAll('capability');
    const publisher = searchParams.get('publisher') || undefined;
    const license = searchParams.get('license') || undefined;
    const sort = (searchParams.get('sort') as any) || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;

    const result = await marketplaceProvider.marketplace.search({
      text,
      categories: categories.length > 0 ? categories : undefined,
      tags: tags.length > 0 ? tags : undefined,
      capabilities: capabilities.length > 0 ? capabilities : undefined,
      publisher,
      license,
      sort,
      limit,
      offset
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
