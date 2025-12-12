import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

/**
 * GET /api/affiliates/stats
 * Busca estatísticas do afiliado
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const id = searchParams.get('id');

    if (!code && !id) {
      return NextResponse.json(
        { error: 'Código ou ID do afiliado é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar afiliado
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        OR: [
          code ? { code: code.toUpperCase() } : {},
          id ? { id } : {},
        ],
      },
      include: {
        referrals: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Afiliado não encontrado' },
        { status: 404 }
      );
    }

    // Calcular estatísticas
    const totalReferrals = affiliate.referrals.length;
    const pendingCommissions = affiliate.referrals
      .filter(r => r.commission_status === 'pending')
      .reduce((sum, r) => sum + r.commission_amount, 0);
    
    const approvedCommissions = affiliate.referrals
      .filter(r => r.commission_status === 'approved')
      .reduce((sum, r) => sum + r.commission_amount, 0);
    
    const paidCommissions = affiliate.referrals
      .filter(r => r.commission_status === 'paid')
      .reduce((sum, r) => sum + r.commission_amount, 0);

    // Estatísticas por mês (últimos 6 meses)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    const monthlyStats = affiliate.referrals
      .filter(r => new Date(r.created_at) >= sixMonthsAgo)
      .reduce((acc, r) => {
        const month = new Date(r.created_at).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        if (!acc[month]) {
          acc[month] = { sales: 0, commissions: 0, count: 0 };
        }
        
        acc[month].sales += r.sale_amount;
        acc[month].commissions += r.commission_amount;
        acc[month].count += 1;
        
        return acc;
      }, {} as Record<string, { sales: number; commissions: number; count: number }>);

    // Top pacotes
    const topPackages = affiliate.referrals.reduce((acc, r) => {
      if (!acc[r.package_title]) {
        acc[r.package_title] = { count: 0, total: 0 };
      }
      acc[r.package_title].count += 1;
      acc[r.package_title].total += r.sale_amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const topPackagesList = Object.entries(topPackages)
      .map(([title, data]) => ({ title, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        affiliate: toCamelCase({
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          commission_rate: affiliate.commission_rate,
          status: affiliate.status,
          created_at: affiliate.created_at,
        }),
        stats: {
          totalSales: affiliate.total_sales,
          totalEarned: affiliate.total_earned,
          totalBookings: affiliate.total_bookings,
          totalReferrals,
          pendingCommissions,
          approvedCommissions,
          paidCommissions,
        },
        monthlyStats: Object.entries(monthlyStats).map(([month, data]) => ({
          month,
          ...toCamelCase(data),
        })),
        topPackages: topPackagesList,
        recentReferrals: toCamelCase(affiliate.referrals.slice(0, 10)),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
