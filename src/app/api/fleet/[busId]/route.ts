import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

/**
 * GET /api/fleet/[busId]
 * Busca um ônibus específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
  try {
    const { busId } = await params;

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
    });

    if (!bus) {
      return NextResponse.json(
        { error: 'Ônibus não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: toCamelCase(bus) });
  } catch (error) {
    console.error('[API] GET /api/fleet/[busId] error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ônibus' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/fleet/[busId]
 * Atualiza um ônibus
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
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

    const { busId } = await params;
    const body = await request.json();

    // Verificar se ônibus existe
    const existingBus = await prisma.bus.findUnique({
      where: { id: busId },
    });

    if (!existingBus) {
      return NextResponse.json(
        { error: 'Ônibus não encontrado' },
        { status: 404 }
      );
    }

    // Se mudou a placa, verificar se nova placa já existe
    if (body.plate && body.plate.toUpperCase() !== existingBus.plate) {
      const plateExists = await prisma.bus.findUnique({
        where: { plate: body.plate.toUpperCase() },
      });

      if (plateExists) {
        return NextResponse.json(
          { error: 'Já existe um ônibus com esta placa' },
          { status: 409 }
        );
      }
    }

    const data: any = {};
    if (body.model !== undefined) data.model = body.model;
    if (body.year !== undefined) data.year = parseInt(body.year);
    if (body.plate !== undefined) data.plate = body.plate.toUpperCase();
    if (body.seats !== undefined) data.seats = parseInt(body.seats);
    if (body.floors !== undefined) data.floors = parseInt(body.floors);
    if (body.photos !== undefined) data.photos = body.photos;
    if (body.is_active !== undefined) data.is_active = body.is_active;

    const bus = await prisma.bus.update({
      where: { id: busId },
      data,
    });

    return NextResponse.json({ data: toCamelCase(bus) });
  } catch (error) {
    console.error('[API] PUT /api/fleet/[busId] error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar ônibus' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fleet/[busId]
 * Remove um ônibus (soft delete - desativa)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
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

    const { busId } = await params;

    // Verificar se ônibus existe
    const existingBus = await prisma.bus.findUnique({
      where: { id: busId },
    });

    if (!existingBus) {
      return NextResponse.json(
        { error: 'Ônibus não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem pacotes associados
    const packagesCount = await prisma.package.count({
      where: { bus_id: busId },
    });

    if (packagesCount > 0) {
      // Soft delete - apenas desativa
      await prisma.bus.update({
        where: { id: busId },
        data: { is_active: false },
      });

      return NextResponse.json({ 
        message: 'Ônibus desativado (possui pacotes associados)',
        softDeleted: true,
      });
    }

    // Hard delete - remove do banco
    await prisma.bus.delete({
      where: { id: busId },
    });

    return NextResponse.json({ message: 'Ônibus removido com sucesso' });
  } catch (error) {
    console.error('[API] DELETE /api/fleet/[busId] error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover ônibus' },
      { status: 500 }
    );
  }
}
