/**
 * Junta às indicações a data da viagem e a situação do pagamento da comissão
 * (ver src/lib/affiliate-retention.ts). Só para uso no servidor.
 *
 * A indicação guarda só o `booking_id` (sem relação no schema), então a data
 * de saída vem de uma consulta à parte: uma por chamada, não uma por indicação.
 */

import prisma from '@/lib/prisma'
import { commissionReleaseDate, payoutState, type PayoutState } from '@/lib/affiliate-retention'

export interface ReleaseInfo {
  departure_date: Date | null
  release_date: Date | null
  booking_status: string | null
  booking_payment_status: string | null
}

export type WithRelease<T> = T & ReleaseInfo & { payout_state: PayoutState }

export async function loadReleaseInfo(bookingIds: (string | null | undefined)[]): Promise<Map<string, ReleaseInfo>> {
  const ids = [...new Set(bookingIds.filter((id): id is string => !!id))]
  const info = new Map<string, ReleaseInfo>()
  if (ids.length === 0) return info

  const bookings = await prisma.booking.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      status: true,
      payment_status: true,
      package: { select: { departure_date: true } },
    },
  })

  for (const booking of bookings) {
    const departure = booking.package?.departure_date ?? null
    info.set(booking.id, {
      departure_date: departure,
      release_date: commissionReleaseDate(departure),
      booking_status: booking.status ?? null,
      booking_payment_status: booking.payment_status ?? null,
    })
  }
  return info
}

/** Acrescenta data de saída, data de liberação e situação do pagamento a cada indicação */
export async function withReleaseInfo<
  T extends { booking_id: string | null; commission_status: string | null },
>(referrals: T[], now: Date = new Date()): Promise<WithRelease<T>[]> {
  const info = await loadReleaseInfo(referrals.map((r) => r.booking_id))

  return referrals.map((referral) => {
    const extra: ReleaseInfo = (referral.booking_id && info.get(referral.booking_id)) || {
      departure_date: null,
      release_date: null,
      booking_status: null,
      booking_payment_status: null,
    }
    return {
      ...referral,
      ...extra,
      payout_state: payoutState(referral.commission_status, extra.release_date, now),
    }
  })
}
