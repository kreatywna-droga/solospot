import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'
import { getServiceSupabase } from '@/lib/supabase'

const stripeKey = process.env.STRIPE_SECRET_KEY

const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' }) : null

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const { templateSlug, userId, userEmail } = await request.json()

    if (!templateSlug || !userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const registry = new TemplateRegistry()
    const template = registry.getBySlug(templateSlug)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const session = await stripe.checkout.sessions.create({
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

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}