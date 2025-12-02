import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

/**
 * Helper: Converte Unix timestamp do Stripe para Date
 * Stripe retorna timestamps em segundos, não milissegundos
 */
function stripeTimestampToDate(timestamp: unknown, fallbackDays = 0): Date {
  if (timestamp && typeof timestamp === 'number' && timestamp > 0) {
    return new Date(timestamp * 1000);
  }
  // Fallback: data atual + dias especificados
  return new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}

/**
 * Webhook do Stripe
 * 
 * Processa TODOS os eventos de subscription e pagamentos:
 * - checkout.session.completed → Criar subscription inicial
 * - customer.subscription.created → Registrar nova subscription
 * - customer.subscription.updated → Atualizar status, trial, cancel_at
 * - customer.subscription.deleted → Marcar como cancelada
 * - customer.subscription.trial_will_end → Notificar cliente (3 dias antes)
 * - invoice.paid → Renovar acesso (extend current_period_end)
 * - invoice.payment_failed → Notificar falha
 * - invoice.payment_action_required → Requer autenticação 3DS
 * - payment_intent.succeeded → Add-on comprado com sucesso
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('❌ Webhook: Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verificar assinatura do webhook (SEGURANÇA)
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    // Processar eventos
    switch (event.type) {
      // ========================================
      // CHECKOUT SESSION
      // ========================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          await handleCheckoutSessionCompleted(session);
        }
        break;
      }

      // ========================================
      // SUBSCRIPTION EVENTS
      // ========================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionTrialWillEnd(subscription);
        break;
      }

      // ========================================
      // INVOICE EVENTS
      // ========================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentActionRequired(invoice);
        break;
      }

      // ========================================
      // PAYMENT INTENT (ADD-ONS)
      // ========================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ============================================
// HANDLERS
// ============================================

/**
 * Checkout Session Completed
 * Cliente finalizou checkout com sucesso
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('📦 Checkout session completed:', session.id);

  const customerId = session.customer as string;

  // Atualizar user com stripe_customer_id
  await prisma.user.updateMany({
    where: { clerk_id: session.client_reference_id || '' },
    data: { stripe_customer_id: customerId },
  });

  console.log(`✅ Updated user with customer_id: ${customerId}`);
}

/**
 * Subscription Created
 * Nova assinatura criada (pode vir antes do checkout.session.completed - race condition)
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Subscription created:', subscription.id);

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('❌ No price found in subscription');
    return;
  }

  if (!customerId) {
    console.error('❌ No customer found in subscription');
    return;
  }

  // Buscar user pelo stripe_customer_id
  let user = await prisma.user.findUnique({
    where: { stripe_customer_id: customerId },
  });

  // Se não encontrou, pode ser race condition com checkout.session.completed
  // Buscar customer no Stripe para pegar metadata com clerk_id
  if (!user) {
    console.log('⏳ User not found by customer_id, checking Stripe customer metadata...');
    
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer && !customer.deleted && 'metadata' in customer) {
        const clerkId = customer.metadata?.clerk_id;
        
        if (clerkId) {
          // Buscar user pelo clerk_id e atualizar com stripe_customer_id
          user = await prisma.user.findUnique({
            where: { clerk_id: clerkId },
          });
          
          if (user) {
            // Atualizar user com stripe_customer_id (resolver race condition)
            await prisma.user.update({
              where: { id: user.id },
              data: { stripe_customer_id: customerId },
            });
            console.log(`✅ Updated user ${user.id} with customer_id from metadata`);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error fetching customer from Stripe:', err);
    }
  }

  if (!user) {
    console.error(`❌ User not found for customer: ${customerId}`);
    return;
  }

  // Buscar price no DB
  const price = await prisma.price.findUnique({
    where: { stripe_price_id: priceId },
  });

  if (!price) {
    console.error(`❌ Price not found: ${priceId}`);
    return;
  }

  // Criar subscription no DB
  await prisma.subscription.create({
    data: {
      user_id: user.id,
      price_id: price.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId!,
      status: subscription.status,
      current_period_start: stripeTimestampToDate((subscription as any).current_period_start),
      current_period_end: stripeTimestampToDate((subscription as any).current_period_end, 30),
      trial_start: (subscription as any).trial_start
        ? stripeTimestampToDate((subscription as any).trial_start)
        : null,
      trial_end: (subscription as any).trial_end
        ? stripeTimestampToDate((subscription as any).trial_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      cancel_at: (subscription as any).cancel_at
        ? stripeTimestampToDate((subscription as any).cancel_at)
        : null,
    },
  });

  console.log(`✅ Subscription created in DB for user: ${user.id}`);
}

/**
 * Subscription Updated
 * Assinatura atualizada (mudança de plano, trial_end, cancel_at, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('❌ No price found in subscription');
    return;
  }

  // Buscar price no DB
  const price = await prisma.price.findUnique({
    where: { stripe_price_id: priceId },
  });

  if (!price) {
    console.error(`❌ Price not found: ${priceId}`);
    return;
  }

  // Atualizar subscription no DB
  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscription.id },
    data: {
      price_id: price.id, // Pode ter mudado de plano
      status: subscription.status,
      current_period_start: stripeTimestampToDate((subscription as any).current_period_start),
      current_period_end: stripeTimestampToDate((subscription as any).current_period_end, 30),
      trial_start: (subscription as any).trial_start
        ? stripeTimestampToDate((subscription as any).trial_start)
        : null,
      trial_end: (subscription as any).trial_end
        ? stripeTimestampToDate((subscription as any).trial_end)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      cancel_at: (subscription as any).cancel_at
        ? stripeTimestampToDate((subscription as any).cancel_at)
        : null,
      canceled_at: (subscription as any).canceled_at
        ? stripeTimestampToDate((subscription as any).canceled_at)
        : null,
    },
  });

  console.log(`✅ Subscription updated: ${subscription.id}`);
}

/**
 * Subscription Deleted
 * Assinatura cancelada definitivamente
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  // Buscar subscription com dados do usuário
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripe_subscription_id: subscription.id },
    include: { 
      user: true,
      price: { include: { plan: true } },
    },
  });

  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscription.id },
    data: {
      status: 'canceled',
      canceled_at: new Date(),
    },
  });

  console.log(`✅ Subscription marked as canceled: ${subscription.id}`);

  // Enviar email de cancelamento
  if (dbSubscription?.user?.email) {
    await sendSubscriptionCanceledEmail({
      to: dbSubscription.user.email,
      userName: dbSubscription.user.first_name || 'Usuário',
      planName: dbSubscription.price?.plan?.name || 'Plano',
      endDate: new Date(dbSubscription.current_period_end).toLocaleDateString('pt-BR'),
    });
  }
}

/**
 * Subscription Trial Will End
 * Trial acaba em 3 dias
 */
