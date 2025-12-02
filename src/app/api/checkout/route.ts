import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession, getOrCreateCustomer, updateSubscriptionPrice } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { checkoutSchema, safeParse } from '@/lib/validations';
import { checkoutLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';

/**
 * POST /api/checkout
 * 
 * Cria sessão de checkout do Stripe OU faz upgrade/downgrade de subscription existente
 * Body: { priceId: string, successUrl?: string, cancelUrl?: string }
 * 
 * Fluxo:
 * 1. Se usuário NÃO tem subscription ativa → Cria checkout session
 * 2. Se usuário TEM subscription ativa:
 *    - Mesmo price → Erro (já está neste plano)
 *    - Price de plano maior (upgrade) → Atualiza com prorata
 *    - Price de plano menor (downgrade) → Atualiza com crédito proporcional
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return Response.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Rate limiting por usuário
    const rateLimitResult = checkoutLimiter(userId);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Validação com Zod
    const body = await req.json();
    const validation = safeParse(checkoutSchema, body);
    
    if (!validation.success) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { priceId, successUrl, cancelUrl } = validation.data!;

    // Validar se price existe no banco
    const newPrice = await prisma.price.findUnique({
      where: { stripe_price_id: priceId },
      include: { plan: true },
    });

    if (!newPrice || !newPrice.is_active) {
      return Response.json(
        { error: 'Price inválido ou inativo' },
        { status: 400 }
      );
    }

    // Buscar user no banco para pegar stripe_customer_id
    const dbUser = await prisma.user.findUnique({
      where: { clerk_id: userId },
    });

    if (!dbUser) {
      return Response.json(
        { error: 'Usuário não encontrado. Faça login novamente.' },
        { status: 400 }
      );
    }

    // Verificar se usuário já tem subscription ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        user_id: dbUser.id,
        status: { in: ['active', 'trialing'] },
      },
      include: {
        price: { include: { plan: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Se tem subscription ativa, fazer upgrade/downgrade
    if (existingSubscription && existingSubscription.stripe_subscription_id) {
      const currentPrice = existingSubscription.price;
      const currentPlan = currentPrice.plan;
      const newPlan = newPrice.plan;

      // VALIDAÇÃO 1: Mesmo price_id → Erro
      if (currentPrice.stripe_price_id === priceId) {
        return Response.json(
          { 
            error: 'Você já está neste plano',
            code: 'SAME_PLAN',
            currentPlan: currentPlan.name,
          },
          { status: 400 }
        );
      }

      // VALIDAÇÃO 2: Mesmo plano, apenas intervalo diferente (ex: mensal → anual do mesmo plano)
      const isSamePlanDifferentInterval = currentPlan.id === newPlan.id;
      
      // VALIDAÇÃO 3: Determinar se é upgrade ou downgrade baseado no level
      const isUpgrade = newPlan.level > currentPlan.level;
      const isDowngrade = newPlan.level < currentPlan.level;
      const isSameLevel = newPlan.level === currentPlan.level;

      // VALIDAÇÃO 4: Se subscription está cancelando (cancel_at_period_end), não permitir mudanças
      if (existingSubscription.cancel_at_period_end) {
        return Response.json(
          { 
            error: 'Sua assinatura está programada para cancelar. Reative-a antes de mudar de plano.',
            code: 'SUBSCRIPTION_CANCELING',
          },
          { status: 400 }
        );
      }

      console.log(`🔄 [API Checkout] ${isUpgrade ? 'UPGRADE' : isDowngrade ? 'DOWNGRADE' : 'INTERVAL_CHANGE'}: ${currentPlan.name} → ${newPlan.name}`);

      // DOWNGRADE: Agenda para o final do período atual
      if (isDowngrade) {
        console.log(`⏳ [API Checkout] Scheduling downgrade at period end`);

        // Atualiza subscription no banco com o scheduled_price_id
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            scheduled_price_id: newPrice.id,
          },
        });

        const periodEndDate = existingSubscription.current_period_end 
          ? new Date(existingSubscription.current_period_end).toLocaleDateString('pt-BR')
          : 'final do período';

        return Response.json({
          type: 'downgrade_scheduled',
          message: `Downgrade agendado! Você continuará no plano ${currentPlan.name} até ${periodEndDate}, depois mudará para ${newPlan.name}.`,
          subscription: {
            currentPlan: currentPlan.name,
            scheduledPlan: newPlan.name,
            effectiveDate: existingSubscription.current_period_end,
          },
        });
      }

      // UPGRADE ou INTERVAL_CHANGE: Aplica imediatamente com prorata
      const updatedSubscription = await updateSubscriptionPrice({
        subscriptionId: existingSubscription.stripe_subscription_id,
        newPriceId: priceId,
        prorationBehavior: 'create_prorations', // Sempre aplica prorata
      });

      // Atualizar subscription no banco (limpa scheduled_price_id se existir)
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          price_id: newPrice.id,
          status: updatedSubscription.status,
          scheduled_price_id: null, // Limpa agendamento se houver
        },
      });

      // Determinar mensagem baseada no tipo de mudança
      let message: string;
      let changeType: 'upgrade' | 'interval_change';

      if (isUpgrade) {
        message = `Upgrade realizado! Você agora está no plano ${newPlan.name}. O valor proporcional será cobrado.`;
        changeType = 'upgrade';
      } else if (isSamePlanDifferentInterval) {
        const newInterval = newPrice.interval === 'year' ? 'anual' : 'mensal';
        message = `Período alterado para ${newInterval}. O ajuste proporcional será aplicado.`;
        changeType = 'interval_change';
      } else {
        message = `Plano atualizado para ${newPlan.name}.`;
        changeType = 'upgrade';
      }

      console.log(`✅ [API Checkout] Subscription ${changeType} successful`);

      return Response.json({
        type: changeType,
        message,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          previousPlan: currentPlan.name,
          newPlan: newPlan.name,
          isUpgrade,
        },
      });
    }

    // Se não tem subscription, criar checkout session
    const customerEmail = user.emailAddresses[0]?.emailAddress || '';
    const customerName = user.fullName || user.firstName || undefined;

    // Criar ou buscar customer no Stripe com metadata do clerk_id
    const customerId = await getOrCreateCustomer({
      email: customerEmail,
      clerkId: userId,
      name: customerName,
    });

    // Atualizar user no banco com stripe_customer_id
    await prisma.user.updateMany({
      where: { clerk_id: userId },
      data: { stripe_customer_id: customerId },
    });

    // Criar sessão de checkout
    const session = await createCheckoutSession({
      priceId,
      userId,
      customerEmail,
      customerId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard?checkout=success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_URL}/?checkout=canceled`,
    });

    return Response.json({ 
      type: 'checkout',
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('❌ [API Checkout] Erro:', error);
    
    // Tratar erros específicos do Stripe
    if (error instanceof Error) {
      if (error.message.includes('No such price')) {
        return Response.json(
          { error: 'Preço não encontrado no Stripe. Verifique a configuração.' },
          { status: 400 }
        );
      }
      if (error.message.includes('No such subscription')) {
        return Response.json(
          { error: 'Assinatura não encontrada. Tente assinar novamente.' },
          { status: 400 }
        );
      }
    }
    
    return Response.json(
      { error: 'Erro ao processar. Tente novamente.' },
      { status: 500 }
    );
  }
}
