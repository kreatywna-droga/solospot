import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'
import { sendWelcomeEmail } from '@/lib/email'
import { SupabaseIdempotencyStore } from '@/lib/webhooks'

const stripeKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!stripeKey || !webhookSecret) {
  console.warn('Stripe not configured for webhook')
}

const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' }) : null

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Idempotency check: skip if already processed
  const idempotencyStore = new SupabaseIdempotencyStore()
  const payloadHash = require('crypto').createHash('sha256').update(body).digest('hex')
  const envelope = {
    provider: 'stripe',
    providerEventId: event.id,
    providerTransactionId: event.id,
    payloadHash,
    correlationId: event.id,
    tenantId: 'system',
    occurredAt: new Date(event.created * 1000).toISOString(),
  }

  try {
    await idempotencyStore.upsertReceived(envelope, payloadHash)
  } catch {
    // Duplicate or in-progress — skip
    return NextResponse.json({ received: true, duplicate: true })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type === 'marketplace_purchase' && session.metadata.templateSlug) {
      try {
        await handleMarketplacePurchase(session)
      } catch (err) {
        // Mark as FAILED so Stripe can retry on next delivery
        await idempotencyStore.markFailed(envelope)
        console.error('Marketplace purchase processing failed:', err)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
      }
    }
  }

  await idempotencyStore.markCompleted(envelope)
  return NextResponse.json({ received: true })
}

async function handleMarketplacePurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const templateSlug = session.metadata?.templateSlug

  if (!userId || !templateSlug) {
    throw new Error(`Missing metadata in session: userId=${userId}, templateSlug=${templateSlug}`)
  }

  const supabase = getServiceSupabase()

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .single()

  let tenantId: string

  if (existingTenant) {
    tenantId = existingTenant.id
  } else {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        owner_id: userId,
        package_id: 'marketplace',
        status: 'ACTIVE',
      })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      throw new Error(`Failed to create tenant: ${tenantError?.message ?? 'unknown'}`)
    }
    tenantId = tenant.id
  }

  const registry = new TemplateRegistry()
  const template = registry.getBySlug(templateSlug)

  if (!template) {
    throw new Error(`Template not found: ${templateSlug}`)
  }

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      tenant_id: tenantId,
      name: template.name,
      slug: `${template.slug}-${tenantId.slice(0, 8)}`,
      status: 'ACTIVE',
      config: {
        publicationStatus: 'PUBLISHED',
        branding: {
          primaryColor: template.theme.primaryColor,
          secondaryColor: template.theme.secondaryColor,
          font: template.theme.font,
          description: template.theme.description,
        },
      },
    })
    .select('id, slug')
    .single()

  if (storeError || !store) {
    throw new Error(`Failed to create store: ${storeError?.message ?? 'unknown'}`)
  }

  // Non-critical: template install failure is logged but does not fail the webhook
  const { error: installError } = await supabase.rpc('install_template_to_store', {
    p_store_id: store.id,
    p_template_slug: templateSlug,
  })

  if (installError) {
    console.error('Failed to install template (non-critical):', installError)
  }

  await supabase.from('timeline_events').insert({
    tenant_id: tenantId,
    event_type: 'MARKETPLACE_PURCHASE_COMPLETED',
    payload: {
      templateSlug,
      templateName: template.name,
      storeId: store.id,
      storeSlug: store.slug,
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
    },
    correlation_id: session.id,
  })

  // Best-effort welcome email
  const { data: user } = await supabase.auth.admin.getUserById(userId)
  if (user?.user?.email) {
    const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${store.slug}`
    await sendWelcomeEmail({
      to: user.user.email,
      storeName: template.name,
      storeUrl,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stores/${store.id}`,
      templateName: template.name,
    }).catch((err) => console.error('Welcome email failed (non-critical):', err))
  }

  console.log('Marketplace purchase completed:', { tenantId, storeId: store.id, templateSlug })
}