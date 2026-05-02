import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';

/**
 * GET /api/affiliates/me
 * Retorna dados do afiliado do usuário logado
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar afiliado pelo user_id OU email
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        OR: [
          { user_id: user.id },
          { email: user.email },
        ],
      },
      include: {
        referrals: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({
        isAffiliate: false,
        data: null,
      });
    }

    // Calcular estatísticas — toleramos qualquer case no commission_status
    // pra evitar problemas com dados antigos gravados em UPPERCASE.
    const csLower = (r: { commission_status: string | null }) =>
      (r.commission_status || '').toLowerCase();
    const pendingReferrals = affiliate.referrals.filter(r => csLower(r) === 'pending');
    const approvedReferrals = affiliate.referrals.filter(
      r => csLower(r) === 'approved' || csLower(r) === 'paid'
    );
    const paidReferrals = affiliate.referrals.filter(r => csLower(r) === 'paid');

    const stats = {
      totalReferrals: affiliate.referrals.length,
      pendingReferrals: pendingReferrals.length,
      approvedReferrals: approvedReferrals.length,
      paidReferrals: paidReferrals.length,
      pendingCommission: pendingReferrals.reduce((sum, r) => sum + r.commission_amount, 0),
      approvedCommission: approvedReferrals.reduce((sum, r) => sum + r.commission_amount, 0),
      paidCommission: paidReferrals.reduce((sum, r) => sum + r.commission_amount, 0),
    };

    return NextResponse.json({
      isAffiliate: true,
      data: {
        ...toCamelCase(affiliate),
        stats,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar afiliado:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de afiliado' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliates/me
 * Cadastra o usuário logado como afiliado
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Rate limit — endpoint autenticado mas evita criação em loop
    // (cada user só pode ser afiliado uma vez de qualquer forma).
    const limit = generalApiLimiter(`affiliates:me:${userId}`);
    if (!limit.success) return rateLimitExceededResponse(limit);

    const body = await request.json();
    const { phone, cpf, pixKey } = body;

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { id: true, email: true, first_name: true, last_name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já é afiliado
    const existingAffiliate = await prisma.affiliate.findFirst({
      where: {
        OR: [
          { user_id: user.id },
          { email: user.email },
        ],
      },
    });

    if (existingAffiliate) {
      return NextResponse.json(
        { error: 'Você já está cadastrado como afiliado' },
        { status: 409 }
      );
    }

    // Gerar código único
    const generateCode = (name: string): string => {
      const firstPart = name
        .split(' ')[0]
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 6);
      
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      return `${firstPart}${randomPart}`;
    };

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'AFILIADO';
    let code = generateCode(fullName);
    
    // Garantir que o código é único
    let codeExists = await prisma.affiliate.findUnique({ where: { code } });
    while (codeExists) {
      code = generateCode(fullName);
      codeExists = await prisma.affiliate.findUnique({ where: { code } });
    }

    // Criar afiliado
    const affiliate = await prisma.affiliate.create({
      data: {
        user_id: user.id,
        name: fullName,
        email: user.email,
        phone: phone || null,
        cpf: cpf || null,
        pix_key: pixKey || null,
        code,
        commission_rate: 7, // 7% inicial
        status: 'pending', // Aguarda aprovação
      },
    });

    return NextResponse.json(
      {
        data: toCamelCase(affiliate),
        message: 'Cadastro enviado! Aguarde aprovação em até 24h.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar afiliado:', error);
    return NextResponse.json(
      { error: 'Erro ao criar afiliado' },
      { status: 500 }
    );
  }
}
