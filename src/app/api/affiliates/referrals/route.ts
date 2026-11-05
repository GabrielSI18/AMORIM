import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { computeAffiliateTotals } from '@/lib/affiliate-totals';
import { toCamelCase } from '@/lib/case-transform';
import { sendAffiliateCommissionPaidEmail } from '@/lib/email';
import { withReleaseInfo } from '@/lib/affiliate-retention-db';
import { formatReleaseDate, RELEASE_DAYS_AFTER_DEPARTURE } from '@/lib/affiliate-retention';
import { RELEASED_BOOKING_STATUSES } from '@/lib/booking-status';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

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
    // pending, approved, paid, rejected — ou a situação do pagamento:
    // retained (cliente pagou, viagem não saiu) e releasable (pode pagar)
    const status = searchParams.get('status')?.toLowerCase() || null;
    const affiliateId = searchParams.get('affiliateId');
    const filtroPorSituacao = status === 'retained' || status === 'releasable';

    const where: Record<string, unknown> = {};
    if (status && !filtroPorSituacao) where.commission_status = status;
    if (filtroPorSituacao) where.commission_status = 'approved';
    if (affiliateId) where.affiliate_id = affiliateId;

    const rawReferrals = await prisma.affiliateReferral.findMany({
      where,
      include: {
        affiliate: {
          select: { id: true, name: true, code: true, email: true, commission_rate: true, user_id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const enriched = await withReleaseInfo(rawReferrals);
    const referrals = filtroPorSituacao ? enriched.filter((r) => r.payout_state === status) : enriched;

    // Padronização do projeto: TODOS os valores monetários trafegam em
    // CENTAVOS no JSON. O front é responsável por dividir por 100 ao
    // formatar (ver formatCurrency em dashboard/afiliados/page.tsx).
    // Antes este endpoint dividia por 100, mas o /api/affiliates não, e
    // o front usava o mesmo formatter para os dois — gerava valores
    // discrepantes (R$ 104,30 virando R$ 10.430,00).
    const transformedReferrals = referrals.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      commission_amount: r.commission_amount, // centavos
      commission_status: r.commission_status.toUpperCase(),
      // Retenção até a viagem: o admin só paga quando `payout_state` é releasable
      payout_state: r.payout_state,
      departure_date: r.departure_date ? r.departure_date.toISOString() : null,
      release_date: r.release_date ? r.release_date.toISOString() : null,
      booking_status: r.booking_status,
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
        total_price: r.sale_amount, // centavos
        status: r.booking_status || 'confirmed',
        travel_date: (r.departure_date ?? r.created_at).toISOString(),
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
    // Pagar antes da viagem só com confirmação explícita da equipe
    const forceRelease = body.forceRelease === true;
    const status = rawStatus?.toLowerCase(); // Normalize to lowercase

    if (!referralId || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios' },
        { status: 400 }
      );
    }

    // 'rejected' existe para indicação de reserva cancelada (o PUT de
    // /api/bookings marca assim) e para o admin recusar na mão. Sem ele na
    // lista, uma comissão rejeitada ficava presa, sem como voltar atrás.
    if (!['pending', 'approved', 'paid', 'rejected'].includes(status)) {
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

    // Retenção: comissão só é paga depois que a viagem acontece. Se o cliente
    // desistir antes e receber o dinheiro de volta, a comissão já paga seria
    // prejuízo — e vender para conhecidos que cancelam depois viraria golpe.
    if (status === 'paid' && currentReferral.commission_status !== 'paid') {
      const [comViagem] = await withReleaseInfo([currentReferral]);
      const bookingStatus = (comViagem.booking_status || '').toLowerCase();

      if ((RELEASED_BOOKING_STATUSES as readonly string[]).includes(bookingStatus)) {
        return NextResponse.json(
          { error: 'A reserva desta indicação foi cancelada — a comissão não é paga.', code: 'booking_canceled' },
          { status: 409 }
        );
      }

      if (comViagem.payout_state === 'awaiting_payment') {
        return NextResponse.json(
          {
            error: 'O cliente ainda não pagou a reserva. Marque a reserva como paga antes de pagar a comissão.',
            code: 'awaiting_payment',
          },
          { status: 409 }
        );
      }

      if (comViagem.payout_state === 'retained' && !forceRelease) {
        const libera = formatReleaseDate(comViagem.release_date);
        const sai = formatReleaseDate(comViagem.departure_date);
        return NextResponse.json(
          {
            error: libera
              ? `Comissão retida até a viagem: o pacote sai em ${sai} e a comissão é liberada em ${libera}.`
              : 'Comissão retida: o pacote não tem data de saída cadastrada.',
            code: 'retained',
            departureDate: comViagem.departure_date,
            releaseDate: comViagem.release_date,
            releaseDaysAfterDeparture: RELEASE_DAYS_AFTER_DEPARTURE,
          },
          { status: 409 }
        );
      }

      if (comViagem.payout_state === 'retained' && forceRelease) {
        console.warn(
          `[referral.paid] liberação antecipada da comissão ${referralId} por ${user.email} (viagem em ${comViagem.departure_date?.toISOString() ?? 'sem data'})`,
        );
      }
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

    // Se marcou como pago, atualizar estatísticas do afiliado + notificar por email
    if (status === 'paid' && currentReferral.commission_status !== 'paid') {
      // Recalcula a partir das indicações. Com incremento, marcar como paga,
      // voltar para aprovada e pagar de novo somava duas vezes.
      const referrals = await prisma.affiliateReferral.findMany({
        where: { affiliate_id: currentReferral.affiliate_id },
        select: { sale_amount: true, commission_amount: true, commission_status: true },
      });
      const totals = computeAffiliateTotals(referrals);
      await prisma.affiliate.update({
        where: { id: currentReferral.affiliate_id },
        data: {
          total_sales: totals.totalSales,
          total_earned: totals.paidCommission,
          total_bookings: totals.totalReferrals,
        },
      });

      // Notifica afiliado fire-and-forget
      if (currentReferral.affiliate.email) {
        const paidAtFmt = new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        sendAffiliateCommissionPaidEmail({
          to: currentReferral.affiliate.email,
          affiliateName: currentReferral.affiliate.name,
          packageTitle: currentReferral.package_title,
          commissionAmount: formatBRL(currentReferral.commission_amount),
          paidAt: paidAtFmt,
          panelUrl: `${APP_URL}/dashboard/parceiro`,
        }).catch((err) => {
          console.error('[referral.paid] email error:', err);
        });
      }
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