async function handleSubscriptionTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('⏰ Subscription trial will end:', subscription.id);

  // TODO: Enviar email avisando que trial acaba em 3 dias
  // TODO: Verificar se tem forma de pagamento cadastrada
  
  console.log(`✅ Trial ending notification sent for: ${subscription.id}`);
}

/**
 * Invoice Paid
 * Fatura paga com sucesso (renovação recorrente)
 * 
 * IMPORTANTE: Também aplica downgrades agendados quando o período anterior termina
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('💳 Invoice paid:', invoice.id);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    console.log('⚠️ Invoice is not related to a subscription, skipping');
    return;
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Buscar subscription no DB para ver se tem downgrade agendado
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripe_subscription_id: subscriptionId },
    include: { 
      user: true,
      price: { include: { plan: true } },
    },
  });

  // Se tem downgrade agendado, aplicar ANTES de atualizar o período
  if (dbSubscription?.scheduled_price_id) {
    console.log(`⏬ Applying scheduled downgrade for subscription: ${subscriptionId}`);
    
    const scheduledPrice = await prisma.price.findUnique({
      where: { id: dbSubscription.scheduled_price_id },
      include: { plan: true },
    });

    if (scheduledPrice?.stripe_price_id) {
      try {
        // Atualizar subscription no Stripe para o novo price
        await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
            price: scheduledPrice.stripe_price_id,
          }],
          proration_behavior: 'none', // Sem prorata - já é início de novo período
        });

        console.log(`✅ Downgrade applied: ${dbSubscription.price?.plan?.name} → ${scheduledPrice.plan?.name}`);
      } catch (err) {
        console.error('❌ Error applying scheduled downgrade:', err);
      }
    }

    // Atualizar subscription no DB: aplicar o novo price e limpar scheduled_price_id
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        price_id: dbSubscription.scheduled_price_id,
        scheduled_price_id: null,
      },
    });
  }

  // Buscar subscription completa no Stripe para pegar current_period_end atualizado
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Atualizar subscription no DB com novo período
  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscriptionId },
    data: {
      status: 'active',
      current_period_start: stripeTimestampToDate((subscription as any).current_period_start),
      current_period_end: stripeTimestampToDate((subscription as any).current_period_end, 30),
    },
  });

  console.log(`✅ Subscription renewed: ${subscriptionId}`);

  // Rebuscar dados atualizados para email
  const updatedSubscription = await prisma.subscription.findFirst({
    where: { stripe_subscription_id: subscriptionId },
    include: { 
      user: true,
      price: { include: { plan: true } },
    },
  });

  // Enviar email de confirmação de pagamento
  if (updatedSubscription?.user?.email) {
    const amount = invoice.amount_paid 
      ? `R$ ${(invoice.amount_paid / 100).toFixed(2).replace('.', ',')}` 
      : 'Valor indisponível';
    
    await sendPaymentSuccessEmail({
      to: updatedSubscription.user.email,
      userName: updatedSubscription.user.first_name || 'Usuário',
      planName: updatedSubscription.price?.plan?.name || 'Plano',
      amount,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
    });
  }
}

/**
 * Invoice Payment Failed
 * Pagamento da fatura falhou
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️ Invoice payment failed:', invoice.id);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    console.log('⚠️ Invoice is not related to a subscription, skipping');
    return;
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Atualizar status para past_due
  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscriptionId },
    data: { status: 'past_due' },
  });

  console.log(`✅ Subscription marked as past_due: ${subscriptionId}`);

  // Buscar dados para email
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripe_subscription_id: subscriptionId },
    include: { 
      user: true,
      price: { include: { plan: true } },
    },
  });

  // Enviar email notificando falha no pagamento
  if (dbSubscription?.user?.email) {
    const amount = invoice.amount_due 
      ? `R$ ${(invoice.amount_due / 100).toFixed(2).replace('.', ',')}` 
      : 'Valor indisponível';
    
    await sendPaymentFailedEmail({
      to: dbSubscription.user.email,
      userName: dbSubscription.user.first_name || 'Usuário',
      planName: dbSubscription.price?.plan?.name || 'Plano',
      amount,
      updatePaymentUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
    });
  }
}

/**
 * Invoice Payment Action Required
 * Pagamento requer autenticação 3DS
 */
