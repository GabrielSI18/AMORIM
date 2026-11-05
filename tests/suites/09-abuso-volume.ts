/**
 * Volume: script batendo na API, reservas-fantasma, enumeração de códigos.
 */

import { describe, it, assert, assertEqual, call, jsonRequest, getRequest } from '../harness'
import { table } from '../mocks/prisma'
import { seedPackage, seedAffiliate, bookingBody } from '../fixtures'
import { POST as createBooking } from '@/app/api/bookings/route'
import { GET as validateCode } from '@/app/api/affiliates/validate/route'

export function register() {
  describe('Abuso por volume', () => {
    it('mesmo email não acumula reservas não pagas no mesmo pacote', async () => {
      seedPackage({ total_seats: 46 })
      seedAffiliate({ code: 'MARIA01' })

      let criadas = 0
      for (let i = 0; i < 20; i++) {
        const res = await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), {
            'cf-connecting-ip': '198.18.1.1',
          }),
        )
        if (res.status === 201) criadas++
      }

      assert(criadas <= 3, `o mesmo email abriu ${criadas} reservas sem pagar nada`)
      assert(criadas >= 1, 'o cliente legítimo precisa conseguir reservar ao menos uma vez')
    })

    it('rate limit por IP segura rajada de reservas com emails diferentes', async () => {
      seedPackage({ total_seats: 200 })

      let criadas = 0
      let bloqueadas = 0
      for (let i = 0; i < 130; i++) {
        const res = await call(
          createBooking,
          jsonRequest(
            'POST',
            '/api/bookings',
            bookingBody({ customerEmail: `bot${i}@spam.com` }),
            { 'cf-connecting-ip': '198.18.2.2' },
          ),
        )
        if (res.status === 201) criadas++
        if (res.status === 429) bloqueadas++
      }

      assert(bloqueadas > 0, `nenhuma das ${criadas} reservas seguidas do mesmo IP foi barrada`)
    })

    it('reserva paga não conta no limite de reservas em aberto', async () => {
      seedPackage({ total_seats: 46 })

      for (let i = 0; i < 3; i++) {
        await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody(), { 'cf-connecting-ip': '198.18.3.3' }),
        )
      }
      // a equipe confirma os pagamentos
      for (const b of table('booking')) b.payment_status = 'paid'

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody(), { 'cf-connecting-ip': '198.18.3.4' }),
      )

      assertEqual(res.status, 201, 'cliente que já pagou ficou impedido de reservar de novo')
    })

    it('reserva cancelada libera o limite', async () => {
      seedPackage({ total_seats: 46 })

      for (let i = 0; i < 3; i++) {
        await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody(), { 'cf-connecting-ip': '198.18.4.1' }),
        )
      }
      for (const b of table('booking')) b.status = 'canceled'

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody(), { 'cf-connecting-ip': '198.18.4.2' }),
      )
      assertEqual(res.status, 201)
    })

    it('validate não vira oráculo para varrer códigos', async () => {
      seedAffiliate({ code: 'MARIA01' })

      let bloqueadas = 0
      for (let i = 0; i < 130; i++) {
        const res = await call(
          validateCode,
          getRequest(`/api/affiliates/validate?code=TESTE${i}`, { 'cf-connecting-ip': '198.18.5.5' }),
        )
        if (res.status === 429) bloqueadas++
      }

      assert(bloqueadas > 0, 'deu para testar 130 códigos seguidos do mesmo IP sem bloqueio')
    })

    it('reserva com 100 passageiros não passa num ônibus de 46', async () => {
      seedPackage({ total_seats: 46 })
      const { passenger } = await import('../fixtures')
      const res = await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({ numPassengers: 60, passengers: Array.from({ length: 60 }, () => passenger()) }),
          { 'cf-connecting-ip': '198.18.6.6' },
        ),
      )
      assert(res.status !== 201, 'reserva maior que o ônibus foi aceita')
      assertEqual(table('booking').length, 0)
    })
  })
}
