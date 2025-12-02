/**
 * API Route: GET /api/subscription
 * 
 * Retorna a subscription atual do usuário autenticado
 * com dados do plano, preço e informações de cobrança
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar usuário com subscription ativa
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing', 'past_due'],
            },
          },
          include: {
            price: {
              include: {
                plan: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const subscription = user.subscriptions[0];

    // Se não tem subscription, retorna plano gratuito
    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        plan: {
          id: 'PLAN_FREE',
          name: 'Gratuito',
          level: 1,
        },
        status: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: user.stripe_customer_id,
      });
    }

    // Buscar dados atualizados do Stripe (opcional, para ter dados em tempo real)
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
      } catch (error) {
        console.error('Erro ao buscar subscription do Stripe:', error);
      }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        status: stripeSubscription?.status || subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end ?? subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at,
        trialEnd: subscription.trial_end,
      },
      plan: {
        id: subscription.price.plan.id,
        name: subscription.price.plan.name,
        level: subscription.price.plan.level,
        description: subscription.price.plan.description,
      },
      price: {
        id: subscription.price.id,
        stripePriceId: subscription.price.stripe_price_id,
        amount: subscription.price.amount,
        currency: subscription.price.currency,
        interval: subscription.price.interval,
        intervalCount: subscription.price.interval_count,
      },
      status: stripeSubscription?.status || subscription.status,
      stripeCustomerId: user.stripe_customer_id,
    });
  } catch (error) {
    console.error('Erro ao buscar subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