async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log('🔐 Invoice payment action required:', invoice.id);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    console.log('⚠️ Invoice is not related to a subscription, skipping');
    return;
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Atualizar status para incomplete (aguardando autenticação)
  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscriptionId },
    data: { status: 'incomplete' },
  });

  console.log(`✅ Subscription marked as incomplete: ${subscriptionId}`);

  // TODO: Enviar email com link para autenticar pagamento
  // TODO: Usar client_secret do PaymentIntent para confirmar no frontend
}

/**
 * Payment Intent Succeeded
 * Pagamento único bem-sucedido (add-ons)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment intent succeeded:', paymentIntent.id);

  const customerId = paymentIntent.customer as string;
  const metadata = paymentIntent.metadata;

  // Verificar se é compra de add-on
  if (!metadata.addon_id) {
    console.log('⚠️ Payment intent is not for an addon, skipping');
    return;
  }

  // Buscar user pelo stripe_customer_id
  const user = await prisma.user.findUnique({
    where: { stripe_customer_id: customerId },
  });

  if (!user) {
    console.error(`❌ User not found for customer: ${customerId}`);
    return;
  }

  // Criar registro de compra de add-on
  await prisma.addonPurchase.create({
    data: {
      user_id: user.id,
      addon_id: metadata.addon_id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: customerId,
      status: 'succeeded',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provisioned_at: new Date(),
    },
  });

  console.log(`✅ Add-on provisioned for user: ${user.id}, addon: ${metadata.addon_id}`);

  // TODO: Provisionar add-on (ex: aumentar storage, ativar feature)
  // TODO: Enviar email de confirmação de compra
}
