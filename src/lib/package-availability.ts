/**
 * Vagas disponíveis calculadas a partir das reservas.
 *
 * A coluna `available_seats` é um contador que sobe e desce a cada reserva e
 * cancelamento — qualquer falha no meio do caminho deixa o número errado para
 * sempre (o pacote de Caldas mostrava 50 quando o certo era 51). Aqui a conta
 * sai das reservas ativas, que é a fonte da verdade; o contador continua sendo
 * gravado, mas com o valor recalculado.
 */

import prisma from '@/lib/prisma'
import { activeBookingsWhere } from '@/lib/booking-status'

export interface PackageAvailability {
  totalSeats: number
  /** Passageiros em reservas ativas */
  takenSeats: number
  availableSeats: number
  /** Números de poltrona já escolhidos */
  occupiedSeatNumbers: number[]
  activeBookings: number
}

/** Calcula a disponibilidade de um pacote */
export async function getPackageAvailability(
  packageId: string,
  totalSeats: number | null | undefined
): Promise<PackageAvailability> {
  const bookings = await prisma.booking.findMany({
    where: { package_id: packageId, ...activeBookingsWhere },
    select: { num_passengers: true, selected_seats: true },
  })

  const total = totalSeats || 0
  const takenSeats = bookings.reduce((sum, b) => sum + (b.num_passengers || 0), 0)
  const seatNumbers = new Set<number>()
  for (const booking of bookings) {
    if (Array.isArray(booking.selected_seats)) {
      for (const seat of booking.selected_seats as number[]) seatNumbers.add(seat)
    }
  }

  return {
    totalSeats: total,
    takenSeats,
    availableSeats: Math.max(total - takenSeats, 0),
    occupiedSeatNumbers: [...seatNumbers].sort((a, b) => a - b),
    activeBookings: bookings.length,
  }
}

/**
 * Recalcula e grava `available_seats`/`bookings_count` do pacote.
 * Chamado depois de criar ou cancelar reserva, no lugar de incrementar.
 */
export async function syncPackageAvailability(
  packageId: string,
  totalSeats: number | null | undefined
): Promise<PackageAvailability> {
  const availability = await getPackageAvailability(packageId, totalSeats)

  await prisma.package.update({
    where: { id: packageId },
    data: {
      available_seats: availability.availableSeats,
      bookings_count: availability.activeBookings,
    },
  })

  return availability
}
