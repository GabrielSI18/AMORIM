import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toCamelCase, toSnakeCase } from '@/lib/case-transform';

/**
 * GET /api/affiliates
 * Lista todos os afiliados ou busca por código/email
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    // Buscar afiliado específico
    if (code || email || id) {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          OR: [
            code ? { code: code.toUpperCase() } : {},
            email ? { email } : {},
            id ? { id } : {},
          ],
        },
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
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status.toUpperCase();
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
        // Add computed fields
        total_referrals: a.referrals.length,
        total_earnings: a.referrals
          .filter(r => r.commission_status === 'PAID')
          .reduce((sum, r) => sum + (r.commission_amount || 0), 0),
        pending_earnings: a.referrals
          .filter(r => ['PENDING', 'APPROVED'].includes(r.commission_status || ''))
          .reduce((sum, r) => sum + (r.commission_amount || 0), 0),
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
 * POST /api/affiliates
 * Cria novo afiliado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, cpf, userId } = body;

    // Validações básicas
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

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

    // Criar afiliado
    const affiliate = await prisma.affiliate.create({
      data: {
        user_id: userId || null,
        name,
        email,
        phone: phone || null,
        cpf: cpf || null,
        code,
        commission_rate: 10, // 10% padrão
        status: 'pending', // Aguarda aprovação
      },
    });

    // TODO: Enviar email de confirmação

    return NextResponse.json(
      {
        data: toCamelCase(affiliate),
        message: 'Cadastro enviado! Você receberá um email em até 24h.',
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
 * PATCH /api/affiliates
 * Atualiza afiliado (status, dados bancários, etc)
 */
export async function PATCH(request: NextRequest) {
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

    if (status) updateData.status = status;
    if (pixKey !== undefined) updateData.pix_key = pixKey;
    if (bankAccount !== undefined) updateData.bank_account = bankAccount;
    if (commissionRate !== undefined) updateData.commission_rate = commissionRate;

    // Se aprovando, adicionar data de aprovação
    if (status === 'active') {
      updateData.approved_at = new Date();
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: updateData,
    });

    // TODO: Enviar email de aprovação se status mudou para active

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
 * DELETE /api/affiliates
 * Deleta afiliado
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do afiliado é obrigatório' },
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
