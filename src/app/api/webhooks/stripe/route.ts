import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'
import { sendWelcomeEmail } from '@/lib/email'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type === 'marketplace_purchase' && session.metadata.templateSlug) {
      await handleMarketplacePurchase(session)
    }
  }

  return NextResponse.json({ received: true })
}

async function handleMarketplacePurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const templateSlug = session.metadata?.templateSlug

  if (!userId || !templateSlug) {
    console.error('Missing metadata in session', { userId, templateSlug })
    return
  }

  const supabase = getServiceSupabase()

  try {
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
        console.error('Failed to create tenant:', tenantError)
        return
      }
      tenantId = tenant.id
    }

    const registry = new TemplateRegistry()
    const template = registry.getBySlug(templateSlug)

    if (!template) {
      console.error('Template not found:', templateSlug)
      return
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
      console.error('Failed to create store:', storeError)
      return
    }

    const { error: installError } = await supabase.rpc('install_template_to_store', {
      p_store_id: store.id,
      p_template_slug: templateSlug,
    })

    if (installError) {
      console.error('Failed to install template:', installError)
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

    // Get user email for welcome email
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    if (user?.user?.email) {
      const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${store.slug}`
      await sendWelcomeEmail({
        to: user.user.email,
        storeName: template.name,
        storeUrl,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stores/${store.id}`,
        templateName: template.name,
      })
    }

    console.log('Marketplace purchase completed:', { tenantId, storeId: store.id, templateSlug })

  } catch (err) {
    console.error('Error processing marketplace purchase:', err)
  }
}