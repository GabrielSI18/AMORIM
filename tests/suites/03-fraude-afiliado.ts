/**
 * O que um afiliado mal-intencionado tentaria fazer.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest, getRequest } from '../harness'
import { table } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, seedAdmin, bookingBody, PKG_ID, PRICE } from '../fixtures'

import { POST as createBooking } from '@/app/api/bookings/route'
import { POST as postMe } from '@/app/api/affiliates/me/route'
import { PATCH as patchAffiliate, POST as adminCreateAffiliate } from '@/app/api/affiliates/route'
import { PATCH as patchAffiliateById } from '@/app/api/affiliates/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

let ip = 1000
const freshIp = () => ({ 'cf-connecting-ip': `198.51.100.${ip++ % 255}` })

export function register() {
  describe('Fraude do afiliado', () => {
    it('afiliado não ganha comissão comprando para si mesmo', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com' })

      const res = await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({ affiliateCode: 'MARIA01', customerEmail: 'maria@parceiro.com' }),
          freshIp(),
        ),
      )

      assertStatus(res, 201, 'a reserva em si pode existir:')
      assertEqual(
        table('affiliateReferral').length,
        0,
        'auto-indicação não pode gerar comissão (mesmo email do afiliado)',
      )
    })

    it('auto-indicação não passa nem com email escrito diferente', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com' })

      await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({ affiliateCode: 'MARIA01', customerEmail: '  MARIA@Parceiro.com ' }),
          freshIp(),
        ),
      )

      assertEqual(table('affiliateReferral').length, 0, 'variação de caixa/espaço burlou a trava')
    })

    it('afiliado logado não ganha comissão na própria conta', async () => {
      seedPackage()
      const user = seedUser({ email: 'maria@parceiro.com' })
      seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com', user_id: user.id })

      setSession(user.clerk_id)
      await call(
        createBooking,
        jsonRequest(
          'POST',
          '/api/bookings',
          bookingBody({ affiliateCode: 'MARIA01', customerEmail: 'outro@email.com' }),
          freshIp(),
        ),
      )
      setSession(null)

      assertEqual(table('affiliateReferral').length, 0, 'afiliado logado comprando com o próprio código')
    })

    it('cadastro próprio não aceita status/comissão/código vindos do body', async () => {
      const user = seedUser({ email: 'novo@parceiro.com', first_name: 'Novo', last_name: 'Parceiro' })
      setSession(user.clerk_id)

      const res = await call(
        postMe,
        jsonRequest('POST', '/api/affiliates/me', {
          phone: '31988887777',
          status: 'active',
          commission_rate: 90,
          commissionRate: 90,
          code: 'ESCOLHIDO',
          total_earned: 99999999,
          approved_at: new Date().toISOString(),
          user_id: 'usr_outro',
        }),
      )
      setSession(null)

      assertStatus(res, 201)
      const criado = table('affiliate')[0]
      assertEqual(criado.status, 'pending', 'não pode nascer aprovado')
      assertEqual(criado.commission_rate, 7, 'não pode escolher a própria comissão')
      assert(criado.code !== 'ESCOLHIDO', 'não pode escolher o próprio código')
      assertEqual(criado.total_earned, 0, 'não pode nascer com saldo')
      assertEqual(criado.approved_at, null, 'não pode nascer com data de aprovação')
      assertEqual(criado.user_id, user.id, 'tem de ficar vinculado a quem pediu')
    })

    it('mesmo usuário não cria dois cadastros de afiliado', async () => {
      const user = seedUser({ email: 'novo@parceiro.com' })
      setSession(user.clerk_id)

      const a = await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
      const b = await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' }))
      setSession(null)

      assertStatus(a, 201)
      assertStatus(b, 409, 'segundo cadastro:')
      assertEqual(table('affiliate').length, 1)
    })

    it('admin não consegue gravar comissão fora de 0–100%', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01' })
      setSession(admin.clerk_id)

      for (const valor of [-5, 101, 9999]) {
        await call(patchAffiliate, jsonRequest('PATCH', '/api/affiliates', { id: aff.id, commissionRate: valor }))
      }
      setSession(null)

      const rate = table('affiliate')[0].commission_rate
      assert(rate >= 0 && rate <= 100, `comissão ficou em ${rate}% — fora da faixa permitida`)
    })

    it('comissão não aceita texto no lugar de número', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01' })
      setSession(admin.clerk_id)

      await call(
        patchAffiliate,
        jsonRequest('PATCH', '/api/affiliates', { id: aff.id, commissionRate: '50; DROP TABLE affiliates' }),
      )
      setSession(null)

      assertEqual(typeof table('affiliate')[0].commission_rate, 'number', 'commission_rate virou string')
      assertEqual(table('affiliate')[0].commission_rate, 7)
    })

    it('status inválido não entra no cadastro do afiliado', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01', status: 'pending' })
      setSession(admin.clerk_id)

      await call(patchAffiliate, jsonRequest('PATCH', '/api/affiliates', { id: aff.id, status: 'superadmin' }))
      setSession(null)

      const status = table('affiliate')[0].status
      assert(
        ['pending', 'active', 'rejected', 'suspended', 'blocked'].includes(status),
        `status gravado foi "${status}"`,
      )
    })

    it('código de indicação de outro afiliado não pode ser roubado', async () => {
      const admin = seedAdmin()
      const vitima = seedAffiliate({ code: 'VITIMA1', email: 'vitima@x.com' })
      const golpista = seedAffiliate({ code: 'GOLPE01', email: 'golpe@x.com' })
      setSession(admin.clerk_id)

      await call(patchAffiliate, jsonRequest('PATCH', '/api/affiliates', { id: golpista.id, code: 'VITIMA1' }))
      setSession(null)

      const codes = table('affiliate').map((a) => a.code).sort()
      assertEqual(codes, ['GOLPE01', 'VITIMA1'], 'os códigos não podiam ter mudado')
      assert(
        table('affiliate').find((a) => a.id === vitima.id)?.code === 'VITIMA1',
        'vítima perdeu o código',
      )
    })

    it('cadastro via painel não aceita campos privilegiados', async () => {
      const admin = seedAdmin()
      setSession(admin.clerk_id)

      const res = await call(
        adminCreateAffiliate,
        jsonRequest('POST', '/api/affiliates', {
          name: 'Fulano Teste',
          email: 'fulano@x.com',
          status: 'active',
          commission_rate: 80,
          total_earned: 500000,
        }),
      )
      setSession(null)

      assertStatus(res, 201)
      const criado = table('affiliate')[0]
      assertEqual(criado.status, 'pending')
      assertEqual(criado.commission_rate, 7)
      assertEqual(criado.total_earned, 0)
    })

    it('reserva cancelada não deve continuar valendo comissão aprovada', async () => {
      seedPackage()
      seedAffiliate({ code: 'MARIA01' })
      const admin = seedAdmin()

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      const bookingId = table('booking')[0].id

      const { PUT: putBooking } = await import('@/app/api/bookings/route')
      setSession(admin.clerk_id)
      await call(putBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' }))
      await call(putBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, status: 'canceled' }))
      setSession(null)

      const referral = table('affiliateReferral')[0]
      assert(
        referral.commission_status !== 'approved',
        'reserva cancelada deixou a comissão aprovada para pagamento',
      )
    })

    it('mil reservas falsas de uma vez não esgotam o pacote', async () => {
      seedPackage({ total_seats: 46 })
      seedAffiliate({ code: 'MARIA01' })

      let criadas = 0
      const mesmoIp = { 'cf-connecting-ip': '198.51.100.250' }
      for (let i = 0; i < 60; i++) {
        const res = await call(
          createBooking,
          jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), mesmoIp),
        )
        if (res.status === 201) criadas++
      }

      assert(
        criadas < 46,
        `o mesmo IP criou ${criadas} reservas seguidas — dá para travar o ônibus inteiro sem pagar nada`,
      )
    })
  })
}
