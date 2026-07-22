import { NextResponse } from 'next/server';
import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';

export async function GET() {
  try {
    const result = await marketplaceProvider.marketplace.search({
      categories: ['Themes']
    });

    return NextResponse.json({ success: true, themes: result.items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
