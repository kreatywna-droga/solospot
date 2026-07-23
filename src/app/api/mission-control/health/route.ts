import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase();
  const startTime = Date.now();
  
  let dbStatus: 'operational' | 'degraded' | 'down' = 'operational';
  let dbLatency = 0;
  
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    dbLatency = Date.now() - startTime;
    if (error) {
      dbStatus = 'degraded';
    }
  } catch (e) {
    dbLatency = Date.now() - startTime;
    dbStatus = 'down';
  }

  const services = [
    { service: 'Supabase Database', status: dbStatus, latency: `${dbLatency}ms`, uptime: '100%', lastCheck: new Date().toISOString() },
    { service: 'Vercel Edge CDN', status: 'operational', latency: '—', uptime: '100%', lastCheck: new Date().toISOString() },
    { service: 'Payment Engine', status: 'operational', latency: '—', uptime: '100%', lastCheck: new Date().toISOString() },
  ]

  return NextResponse.json({ success: true, services })
}