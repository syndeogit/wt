// Slice F scaffolding for Stripe. The real integration is deferred until Andy
// creates a Stripe account. Until then this module short-circuits and routes
// the guest straight to the success page so the rest of the booking flow
// (endpoint, RLS, confirmation page, email) is clickable and testable.
//
// When Stripe goes live:
//  1. Set STRIPE_SECRET_KEY (test mode first) in .env.local + Vercel env.
//  2. `pnpm --filter guest-site add stripe`.
//  3. Replace the TODO block in createCheckoutSession with real calls.
//  4. Implement verifyWebhook and add server/api/webhooks/stripe.post.ts.
//  5. Add stripe_price_id or per-product line-item logic as required.

export interface StripeCheckoutInput {
  bookingRef: string
  amountCents: number
  currency: string
  productName: string
  successUrl: string
  cancelUrl: string
}

export interface StripeCheckoutResult {
  url: string
  sessionId: string | null
  paymentIntentId: string | null
}

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export async function createCheckoutSession(
  input: StripeCheckoutInput,
): Promise<StripeCheckoutResult> {
  if (!isStripeEnabled()) {
    // No Stripe account yet. Skip the hosted checkout; the guest lands
    // directly on the success page, and we collect payment manually.
    return {
      url: input.successUrl,
      sessionId: null,
      paymentIntentId: null,
    }
  }

  // TODO(Slice F live): implement real Stripe Checkout Session creation.
  //
  //   import Stripe from 'stripe'
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  //   const session = await stripe.checkout.sessions.create({
  //     mode: 'payment',
  //     client_reference_id: input.bookingRef,
  //     line_items: [{
  //       price_data: {
  //         currency: input.currency.toLowerCase(),
  //         product_data: { name: input.productName },
  //         unit_amount: input.amountCents,
  //       },
  //       quantity: 1,
  //     }],
  //     success_url: input.successUrl,
  //     cancel_url: input.cancelUrl,
  //   })
  //   return { url: session.url!, sessionId: session.id, paymentIntentId: null }
  throw createError({
    statusCode: 500,
    statusMessage:
      'STRIPE_SECRET_KEY is set but the live Stripe integration is not implemented yet',
  })
}

export async function verifyWebhook(
  _rawBody: string,
  _signature: string,
): Promise<{ type: string; data: unknown }> {
  // TODO(Slice F live): verify the Stripe signature and parse the event.
  //
  //   import Stripe from 'stripe'
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  //   const event = stripe.webhooks.constructEvent(
  //     rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!,
  //   )
  //   return { type: event.type, data: event.data }
  throw createError({
    statusCode: 501,
    statusMessage: 'Stripe webhook verification is not implemented yet',
  })
}
