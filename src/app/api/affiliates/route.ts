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

      return NextResponse.json({
        data: toCamelCase(affiliate),
      });
    }

    // Listar todos os afiliados (admin)
    const affiliates = await prisma.affiliate.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        referrals: {
          select: {
            id: true,
            sale_amount: true,
            commission_amount: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: toCamelCase(affiliates),
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
