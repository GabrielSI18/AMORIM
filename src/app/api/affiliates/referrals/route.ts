import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

/**
 * GET /api/affiliates/referrals
 * Lista indicações de afiliados (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
    }) as any;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, approved, paid
    const affiliateId = searchParams.get('affiliateId');

    const where: Record<string, unknown> = {};
    if (status) where.commission_status = status.toLowerCase();
    if (affiliateId) where.affiliate_id = affiliateId;

    const referrals = await prisma.affiliateReferral.findMany({
      where,
      include: {
        affiliate: {
          select: { id: true, name: true, code: true, email: true, commission_rate: true, user_id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform to expected format
    const transformedReferrals = referrals.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      commission_amount: r.commission_amount / 100, // Convert from cents
      commission_status: r.commission_status.toUpperCase(),
      created_at: r.created_at.toISOString(),
      affiliate: {
        id: r.affiliate.id,
        code: r.affiliate.code,
        user: {
          first_name: r.affiliate.name.split(' ')[0],
          last_name: r.affiliate.name.split(' ').slice(1).join(' ') || null,
          email: r.affiliate.email,
        },
      },
      booking: {
        id: r.booking_id || '',
        total_price: r.sale_amount / 100, // Convert from cents
        status: 'confirmed',
        travel_date: r.created_at.toISOString(),
        package: {
          title: r.package_title,
        },
      },
    }));

    return NextResponse.json({ referrals: transformedReferrals });
  } catch (error) {
    console.error('Erro ao buscar indicações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar indicações' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/affiliates/referrals
 * Atualiza status de uma indicação (admin)
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
    }) as any;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { referralId, status: rawStatus } = body;
    const status = rawStatus?.toLowerCase(); // Normalize to lowercase

    if (!referralId || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['pending', 'approved', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Buscar a indicação atual
    const currentReferral = await prisma.affiliateReferral.findUnique({
      where: { id: referralId },
      include: { affiliate: true },
    });

    if (!currentReferral) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar indicação
    const updateData: any = {
      commission_status: status,
    };

    if (status === 'paid') {
      updateData.commission_paid_at = new Date();
    }

    const referral = await prisma.affiliateReferral.update({
      where: { id: referralId },
      data: updateData,
    });

    // Se marcou como pago, atualizar estatísticas do afiliado
    if (status === 'paid' && currentReferral.commission_status !== 'paid') {
      await prisma.affiliate.update({
        where: { id: currentReferral.affiliate_id },
        data: {
          total_sales: { increment: currentReferral.sale_amount },
          total_earned: { increment: currentReferral.commission_amount },
          total_bookings: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      data: toCamelCase(referral),
      message: status === 'paid' 
        ? 'Comissão paga! Stats do afiliado atualizados.'
        : 'Status atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar indicação:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar indicação' },
      { status: 500 }
    );
  }
}
