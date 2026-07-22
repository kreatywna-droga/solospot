import { NextResponse } from 'next/server'

export async function GET() {
  const services = [
    { service: 'API Gateway', status: 'operational', latency: '12ms', uptime: '99.99%', lastCheck: new Date().toISOString() },
    { service: 'Runtime Engine', status: 'operational', latency: '8ms', uptime: '99.98%', lastCheck: new Date().toISOString() },
    { service: 'Edge CDN', status: 'operational', latency: '23ms', uptime: '99.99%', lastCheck: new Date().toISOString() },
    { service: 'Payment Engine', status: 'degraded', latency: '145ms', uptime: '99.95%', lastCheck: new Date().toISOString() },
    { service: 'Database (Primary)', status: 'operational', latency: '4ms', uptime: '99.99%', lastCheck: new Date().toISOString() },
    { service: 'Event Bus', status: 'operational', latency: '2ms', uptime: '99.99%', lastCheck: new Date().toISOString() },
    { service: 'Auth Service', status: 'operational', latency: '6ms', uptime: '99.99%', lastCheck: new Date().toISOString() },
    { service: 'Storage (Assets)', status: 'operational', latency: '15ms', uptime: '99.97%', lastCheck: new Date().toISOString() },
  ]

  return NextResponse.json({ success: true, services })
}