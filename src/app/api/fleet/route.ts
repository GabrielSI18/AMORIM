import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

/**
 * GET /api/fleet
 * Lista todos os ônibus da frota
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.is_active = true;
    }

    const buses = await prisma.bus.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: toCamelCase(buses) });
  } catch (error) {
    console.error('[API] GET /api/fleet error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar frota' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fleet
 * Cadastra novo ônibus na frota
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();

    // Validação
    if (!body.model || !body.year || !body.plate || !body.seats) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: modelo, ano, placa e quantidade de assentos' },
        { status: 400 }
      );
    }

    // Verificar se placa já existe
    const existingBus = await prisma.bus.findUnique({
      where: { plate: body.plate.toUpperCase() },
    });

    if (existingBus) {
      return NextResponse.json(
        { error: 'Já existe um ônibus com esta placa' },
        { status: 409 }
      );
    }

    const bus = await prisma.bus.create({
      data: {
        model: body.model,
        year: parseInt(body.year),
        plate: body.plate.toUpperCase(),
        seats: parseInt(body.seats),
        floors: parseInt(body.floors) || 1,
        photos: body.photos || [],
        is_active: body.is_active ?? true,
      },
    });

    return NextResponse.json({ data: toCamelCase(bus) }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/fleet error:', error);
    const message =
      (error as Error)?.message || 'Erro interno ao cadastrar ônibus';

    return NextResponse.json(
      {
        error: `Erro ao cadastrar ônibus: ${message}`,
      },
      { status: 500 }
    );
  }
}
