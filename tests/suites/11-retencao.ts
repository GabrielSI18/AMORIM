/**
 * Comissão retida até a viagem acontecer.
 *
 * O cliente paga meses antes de viajar; se desistir, normalmente recebe o
 * dinheiro de volta. Comissão paga antes disso é prejuízo — e abre o golpe de
 * "vender" para conhecidos que cancelam depois.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest, getRequest } from '../harness'
import { table, seed } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, seedAdmin, bookingBody, PRICE } from '../fixtures'
import {
  commissionReleaseDate,
  payoutState,
  computeRetentionTotals,
  formatReleaseDate,
  RELEASE_DAYS_AFTER_DEPARTURE,
} from '@/lib/affiliate-retention'
import { affiliateNewSaleMessage } from '@/lib/whatsapp'

import { POST as createBooking, PUT as putBooking } from '@/app/api/bookings/route'
import { PUT as putReferral, GET as listReferrals } from '@/app/api/affiliates/referrals/route'
import { GET as getMe } from '@/app/api/affiliates/me/route'
import { GET as getAffiliateById } from '@/app/api/affiliates/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const DAY = 24 * 60 * 60 * 1000

/** Data "de pacote": dia ao meio-dia UTC, deslocado N dias de hoje */
function diaDePacote(offsetDias: number): Date {
  const hoje = new Date()
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + offsetDias, 12))
}

let ip = 7000
const freshIp = () => ({ 'cf-connecting-ip': `100.64.${Math.floor(ip / 255) % 255}.${ip++ % 255}` })

/**
 * Cenário completo pelas rotas de verdade: pacote saindo em `saidaEmDias`,
 * venda pelo código, admin confirma o pagamento do cliente.
 */
