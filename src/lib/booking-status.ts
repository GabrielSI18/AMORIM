/**
 * Status de reserva que ainda seguram assento.
 *
 * O filtro antigo era `['pending', 'confirmed']` — reserva PAGA ficava de fora,
 * então o assento de quem já pagou voltava a aparecer livre no mapa e podia ser
 * vendido de novo (aconteceu com os assentos 1 e 2 do pacote de Caldas Novas).
 * A regra certa é: tudo que não foi cancelado ocupa lugar.
 */
export const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'paid'] as const

/** Status que liberam o assento de volta */
export const RELEASED_BOOKING_STATUSES = ['canceled', 'cancelled', 'refunded'] as const

/** Filtro Prisma para reservas que ocupam assento */
export const activeBookingsWhere = {
  status: { notIn: [...RELEASED_BOOKING_STATUSES] },
}
