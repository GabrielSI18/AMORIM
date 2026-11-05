/**
 * Duas pessoas (ou o mesmo script) clicando ao mesmo tempo.
 */

import { describe, it, assert, assertEqual, call, jsonRequest } from '../harness'
import { table } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, bookingBody, passenger } from '../fixtures'
import { POST as createBooking, PUT as updateBooking } from '@/app/api/bookings/route'

let ip = 2000
const freshIp = () => ({ 'cf-connecting-ip': `192.0.2.${ip++ % 255}` })

export function register() {
  describe('Concorrência', () => {
    it('duas reservas simultâneas não ficam com o mesmo assento', async () => {
      seedPackage({ total_seats: 46 })

      const pedido = () =>
        call(
          createBooking,
          jsonRequest(
            'POST',
            '/api/bookings',
            bookingBody({
              numPassengers: 1,
              selectedSeats: [7],
              passengers: [passenger({ seatNumber: 7 })],
            }),
            freshIp(),
          ),
        )

      const [a, b] = await Promise.all([pedido(), pedido()])
      const criadas = [a, b].filter((r) => r.status === 201).length

      assertEqual(criadas, 1, 'as duas reservas pegaram o assento 7 ao mesmo tempo')
    })

    it('duas reservas simultâneas não estouram a última vaga', async () => {
      seedPackage({ total_seats: 1 })

      const pedido = () =>
        call(createBooking, jsonRequest('POST', '/api/bookings', bookingBody({ numPassengers: 1 }), freshIp()))

      const [a, b] = await Promise.all([pedido(), pedido()])
      const criadas = [a, b].filter((r) => r.status === 201).length

      assertEqual(criadas, 1, `o ônibus tinha 1 vaga e saíram ${criadas} reservas`)
    })

    it('mesma reserva marcada como paga em paralelo gera uma comissão só', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })
      const admin = seedUser({ clerk_id: 'user_admin', role: 'ADMIN', email: 'admin@a.com' })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      const bookingId = table('booking')[0].id

      setSession(admin.clerk_id)
      await Promise.all([
        call(updateBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' })),
        call(updateBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' })),
      ])
      setSession(null)

      assertEqual(table('affiliateReferral').length, 1, 'duplicou a indicação')
    })

    it('o contador de vagas do pacote bate com as reservas ativas', async () => {
      seedPackage({ total_seats: 10 })

      for (let i = 0; i < 3; i++) {
        await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ numPassengers: 2 }), freshIp()),
        )
      }

      const pkg = table('package')[0]
      assertEqual(pkg.available_seats, 4, 'available_seats desencontrado das reservas')
      assertEqual(pkg.bookings_count, 3)
    })
  })
}
