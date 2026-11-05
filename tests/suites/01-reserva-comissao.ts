/**
 * Caminho do dinheiro: reserva criada com código de indicação → comissão.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest } from '../harness'
import { table } from '../mocks/prisma'
import { sentEmails } from '../mocks/email'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, bookingBody, passenger, PKG_ID, PRICE } from '../fixtures'
import { POST as createBooking, PUT as updateBooking } from '@/app/api/bookings/route'

let ipCounter = 0
/** Cada chamada usa um IP diferente para não esbarrar no rate limit entre testes */
function freshIp(): Record<string, string> {
  ipCounter++
  return { 'cf-connecting-ip': `203.0.113.${ipCounter % 250}${Math.floor(ipCounter / 250)}` }
}

export function register() {
  describe('Reserva com indicação — comissão', () => {
    it('gera comissão de 7% para afiliado ativo', async () => {
      seedPackage()
      const aff = seedAffiliate({ code: 'MARIA01', commission_rate: 7 })

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )

      assertStatus(res, 201, 'criar reserva com código válido:')
      assertEqual(res.body.affiliateApplied, 'MARIA01')

      const referrals = table('affiliateReferral')
      assertEqual(referrals.length, 1, 'deveria existir exatamente uma indicação')
      assertEqual(referrals[0].affiliate_id, aff.id)
      assertEqual(referrals[0].sale_amount, PRICE)
      assertEqual(referrals[0].commission_amount, Math.floor(PRICE * 0.07), 'comissão de 7% sobre R$1.490')
      assertEqual(referrals[0].commission_status, 'pending', 'comissão nasce pendente')
    })

    it('respeita a taxa individual do afiliado (10%)', async () => {
      seedPackage()
      seedAffiliate({ code: 'OURO10', commission_rate: 10 })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'OURO10' }), freshIp()),
      )

      assertEqual(table('affiliateReferral')[0].commission_amount, Math.floor(PRICE * 0.1))
    })

    it('código em minúsculas continua valendo', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'maria01' }), freshIp()),
      )

      assertEqual(res.body.affiliateApplied, 'MARIA01')
      assertEqual(table('affiliateReferral').length, 1)
    })

    it('afiliado pendente NÃO ganha comissão', async () => {
      seedPackage()
      seedAffiliate({ code: 'PEND01', status: 'pending' })

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'PEND01' }), freshIp()),
      )

      assertStatus(res, 201, 'reserva deve ser criada mesmo assim:')
      assertEqual(res.body.affiliateApplied, null)
      assertEqual(res.body.affiliateWarning, 'inactive')
      assertEqual(table('affiliateReferral').length, 0, 'nenhuma comissão para afiliado pendente')
    })

    it('afiliado suspenso/bloqueado NÃO ganha comissão', async () => {
      seedPackage()
      seedAffiliate({ code: 'SUSP01', status: 'suspended' })
      seedAffiliate({ code: 'BLOQ01', status: 'blocked', email: 'bloq@x.com' })

      for (const code of ['SUSP01', 'BLOQ01']) {
        const res = await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: code }), freshIp()),
        )
        assertEqual(res.body.affiliateApplied, null, `${code} não deveria aplicar`)
      }
      assertEqual(table('affiliateReferral').length, 0)
    })

    it('código inexistente não derruba a reserva nem cria comissão', async () => {
      seedPackage()

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'NAOEXISTE' }), freshIp()),
      )

      assertStatus(res, 201)
      assertEqual(res.body.affiliateWarning, 'not_found')
      assertEqual(table('affiliateReferral').length, 0)
    })

    it('status gravado em maiúsculas (dado legado) continua pagando', async () => {
      seedPackage()
      seedAffiliate({ code: 'LEGADO1', status: 'ACTIVE' })

      const res = await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'LEGADO1' }), freshIp()),
      )

      assertEqual(res.body.affiliateApplied, 'LEGADO1')
    })

    it('comissão usa o valor calculado no servidor, não o enviado pelo cliente', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      const res = await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({ affiliateCode: 'MARIA01', totalPrice: 100 }), // tenta pagar R$1,00
          freshIp(),
        ),
      )

      assertStatus(res, 201)
      assertEqual(table('booking')[0].total_amount, PRICE, 'reserva precisa ficar com o preço do pacote')
      assertEqual(table('affiliateReferral')[0].sale_amount, PRICE)
      assertEqual(table('affiliateReferral')[0].commission_amount, Math.floor(PRICE * 0.07))
    })

    it('preço inflado pelo cliente também é ignorado (comissão não incha)', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({ affiliateCode: 'MARIA01', totalPrice: 99999900 }),
          freshIp(),
        ),
      )

      assertEqual(table('affiliateReferral')[0].commission_amount, Math.floor(PRICE * 0.07))
    })

    it('breakdown de crianças não pode baratear a reserva mentindo o número de pagantes', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      const res = await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({
            affiliateCode: 'MARIA01',
            numPassengers: 2,
            passengers: [passenger(), passenger()],
            // diz que são 2 passageiros mas só 1 paga
            passengerDetails: { adults: 1, children_11_13: 0, children_6_10: 0, children_free: 1 },
          }),
          freshIp(),
        ),
      )

      assertStatus(res, 400, 'pagantes != numPassengers deveria ser recusado:')
      assertEqual(table('booking').length, 0)
    })

    it('breakdown legítimo de criança calcula o valor certo', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({
            affiliateCode: 'MARIA01',
            numPassengers: 2,
            passengers: [passenger(), passenger({ birthDate: '2018-01-01' })],
            passengerDetails: { adults: 1, children_11_13: 0, children_6_10: 1, children_free: 0 },
          }),
          freshIp(),
        ),
      )

      const esperado = 149000 + 89000
      assertEqual(table('booking')[0].total_amount, esperado)
      assertEqual(table('affiliateReferral')[0].commission_amount, Math.floor(esperado * 0.07))
    })

    it('valores negativos no breakdown não viram desconto', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      const res = await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({
            affiliateCode: 'MARIA01',
            numPassengers: 1,
            passengerDetails: { adults: 1, children_11_13: -5, children_6_10: 0, children_free: 0 },
          }),
          freshIp(),
        ),
      )

      if (res.status === 201) {
        assert(table('booking')[0].total_amount >= PRICE, 'número negativo virou desconto')
      }
    })

    it('uma reserva gera no máximo uma comissão (sem duplicar)', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )

      const bookingId = table('booking')[0].id
      const doBooking = table('affiliateReferral').filter((r) => r.booking_id === bookingId)
      assertEqual(doBooking.length, 1)
    })

    it('afiliado é avisado por email da venda nova', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com' })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      await new Promise((r) => setTimeout(r, 10)) // fire-and-forget

      const avisos = sentEmails.filter((e) => e.kind === 'affiliate.newSale')
      assertEqual(avisos.length, 1)
      assertEqual(avisos[0].to, 'maria@parceiro.com')
    })

    it('admin marcando a reserva como paga aprova a comissão', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })
      const admin = seedUser({ clerk_id: 'user_admin', role: 'ADMIN', email: 'admin@a.com' })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      const bookingId = table('booking')[0].id

      setSession(admin.clerk_id)
      const res = await call(
        updateBooking,
        jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' }),
      )
      setSession(null)

      assertStatus(res, 200)
      assertEqual(table('affiliateReferral')[0].commission_status, 'approved')
    })

    it('marcar como paga duas vezes não duplica nem reverte a comissão', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })
      const admin = seedUser({ clerk_id: 'user_admin', role: 'ADMIN', email: 'admin@a.com' })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      const bookingId = table('booking')[0].id

      setSession(admin.clerk_id)
      await call(updateBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' }))
      await call(updateBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' }))
      setSession(null)

      assertEqual(table('affiliateReferral').length, 1)
      assertEqual(table('affiliateReferral')[0].commission_status, 'approved')
    })
  })
}
