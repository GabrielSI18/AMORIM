import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';

const onlyDigits = (v: string) => v.replace(/\D/g, '');

// Schema de auto-cadastro de afiliado: campos do usuário logado.
// Email/nome NÃO vêm do body — usamos o do User Clerk para garantir vínculo.
const selfAffiliateSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((v) => v === '' || v.length === 10 || v.length === 11, 'Telefone inválido')
    .optional(),
  cpf: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((v) => v === '' || v.length === 11 || v.length === 14, 'CPF/CNPJ inválido')
    .optional(),
  pixKey: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === '' || /^[A-Z]{2}$/.test(v), 'UF deve ter 2 letras')
    .optional(),
  instagramHandle: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ''))
    .refine((v) => v === '' || /^[A-Za-z0-9._]+$/.test(v), 'Handle do Instagram inválido')
    .optional(),
  bankName: z.string().trim().max(80).optional(),
});

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

    const rawBody = await request.json();
    const validation = selfAffiliateSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 },
      );
    }
    const { phone, cpf, pixKey, city, state, instagramHandle, bankName } = validation.data;

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

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'AFILIADO';

    // Caso 1: já existe afiliado vinculado a esse user → conflito
    const existingByUser = await prisma.affiliate.findFirst({
      where: { user_id: user.id },
    });
    if (existingByUser) {
      return NextResponse.json(
        { error: 'Você já está cadastrado como afiliado' },
        { status: 409 }
      );
    }

    // Caso 2: existe afiliado órfão (legado do form público antigo) com mesmo
    // email → vincular ao user atual em vez de criar duplicado, e completar
    // os dados que vieram do form. Mantém status atual (ex: já aprovado).
    const orphanAffiliate = await prisma.affiliate.findFirst({
      where: { email: user.email, user_id: null },
    });
    if (orphanAffiliate) {
      const linked = await prisma.affiliate.update({
        where: { id: orphanAffiliate.id },
        data: {
          user_id: user.id,
          name: fullName || orphanAffiliate.name,
          phone: phone || orphanAffiliate.phone,
          cpf: cpf || orphanAffiliate.cpf,
          pix_key: pixKey || orphanAffiliate.pix_key,
          city: city || orphanAffiliate.city,
          state: state || orphanAffiliate.state,
          instagram_handle: instagramHandle || orphanAffiliate.instagram_handle,
          bank_name: bankName || orphanAffiliate.bank_name,
        },
      });
      return NextResponse.json(
        {
          data: toCamelCase(linked),
          linked: true,
          message: 'Cadastro vinculado à sua conta! Você já pode acessar o painel.',
        },
        { status: 200 },
      );
    }

    // Caso 3: cadastro novo
    const generateCode = (name: string): string => {
      const firstPart = name
        .split(' ')[0]
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 6);
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${firstPart}${randomPart}`;
    };

    let code = generateCode(fullName);
    let codeExists = await prisma.affiliate.findUnique({ where: { code } });
    while (codeExists) {
      code = generateCode(fullName);
      codeExists = await prisma.affiliate.findUnique({ where: { code } });
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        user_id: user.id,
        name: fullName,
        email: user.email,
        phone: phone || null,
        cpf: cpf || null,
        pix_key: pixKey || null,
        city: city || null,
        state: state || null,
        instagram_handle: instagramHandle || null,
        bank_name: bankName || null,
        code,
        commission_rate: 7, // 7% inicial
        status: 'pending',
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
