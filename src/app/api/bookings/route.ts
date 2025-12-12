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
            destination_rel: true,
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

    const body: CreateBookingDto & { selectedSeats?: number[] } = await req.json();

    // Validação
    if (!body.packageId || !body.customerName || !body.customerEmail || !body.customerPhone || !body.numPassengers) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se pacote existe e tem vagas
    const package_ = await prisma.package.findUnique({
      where: { id: body.packageId },
    });

    if (!package_) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }

    if (package_.available_seats && package_.available_seats < body.numPassengers) {
      return NextResponse.json(
        { error: `Apenas ${package_.available_seats} vagas disponíveis` },
        { status: 400 }
      );
    }

    // Validar assentos selecionados (se fornecidos)
    if (body.selectedSeats && body.selectedSeats.length > 0) {
      // Verificar se a quantidade de assentos bate com numPassengers
      if (body.selectedSeats.length !== body.numPassengers) {
        return NextResponse.json(
          { error: `Número de assentos (${body.selectedSeats.length}) deve ser igual ao número de passageiros (${body.numPassengers})` },
          { status: 400 }
        );
      }

      // Buscar assentos já ocupados
      const existingBookings = await prisma.booking.findMany({
        where: {
          package_id: body.packageId,
          status: { in: ['pending', 'confirmed'] },
        },
        select: { selected_seats: true },
      });

      const occupiedSeats = new Set<number>();
      for (const booking of existingBookings) {
        if (booking.selected_seats && Array.isArray(booking.selected_seats)) {
          (booking.selected_seats as number[]).forEach(seat => occupiedSeats.add(seat));
        }
      }

      // Verificar se algum assento selecionado já está ocupado
      const conflictingSeats = body.selectedSeats.filter(seat => occupiedSeats.has(seat));
      if (conflictingSeats.length > 0) {
        return NextResponse.json(
          { error: `Assento(s) ${conflictingSeats.join(', ')} já está(ão) ocupado(s). Por favor, escolha outro(s).` },
          { status: 409 }
        );
      }

      // Verificar se assentos estão dentro do range válido
      const totalSeats = package_.total_seats || 0;
      const invalidSeats = body.selectedSeats.filter(seat => seat < 1 || seat > totalSeats);
      if (invalidSeats.length > 0) {
        return NextResponse.json(
          { error: `Assento(s) inválido(s): ${invalidSeats.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Calcular valor total
    const totalAmount = package_.price * body.numPassengers;

    // Criar reserva
    const booking = await prisma.booking.create({
      data: {
        package_id: body.packageId,
        user_id: userId || undefined,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone,
        customer_cpf: body.customerCpf,
        num_passengers: body.numPassengers,
        total_amount: totalAmount,
        customer_notes: body.customerNotes,
        selected_seats: body.selectedSeats ?? undefined,
      },
      include: {
        package: {
          include: {
            destination_rel: true,
          },
        },
      },
    });

    // Atualizar vagas disponíveis
    await prisma.package.update({
      where: { id: body.packageId },
      data: {
        available_seats: { decrement: body.numPassengers },
        bookings_count: { increment: 1 },
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
