import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { toCamelCase } from '@/lib/case-transform';
import type { CreateBookingDto } from '@/types';

/**
 * GET /api/bookings
 * Lista reservas (filtradas por usuário ou todas se admin)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');

    const where: any = {};
    
    // TODO: Verificar se é admin, senão filtrar por userId
    if (packageId) where.package_id = packageId;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        package: {
          include: {
            destination: true,
            category: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: toCamelCase(bookings) });
  } catch (error) {
    console.error('[API] GET /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reservas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Cria nova reserva
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Rate limiting (mesmo sem userId)
    const identifier = userId || 'anonymous';
    const rateLimitResult = generalApiLimiter(identifier);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body: CreateBookingDto = await req.json();

    // Validação
    if (!body.package_id || !body.customer_name || !body.customer_email || !body.customer_phone || !body.num_passengers) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se pacote existe e tem vagas
    const package_ = await prisma.package.findUnique({
      where: { id: body.package_id },
    });

    if (!package_) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }

    if (package_.available_seats < body.num_passengers) {
      return NextResponse.json(
        { error: `Apenas ${package_.available_seats} vagas disponíveis` },
        { status: 400 }
      );
    }

    // Calcular valor total
    const totalAmount = package_.price * body.num_passengers;

    // Criar reserva
    const booking = await prisma.booking.create({
      data: {
        package_id: body.package_id,
        user_id: userId || undefined,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_cpf: body.customer_cpf,
        num_passengers: body.num_passengers,
        total_amount: totalAmount,
        customer_notes: body.customer_notes,
      },
      include: {
        package: {
          include: {
            destination: true,
          },
        },
      },
    });

    // Atualizar vagas disponíveis
    await prisma.package.update({
      where: { id: body.package_id },
      data: {
        available_seats: { decrement: body.num_passengers },
        bookingsCount: { increment: 1 },
      },
    });

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar reserva' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings
 * Atualiza status da reserva (admin)
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, paymentStatus, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da reserva é obrigatório' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (paymentStatus) {
      data.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') data.paidAt = new Date();
    }
    if (notes !== undefined) data.notes = notes;

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        package: true,
      },
    });

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error('[API] PUT /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    );
  }
}