async function vendaPaga(saidaEmDias: number) {
  seedPackage({
    departure_date: diaDePacote(saidaEmDias),
    return_date: diaDePacote(saidaEmDias + 4),
  })
  const user = seedUser({ email: 'maria@parceiro.com' })
  const aff = seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com', user_id: user.id })
  const admin = seedAdmin()

  const venda = await call(
    createBooking,
    jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
  )
  assertStatus(venda, 201, 'criar a reserva:')
  const bookingId = table('booking')[0].id

  setSession(admin.clerk_id)
  await call(putBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' }))
  setSession(null)

  const referral = table('affiliateReferral')[0]
  assertEqual(referral.commission_status, 'approved', 'cliente pagou: comissão deveria estar aprovada')
  return { aff, admin, user, bookingId, referralId: referral.id }
}

async function pagar(adminClerkId: string, referralId: string, extra: Record<string, unknown> = {}) {
  setSession(adminClerkId)
  const res = await call(
    putReferral,
    jsonRequest('PUT', '/api/affiliates/referrals', { referralId, status: 'paid', ...extra }),
  )
  setSession(null)
  return res
}

export function register() {
  describe('Retenção da comissão até a viagem', () => {
    // ── regra pura ──

    it(`comissão libera ${RELEASE_DAYS_AFTER_DEPARTURE} dia depois da saída`, () => {
      const libera = commissionReleaseDate(new Date('2027-03-17T12:00:00Z'))
      assertEqual(libera?.toISOString(), '2027-03-18T00:00:00.000Z')
      assertEqual(formatReleaseDate(libera), '18/03/2027')
    })

    it('pacote sem data de saída não tem data de liberação', () => {
      assertEqual(commissionReleaseDate(null), null)
      assertEqual(commissionReleaseDate(undefined), null)
      assertEqual(commissionReleaseDate('não é data'), null)
    })

    it('situação do pagamento segue o ciclo da comissão', () => {
      const libera = new Date('2027-03-18T00:00:00Z')
      const antes = new Date('2027-03-10T15:00:00Z')
      const depois = new Date('2027-03-19T15:00:00Z')

      assertEqual(payoutState('pending', libera, depois), 'awaiting_payment', 'cliente não pagou')
      assertEqual(payoutState('approved', libera, antes), 'retained', 'pagou, viagem não saiu')
      assertEqual(payoutState('approved', libera, depois), 'releasable', 'viagem já saiu')
      assertEqual(payoutState('paid', libera, antes), 'paid')
      assertEqual(payoutState('rejected', libera, depois), 'rejected')
      assertEqual(payoutState('APPROVED', libera, depois), 'releasable', 'status em maiúsculas (dado antigo)')
    })

    it('sem data de viagem a comissão fica retida (liberar é decisão da equipe)', () => {
      assertEqual(payoutState('approved', null, new Date('2099-01-01')), 'retained')
    })

    it('a virada é à meia-noite de Brasília, não de Greenwich', () => {
      const libera = commissionReleaseDate(new Date('2027-03-17T12:00:00Z'))
      // 23h de 17/03 em Brasília = 02h de 18/03 em UTC: ainda é dia 17 para o grupo
      assertEqual(payoutState('approved', libera, new Date('2027-03-18T02:00:00Z')), 'retained')
      // 00h30 de 18/03 em Brasília
      assertEqual(payoutState('approved', libera, new Date('2027-03-18T03:30:00Z')), 'releasable')
    })

    it('totais separam retido de liberado', () => {
      const t = computeRetentionTotals([
        { commission_amount: 10430, payout_state: 'retained' },
        { commission_amount: 10430, payout_state: 'retained' },
        { commission_amount: 7000, payout_state: 'releasable' },
        { commission_amount: 5000, payout_state: 'paid' },
        { commission_amount: 9000, payout_state: 'awaiting_payment' },
      ])
      assertEqual(t.retainedCommission, 20860)
      assertEqual(t.retainedCount, 2)
      assertEqual(t.releasableCommission, 7000)
      assertEqual(t.releasableCount, 1)
    })

    // ── trava na API ──

    it('admin NÃO consegue pagar comissão de viagem que ainda não aconteceu', async () => {
      const { admin, referralId } = await vendaPaga(120) // viagem daqui a 4 meses

      const res = await pagar(admin.clerk_id, referralId)

      assertStatus(res, 409, 'pagar comissão retida:')
      assertEqual(res.body.code, 'retained')
      assert(/retida/i.test(res.body.error), `mensagem deveria explicar a retenção: ${res.body.error}`)
      assertEqual(table('affiliateReferral')[0].commission_status, 'approved', 'a comissão não pode ter virado paga')
      assertEqual(table('affiliate')[0].total_earned, 0, 'nada pode ter entrado como pago')
    })

    it('recusa informa quando a viagem sai e quando a comissão libera', async () => {
      const { admin, referralId } = await vendaPaga(120)
      const res = await pagar(admin.clerk_id, referralId)

      const sai = formatReleaseDate(diaDePacote(120))
      const libera = formatReleaseDate(commissionReleaseDate(diaDePacote(120)))
      assert(res.body.error.includes(sai!), `faltou a data de saída (${sai}) em: ${res.body.error}`)
      assert(res.body.error.includes(libera!), `faltou a data de liberação (${libera}) em: ${res.body.error}`)
    })

    it('depois que a viagem saiu, o pagamento passa', async () => {
      const { admin, referralId } = await vendaPaga(-1) // saiu ontem

      const res = await pagar(admin.clerk_id, referralId)

      assertStatus(res, 200)
      assertEqual(table('affiliateReferral')[0].commission_status, 'paid')
      assertEqual(table('affiliate')[0].total_earned, Math.floor(PRICE * 0.07))
    })

    it('no próprio dia da saída a comissão ainda está retida', async () => {
      const { admin, referralId } = await vendaPaga(0)
      const res = await pagar(admin.clerk_id, referralId)
      assertStatus(res, 409, 'dia da saída:')
    })

    it('equipe pode liberar antes da viagem, mas só confirmando de propósito', async () => {
      const { admin, referralId } = await vendaPaga(120)

      const semConfirmar = await pagar(admin.clerk_id, referralId, { forceRelease: 'sim' })
      assertStatus(semConfirmar, 409, 'forceRelease precisa ser true literal:')

      const confirmado = await pagar(admin.clerk_id, referralId, { forceRelease: true })
      assertStatus(confirmado, 200, 'liberação antecipada confirmada:')
      assertEqual(table('affiliateReferral')[0].commission_status, 'paid')
    })

    it('comissão de cliente que não pagou não sai nem com liberação forçada', async () => {
      // viagem já saiu, mas o cliente nunca pagou a reserva
      seedPackage({ departure_date: diaDePacote(-5), return_date: diaDePacote(30) })
      seedAffiliate({ code: 'MARIA01' })
      const admin = seedAdmin()

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      const referralId = table('affiliateReferral')[0].id
      assertEqual(table('affiliateReferral')[0].commission_status, 'pending')

      const res = await pagar(admin.clerk_id, referralId, { forceRelease: true })
      assertStatus(res, 409, 'pagar comissão de reserva não paga:')
      assertEqual(res.body.code, 'awaiting_payment')
      assertEqual(table('affiliateReferral')[0].commission_status, 'pending')
    })

    it('reserva cancelada nunca paga comissão, nem forçando', async () => {
      const { admin, referralId, bookingId } = await vendaPaga(-1)
      // dado antigo: reserva cancelada sem a comissão ter sido revertida
      table('booking').find((b) => b.id === bookingId)!.status = 'canceled'

      const res = await pagar(admin.clerk_id, referralId, { forceRelease: true })
      assertStatus(res, 409)
      assertEqual(res.body.code, 'booking_canceled')
    })

    it('golpe da venda-fantasma: cliente paga, cancela antes da viagem e o afiliado não recebe nada', async () => {
      const { admin, referralId, bookingId } = await vendaPaga(120)

      // cliente desiste; a Amorim devolve o dinheiro e cancela a reserva
      setSession(admin.clerk_id)
      await call(putBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, status: 'canceled' }))
      setSession(null)

      assertEqual(table('affiliateReferral')[0].commission_status, 'rejected', 'comissão deveria cair junto')
      const res = await pagar(admin.clerk_id, referralId, { forceRelease: true })
      assert(res.status >= 400, `comissão de reserva cancelada foi paga (HTTP ${res.status})`)
      assertEqual(table('affiliate')[0].total_earned, 0)
    })

    // ── o que as telas recebem ──

    it('painel do parceiro mostra o retido separado do liberado, com a data', async () => {
      const { user } = await vendaPaga(120)

      setSession(user.clerk_id)
      const res = await call(getMe, getRequest('/api/affiliates/me'))
      setSession(null)

      assertStatus(res, 200)
      const stats = res.body.data.stats
      assertEqual(stats.retainedCommission, Math.floor(PRICE * 0.07))
      assertEqual(stats.releasableCommission, 0)
      assertEqual(stats.retainedReferrals, 1)

      const ref = res.body.data.referrals[0]
      assertEqual(ref.payoutState, 'retained')
      assert(ref.releaseDate, 'faltou a data de liberação na indicação')
      assert(ref.departureDate, 'faltou a data da viagem na indicação')
    })

    it('lista do admin traz a situação e filtra retidas e liberadas', async () => {
      const { admin } = await vendaPaga(120)

      setSession(admin.clerk_id)
      const todas = await call(listReferrals, getRequest('/api/affiliates/referrals'))
      const retidas = await call(listReferrals, getRequest('/api/affiliates/referrals?status=retained'))
      const liberadas = await call(listReferrals, getRequest('/api/affiliates/referrals?status=releasable'))
      setSession(null)

      assertEqual(todas.body.referrals[0].payout_state, 'retained')
      assert(todas.body.referrals[0].release_date, 'faltou release_date')
      assertEqual(retidas.body.referrals.length, 1)
      assertEqual(liberadas.body.referrals.length, 0)
    })

    it('ficha do afiliado traz retido e a pagar agora nos totais', async () => {
      const { admin, aff } = await vendaPaga(-1)
      // segunda venda, de uma viagem futura, direto no banco de mentira
      seed('affiliateReferral', [
        {
          affiliate_id: aff.id,
          booking_id: null,
          package_title: 'Outro pacote',
          customer_email: 'x@x.com',
          sale_amount: 100000,
          commission_amount: 7000,
          commission_status: 'approved',
        },
      ])

      setSession(admin.clerk_id)
      const res = await call(getAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id))
      setSession(null)

      assertEqual(res.body.affiliate.totals.releasableCommission, Math.floor(PRICE * 0.07))
      assertEqual(res.body.affiliate.totals.retainedCommission, 7000, 'sem reserva/data deveria ficar retida')
    })

    it('mensagem de venda no WhatsApp avisa a retenção e a data', () => {
      const msg = affiliateNewSaleMessage({
        affiliateName: 'Maria Souza',
        packageTitle: 'Caldas Novas',
        commissionAmount: 10430,
        releaseDate: '18/03/2027',
      })
      assert(msg.includes('retida'), 'faltou explicar que fica retida')
      assert(msg.includes('18/03/2027'), 'faltou a data de liberação')
      assert(/cancel/i.test(msg), 'faltou avisar que cancelamento derruba a comissão')
    })
  })
}
