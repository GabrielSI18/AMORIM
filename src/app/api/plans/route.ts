import prisma from '@/lib/prisma';
import { PLANS } from '@/lib/plans';
import type { Plan, Price } from '@prisma/client';

/**
 * GET /api/plans
 * 
 * Retorna lista de planos públicos (isPrivate=false) com prices e features
 */
export async function GET() {
  try {
    // Buscar planos públicos do banco
    const plans = await prisma.plan.findMany({
      where: {
        is_private: false,
        is_active: true,
      },
      include: {
        prices: {
          where: {
            is_active: true,
          },
          orderBy: {
            amount: 'asc',
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    });

    // Enriquecer com features do lib/plans.ts
    const enrichedPlans = plans.map((plan: Plan & { prices: Price[] }) => {
      const planConfig = PLANS[plan.id as keyof typeof PLANS];
      
      return {
        ...plan,
        features: planConfig?.features || [],
        popular: planConfig?.popular || false,
      };
    });

    return Response.json(enrichedPlans);
  } catch (error) {
    console.error('❌ [API Plans] Erro:', error);
    
    return Response.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
}
