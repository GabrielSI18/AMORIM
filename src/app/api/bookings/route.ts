import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { toCamelCase } from '@/lib/case-transform';
import { passengersSchema, safeParse } from '@/lib/validations';
import { sendAffiliateNewSaleEmail } from '@/lib/email';
import type { CreateBookingDto } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

/**
 * GET /api/bookings
 * Lista reservas (filtradas por usuário ou todas se admin)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    const bookingId = searchParams.get('id');

    // Buscar reserva específica por ID (permite sem auth para página de confirmação)
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          package: {
            include: {
              destination_rel: true,
              category: true,
            },
          },
          passengers: {
            orderBy: { created_at: 'asc' },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
      }

      const transformedBooking = toCamelCase(booking);
      const bookingResult = {
        ...transformedBooking,
        package: transformedBooking.package ? {
          ...transformedBooking.package,
          destination: transformedBooking.package.destinationRel || null,
        } : null,
      };

      return NextResponse.json({ data: bookingResult });
    }

    // Para listar todas as reservas, precisa de autenticação
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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
        passengers: {
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transforma e mapeia destination_rel para destination nos pacotes
    const transformedBookings = toCamelCase(bookings).map((booking: any) => ({
      ...booking,
      package: booking.package ? {
        ...booking.package,
        destination: booking.package.destinationRel || null,
      } : null,
    }));

    return NextResponse.json({ data: transformedBookings });
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

    const body: CreateBookingDto & {
      selectedSeats?: number[];
      totalPrice?: number;
      passengerDetails?: {
        adults: number;
        children_11_13: number;
        children_6_10: number;
        children_free: number;
      };
      passengers?: unknown;
    } = await req.json();

    // Validação
    if (!body.packageId || !body.customerName || !body.customerEmail || !body.customerPhone || !body.numPassengers) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Validação de passageiros (obrigatório)
    const passengersResult = safeParse(passengersSchema, body.passengers);
    if (!passengersResult.success || !passengersResult.data) {
      return NextResponse.json(
        { error: passengersResult.error || 'Lista de passageiros inválida' },
        { status: 400 }
      );
    }
    const passengers = passengersResult.data;

    if (passengers.length !== body.numPassengers) {
      return NextResponse.json(
        { error: `Cadastre exatamente ${body.numPassengers} passageiro(s)` },
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

    // Calcular valor total (usar do frontend se enviado, senão calcular)
    let totalAmount = body.totalPrice;
    if (!totalAmount) {
      // Fallback: calcular baseado no preço padrão
      totalAmount = package_.price * body.numPassengers;
    }

    // Verificar se há código de afiliado
    // Buscamos só pelo código (que é unique). O filtro de status feito antes
    // dentro do findUnique era frágil — bastava o admin aprovar o afiliado com
    // status em UPPERCASE ('ACTIVE') que o lookup retornava null e a indicação
    // nunca era gravada. Agora tolera qualquer case.
    let affiliate = null;
    if (body.affiliateCode) {
      const affiliateRecord = await prisma.affiliate.findUnique({
        where: { code: body.affiliateCode.toUpperCase() },
      });
      if (affiliateRecord && affiliateRecord.status?.toLowerCase() === 'active') {
        affiliate = affiliateRecord;
      } else if (affiliateRecord) {
        console.warn(
          `[booking.affiliate] código ${body.affiliateCode} encontrado, mas status="${affiliateRecord.status}" não é "active" — ignorando atribuição`
        );
      } else {
        console.warn(`[booking.affiliate] código ${body.affiliateCode} não encontrado — ignorando atribuição`);
      }
    }

    // Criar reserva + passageiros em transação
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
        passengers: {
          create: passengers.map((p, idx) => ({
            full_name: p.fullName,
            cpf: p.cpf,
            birth_date: new Date(p.birthDate),
            phone: p.phone,
            sex: p.sex,
            rg: p.rg || null,
            emergency_contact_name: p.emergencyContactName || null,
            emergency_contact_phone: p.emergencyContactPhone || null,
            is_responsible: p.isResponsible ?? false,
            seat_number: p.seatNumber ?? body.selectedSeats?.[idx] ?? null,
          })),
        },
      },
      include: {
        package: {
          include: {
            destination_rel: true,
          },
        },
        passengers: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    // Transforma e mapeia destination_rel para destination
    const transformedBooking = toCamelCase(booking);
    const bookingResult = {
      ...transformedBooking,
      package: transformedBooking.package ? {
        ...transformedBooking.package,
        destination: transformedBooking.package.destinationRel || null,
      } : null,
    };

    // Se há afiliado válido, criar registro de indicação + notificar afiliado
    if (affiliate) {
      const commissionAmount = Math.floor(totalAmount * (affiliate.commission_rate / 100));

      await prisma.affiliateReferral.create({
        data: {
          affiliate_id: affiliate.id,
          booking_id: booking.id,
          package_title: package_.title,
          customer_email: body.customerEmail,
          sale_amount: totalAmount,
          commission_amount: commissionAmount,
          commission_status: 'pending', // Aguarda aprovação manual
        },
      });

      // Notifica afiliado em fire-and-forget — falha de email não derruba a reserva
      if (affiliate.email) {
        sendAffiliateNewSaleEmail({
          to: affiliate.email,
          affiliateName: affiliate.name,
          packageTitle: package_.title,
          saleAmount: formatBRL(totalAmount),
          commissionAmount: formatBRL(commissionAmount),
          panelUrl: `${APP_URL}/dashboard/parceiro`,
        }).catch((err) => {
          console.error('[booking.affiliate] email error:', err);
        });
      }
    }

    // Atualizar vagas disponíveis
    await prisma.package.update({
      where: { id: body.packageId },
      data: {
        available_seats: { decrement: body.numPassengers },
        bookings_count: { increment: 1 },
      },
    });

    return NextResponse.json({ 
      data: booking,
      affiliateApplied: affiliate ? affiliate.code : null,
    }, { status: 201 });
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
      data.payment_status = paymentStatus;
      if (paymentStatus === 'paid') data.paid_at = new Date();
    }
    if (notes !== undefined) data.notes = notes;

    // Buscar reserva atual para verificar se está sendo cancelada
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      select: {
        status: true,
        num_passengers: true,
        package_id: true,
        selected_seats: true,
        payment_status: true,
      },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Se está sendo cancelada (e não era cancelada antes), liberar vagas
    if (status === 'canceled' && currentBooking.status !== 'canceled') {
      await prisma.package.update({
        where: { id: currentBooking.package_id },
        data: {
          available_seats: { increment: currentBooking.num_passengers },
          bookings_count: { decrement: 1 },
        },
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        package: true,
      },
    });

    // Quando o admin marca a reserva como paga, aprovar a comissão do afiliado
    // (caso exista AffiliateReferral pendente vinculada a esse booking).
    // Só dispara na transição: estava pendente/falha → agora paid.
    if (
      paymentStatus === 'paid' &&
      currentBooking.payment_status !== 'paid'
    ) {
      try {
        await prisma.affiliateReferral.updateMany({
          where: {
            booking_id: id,
            commission_status: 'pending',
          },
          data: {
            commission_status: 'approved',
            updated_at: new Date(),
          },
        });
      } catch (err) {
        console.error('[booking.PUT] erro ao aprovar comissão do afiliado:', err);
      }
    }

    // Obs: cancelamento de reserva NÃO altera automaticamente a comissão.
    // Mantemos a indicação no histórico do afiliado e o admin decide manualmente
    // se quer reverter (UI em /dashboard/afiliados/[id]).

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error('[API] PUT /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    );
  }
}
