/**
 * API Route: POST /api/portal
 * 
 * Cria uma sessão do Stripe Customer Portal
 * para o usuário gerenciar métodos de pagamento
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCustomerPortalSession } from '@/lib/stripe';
import { checkoutLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting por usuário (mesmo limiter que checkout)
    const rateLimitResult = checkoutLimiter(userId);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Buscar usuário para pegar stripe_customer_id
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { stripe_customer_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Usuário não possui conta de pagamento configurada' },
        { status: 400 }
      );
    }

    // Criar sessão do Customer Portal
    const session = await createCustomerPortalSession({
      customerId: user.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar portal session:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
