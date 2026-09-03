import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'
import { getServiceSupabase } from '@/lib/supabase'
import { resolveTenantSession } from '@/lib/tenant/TenantResolver'

const stripeKey = process.env.STRIPE_SECRET_KEY

const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' }) : null

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  // Require authentication — userId must come from the session, not the client
  const session = await resolveTenantSession()
  if (!session.isAuthenticated || !session.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const { templateSlug } = await request.json()

    if (!templateSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const registry = new TemplateRegistry()
    const template = registry.getBySlug(templateSlug)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Use authenticated user's ID and email — never from client
    const userId = session.userId
    const userEmail = session.email

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: [
        {
          price_data: {
            currency: template.currency.toLowerCase(),
            product_data: {
              name: template.name,
              description: template.description,
              images: template.previewImage ? [template.previewImage] : [],
            },
            unit_amount: template.price,
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        type: 'marketplace_purchase',
        templateSlug,
        userId,
        userEmail,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${templateSlug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${templateSlug}?canceled=true`,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}