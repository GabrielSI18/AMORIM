import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/packages/[packageId]/seats - Busca assentos ocupados de um pacote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    // Busca o pacote para pegar total de assentos e ônibus
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      select: {
        id: true,
        title: true,
        total_seats: true,
        bus: {
          select: {
            id: true,
            model: true,
            year: true,
            plate: true,
            seats: true,
            floors: true,
            photos: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'Pacote não encontrado' },
        { status: 404 }
      );
    }

    // Busca todas as reservas confirmadas/pending deste pacote
    const bookings = await prisma.booking.findMany({
      where: {
        package_id: packageId,
        status: {
          in: ['pending', 'confirmed'],
        },
      },
      select: {
        id: true,
        selected_seats: true,
        num_passengers: true,
      },
    });

    // Extrai todos os assentos ocupados
    const occupiedSeats: number[] = [];
    let totalParticipants = 0;

    for (const booking of bookings) {
      totalParticipants += booking.num_passengers;
      
      if (booking.selected_seats && Array.isArray(booking.selected_seats)) {
        occupiedSeats.push(...(booking.selected_seats as number[]));
      }
    }

    // Remove duplicatas e ordena
    const uniqueOccupiedSeats = [...new Set(occupiedSeats)].sort((a, b) => a - b);

    return NextResponse.json({
      packageId: pkg.id,
      packageTitle: pkg.title,
      totalSeats: pkg.total_seats || 0,
      occupiedSeats: uniqueOccupiedSeats,
      availableSeats: (pkg.total_seats || 0) - uniqueOccupiedSeats.length,
      totalBookings: bookings.length,
      totalParticipants,
      bus: pkg.bus,
    });
  } catch (error) {
    console.error('Erro ao buscar assentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
