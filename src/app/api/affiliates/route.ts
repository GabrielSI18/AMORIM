import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { toCamelCase, toSnakeCase } from '@/lib/case-transform';
import { computeAffiliateTotals } from '@/lib/affiliate-totals';
import { sendAffiliateApprovedEmail } from '@/lib/email';
import { requireAdminApi } from '@/lib/api-auth';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { emailSchema, optionalPhoneSchema } from '@/lib/validations';
import { AFFILIATE_STATUSES } from '@/lib/affiliate-status';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';

// Schema público de cadastro de afiliado (POST /api/affiliates).
// Não aceita campos privilegiados (userId, status, commission_rate, etc).
const publicAffiliateRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  email: emailSchema,
  phone: optionalPhoneSchema,
  cpf: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v === '' || v.length === 11, 'CPF deve ter 11 dígitos')
    .optional(),
});

/**
 * GET /api/affiliates (admin-only)
 * Lista afiliados ou busca por código/email/id.
 * Era público antes — passou a exigir admin para não vazar nome/email/CPF/telefone/comissão
 * de toda a base de afiliados a quem souber adivinhar a URL.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    // Buscar afiliado específico.
    // Um `{}` dentro do OR do Prisma casa com TODOS os registros: buscar por
    // id devolvia o primeiro afiliado da tabela quando code/email vinham
    // vazios, e código inexistente devolvia alguém no lugar de 404.
    if (code || email || id) {
      const filtros: Record<string, string>[] = [];
      if (code) filtros.push({ code: code.toUpperCase() });
      if (email) filtros.push({ email: email.trim().toLowerCase() });
      if (id) filtros.push({ id });

      const affiliate = await prisma.affiliate.findFirst({
        where: { OR: filtros },
        include: {
          referrals: {
            orderBy: { created_at: 'desc' },
            take: 20,
          },
        },
      });

      if (!affiliate) {
        return NextResponse.json(
          { error: 'Afiliado não encontrado' },
          { status: 404 }
        );
      }

      // Get user data if user_id exists
      let userData = null;
      if (affiliate.user_id) {
        const affiliateUser = await prisma.user.findUnique({
          where: { id: affiliate.user_id },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        });
        userData = affiliateUser;
      }

      return NextResponse.json({
        data: toCamelCase({ ...affiliate, user: userData }),
      });
    }

    // Build where clause
    // Status é armazenado em lowercase (ver normalização em PATCH /affiliates/[id]).
    // Antes esse filtro forçava toUpperCase, o que dava 0 resultados sempre que o
    // banco já estava normalizado.
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status.toLowerCase();
    }

    // Listar todos os afiliados (admin)
    const affiliates = await prisma.affiliate.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        referrals: {
          select: {
            id: true,
            sale_amount: true,
            commission_amount: true,
            commission_status: true,
          },
        },
      },
    });

    // Fetch user data for affiliates with user_id
    const userIds = affiliates
      .filter(a => a.user_id)
      .map(a => a.user_id as string);
    
    const users = userIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        })
      : [];
    
    const usersMap = new Map(users.map(u => [u.id, u]));

    return NextResponse.json({
      affiliates: affiliates.map(a => ({
        ...a,
        user: a.user_id ? usersMap.get(a.user_id) || { 
          id: null,
          first_name: a.name.split(' ')[0],
          last_name: a.name.split(' ').slice(1).join(' '),
          email: a.email,
        } : {
          id: null,
          first_name: a.name.split(' ')[0],
          last_name: a.name.split(' ').slice(1).join(' '),
          email: a.email,
        },
        // Campos calculados a partir das indicações (os total_* da tabela só
        // contam comissão já paga)
        total_referrals: computeAffiliateTotals(a.referrals).totalReferrals,
        total_sales: computeAffiliateTotals(a.referrals).totalSales,
        total_earnings: computeAffiliateTotals(a.referrals).paidCommission,
        pending_earnings: computeAffiliateTotals(a.referrals).receivableCommission,
      })),
      total: affiliates.length,
    });
  } catch (error) {
    console.error('Erro ao buscar afiliados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar afiliados' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliates (admin-only)
 * Cria afiliado a partir do painel admin (caso especial: o admin
 * pré-cadastra alguém que ainda não tem conta no site).
 *
 * Para auto-cadastro de afiliados (fluxo normal), use o endpoint
 * autenticado POST /api/affiliates/me — ele exige conta Clerk e
 * vincula `user_id` automaticamente.
 *
 * Antes era público; mas como hoje o auto-cadastro vai por
 * /api/affiliates/me, o uso público foi descontinuado para reduzir
 * superfície de spam e fraude (cadastros órfãos sem conta).
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  try {
    const rawBody = await request.json();
    const validation = publicAffiliateRegistrationSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }
    const { name, email, phone, cpf } = validation.data;

    // Verificar se email já existe
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { email },
    });

    if (existingAffiliate) {
      return NextResponse.json(
        { error: 'Email já cadastrado como afiliado' },
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

    let code = generateCode(name);
    
    // Garantir que o código é único
    let codeExists = await prisma.affiliate.findUnique({ where: { code } });
    while (codeExists) {
      code = generateCode(name);
      codeExists = await prisma.affiliate.findUnique({ where: { code } });
    }

    // Criar afiliado (user_id sempre null aqui — fluxo público;
    // o vínculo com User logado é feito via POST /api/affiliates/me).
    const affiliate = await prisma.affiliate.create({
      data: {
        user_id: null,
        name,
        email,
        phone: phone || null,
        cpf: cpf || null,
        code,
        commission_rate: 7, // 7% inicial — admin pode ajustar no painel depois
        status: 'pending', // Aguarda aprovação
      },
    });

    // TODO: Enviar email de confirmação

    return NextResponse.json(
      {
        data: toCamelCase(affiliate),
        // A aprovação é manual: a equipe avisa o parceiro pelo WhatsApp
        // (os emails do programa estão desligados em produção).
        message: 'Cadastro criado. A equipe avisa o parceiro pelo WhatsApp quando aprovar.',
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

/**
 * PATCH /api/affiliates (admin-only)
 * Atualiza afiliado (status, dados bancários, taxa de comissão).
 * Era público antes — qualquer um modificava chave PIX, dados bancários
 * e status de qualquer afiliado.
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { id, status, pixKey, bankAccount, commissionRate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do afiliado é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Normaliza status para lowercase — fonte única de verdade no banco.
    const normalizedStatus = status ? String(status).toLowerCase() : null;

    // Antes esta rota gravava qualquer coisa: status "superadmin" (que deixava
    // o parceiro fora de toda consulta) e comissão 9999% ou em texto. A rota
    // irmã (PATCH /api/affiliates/[id]) já validava; agora as duas validam igual.
    if (normalizedStatus && !(AFFILIATE_STATUSES as readonly string[]).includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `Status inválido. Use um destes: ${AFFILIATE_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    if (commissionRate !== undefined) {
      if (typeof commissionRate !== 'number' || !Number.isFinite(commissionRate)) {
        return NextResponse.json({ error: 'A comissão precisa ser um número' }, { status: 400 });
      }
      if (!Number.isInteger(commissionRate)) {
        return NextResponse.json(
          { error: 'Use um número inteiro de porcentagem (ex.: 7, 8, 10)' },
          { status: 400 }
        );
      }
      if (commissionRate < 0 || commissionRate > 100) {
        return NextResponse.json(
          { error: 'A comissão precisa ficar entre 0% e 100%' },
          { status: 400 }
        );
      }
      updateData.commission_rate = commissionRate;
    }

    if (pixKey !== undefined) {
      if (pixKey !== null && (typeof pixKey !== 'string' || pixKey.length > 100)) {
        return NextResponse.json({ error: 'Chave PIX inválida' }, { status: 400 });
      }
      updateData.pix_key = pixKey;
    }

    if (normalizedStatus) updateData.status = normalizedStatus;
    if (bankAccount !== undefined) updateData.bank_account = bankAccount;

    // Buscar status anterior para detectar transição → active
    const previous = await prisma.affiliate.findUnique({
      where: { id },
      select: { status: true },
    });

    // Se aprovando, adicionar data de aprovação
    if (normalizedStatus === 'active') {
      updateData.approved_at = new Date();
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: updateData,
    });

    // Email de aprovação: só envia quando o status muda PARA active (não em re-saves)
    const prevStatusLower = (previous?.status || '').toLowerCase();
    const becameActive =
      normalizedStatus === 'active' && prevStatusLower !== 'active' && affiliate.email;

    if (becameActive) {
      // Disparo em fire-and-forget para não bloquear a response do admin
      sendAffiliateApprovedEmail({
        to: affiliate.email,
        affiliateName: affiliate.name,
        code: affiliate.code,
        commissionRate: affiliate.commission_rate,
        affiliateLink: `${APP_URL}/pacotes?ref=${affiliate.code}`,
        panelUrl: `${APP_URL}/dashboard/parceiro`,
      }).catch((err) => {
        console.error('[affiliate.approve] email error:', err);
      });
    }

    return NextResponse.json({
      data: toCamelCase(affiliate),
      message: 'Afiliado atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar afiliado:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar afiliado' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/affiliates (admin-only)
 * Deleta afiliado (hard delete). Era público antes.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do afiliado é obrigatório' },
        { status: 400 }
      );
    }

    // Afiliado com indicação não é apagado: o delete é em cascata e levaria
    // junto o histórico de comissões (inclusive as já pagas), que é documento
    // de pagamento. A rota PATCH .../[id] com status "blocked" é o caminho
    // para tirar um parceiro de circulação.
    const alvo = await prisma.affiliate.findUnique({
      where: { id },
      include: { _count: { select: { referrals: true } } },
    });

    if (!alvo) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 });
    }

    if (alvo._count.referrals > 0) {
      return NextResponse.json(
        {
          error:
            'Não é possível excluir afiliado com indicações. Use o status "bloqueado" para encerrar a parceria sem perder o histórico.',
        },
        { status: 400 }
      );
    }

    await prisma.affiliate.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Afiliado deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar afiliado:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar afiliado' },
      { status: 500 }
    );
  }
}
