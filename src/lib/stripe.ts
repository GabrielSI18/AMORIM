/**
 * Stripe Client Singleton
 * 
 * Reutiliza a mesma instância do Stripe client em todo o projeto
 * para evitar múltiplas conexões e melhorar performance
 */

import Stripe from 'stripe';

/**
 * Singleton lazy do Stripe client
 * 
 * A instância só é criada quando alguma função precisar dela,
 * evitando erro em ambientes onde STRIPE_SECRET_KEY não está configurada
 * durante o build.
 */
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }

  return stripeInstance;
}

/**
 * Helper: Criar ou buscar Customer no Stripe
 * Garante que o customer tenha metadata com clerk_id
 */
export async function getOrCreateCustomer({
  email,
  clerkId,
  name,
}: {
  email: string;
  clerkId: string;
  name?: string;
}): Promise<string> {
  const stripe = getStripeClient();
  // Buscar customer existente pelo email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    
    // Atualizar metadata se necessário
    if (!customer.metadata?.clerk_id) {
      await stripe.customers.update(customer.id, {
        metadata: { clerk_id: clerkId },
      });
    }
    
    return customer.id;
  }

  // Criar novo customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      clerk_id: clerkId,
    },
  });

  return customer.id;
}

/**
 * Helper: Criar Checkout Session para assinatura
 */
export async function createCheckoutSession({
  priceId,
  userId,
  customerEmail,
  customerId,
  successUrl,
  cancelUrl,
  trialPeriodDays,
}: {
  priceId: string;
  userId: string;
  customerEmail: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}) {
  const stripe = getStripeClient();
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId, // Para vincular ao User no webhook
    subscription_data: {
      trial_period_days: trialPeriodDays,
      metadata: {
        clerk_id: userId,
      },
    },
    metadata: {
      clerk_id: userId,
    },
  };

  // Se temos customerId, usar ele; senão usar email
  if (customerId) {
    sessionConfig.customer = customerId;
  } else {
    sessionConfig.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return session;
}

/**
 * Helper: Criar Customer Portal Session (gerenciar assinatura)
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Helper: Criar Payment Intent para add-on (pagamento único)
 */
export async function createPaymentIntent({
  amount,
  currency = 'brl',
  customerId,
  addonId,
  userId,
  description,
}: {
  amount: number;
  currency?: string;
  customerId: string;
  addonId: string;
  userId: string;
  description: string;
}) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    description,
    metadata: {
      addon_id: addonId,
      user_id: userId,
    },
  });

  return paymentIntent;
}

/**
 * Helper: Cancelar assinatura ao fim do período
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

/**
 * Helper: Reativar assinatura cancelada
 */
export async function reactivateSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

/**
 * Helper: Mudar plano da assinatura (upgrade/downgrade)
 */
export async function updateSubscriptionPrice({
  subscriptionId,
  newPriceId,
  prorationBehavior = 'create_prorations',
}: {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: prorationBehavior,
  });

  return updatedSubscription;
}
