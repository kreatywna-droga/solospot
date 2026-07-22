import { NextResponse } from 'next/server';
import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';

export async function GET() {
  try {
    const packages = await marketplaceProvider.registry.listPackages();
    const capabilities = Array.from(new Set(packages.flatMap(p => p.capabilities)));

    return NextResponse.json({ success: true, capabilities });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
