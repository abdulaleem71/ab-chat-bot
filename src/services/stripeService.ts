import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export class StripeService {
  static isConfigured(): boolean {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    return Boolean(key && !key.startsWith('your_') && (key.startsWith('sk_test_') || key.startsWith('sk_live_') || key.startsWith('rk_')));
  }

  static getClient(): Stripe | null {
    if (!this.isConfigured()) return null;
    if (!stripeClient) {
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
        apiVersion: '2026-02-25.clover' as any,
      });
    }
    return stripeClient;
  }

  static getPriceId(planId: string, billingCycle: 'monthly' | 'annual'): string | null {
    const normalized = planId.toLowerCase();
    if (normalized === 'ultra' || normalized === 'enterprise ultra') {
      return billingCycle === 'annual'
        ? process.env.STRIPE_PRICE_ULTRA_ANNUAL?.trim() || null
        : process.env.STRIPE_PRICE_ULTRA_MONTHLY?.trim() || null;
    }
    return billingCycle === 'annual'
      ? process.env.STRIPE_PRICE_PRO_ANNUAL?.trim() || null
      : process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() || null;
  }

  static async createCheckoutSession(params: {
    tenantId: string;
    customerEmail: string;
    planId: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    unitAmountCents: number;
    successUrl: string;
    cancelUrl: string;
    stripeCustomerId?: string | null;
  }): Promise<{ sessionId: string; url: string }> {
    const stripe = this.getClient();
    if (!stripe) {
      throw new Error('Stripe is not configured on the server.');
    }

    const configuredPriceId = this.getPriceId(params.planId, params.billingCycle);
    const interval = params.billingCycle === 'annual' ? 'year' : 'month';
    const intervalUnitAmount =
      params.billingCycle === 'annual' ? params.unitAmountCents * 12 : params.unitAmountCents;

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = configuredPriceId
      ? { price: configuredPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${params.planName} (${params.billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
              description: 'Includes 3-Day Full-Access Free Trial • Cancel anytime',
            },
            unit_amount: intervalUnitAmount,
            recurring: { interval },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(params.stripeCustomerId
        ? { customer: params.stripeCustomerId }
        : { customer_email: params.customerEmail }),
      line_items: [lineItem],
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          tenantId: params.tenantId,
          planId: params.planId,
          billingCycle: params.billingCycle,
        },
      },
      metadata: {
        tenantId: params.tenantId,
        planId: params.planId,
        billingCycle: params.billingCycle,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }
    return { sessionId: session.id, url: session.url };
  }

  static async createBillingPortalSession(params: {
    stripeCustomerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const stripe = this.getClient();
    if (!stripe) {
      throw new Error('Stripe is not configured on the server.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: params.stripeCustomerId,
      return_url: params.returnUrl,
    });

    return { url: session.url };
  }

  static constructWebhookEvent(rawBody: Buffer | string, signature: string): Stripe.Event {
    const stripe = this.getClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!stripe || !webhookSecret) {
      throw new Error('Stripe webhook verification is not configured.');
    }
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
