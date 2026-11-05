/**
 * A conta do dinheiro: totais, faixas e o ciclo pendente → aprovada → paga.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest, getRequest } from '../harness'
import { table, seed } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedPackage, seedAffiliate, seedUser, seedAdmin, bookingBody, PRICE } from '../fixtures'
import { computeAffiliateTotals } from '@/lib/affiliate-totals'
import { tierForSales, nextTier, buildTierSuggestion, AFFILIATE_TIERS } from '@/lib/affiliate-tiers'

import { GET as getMe } from '@/app/api/affiliates/me/route'
import { PUT as putReferral, GET as listReferrals } from '@/app/api/affiliates/referrals/route'
import { POST as createBooking, PUT as putBooking } from '@/app/api/bookings/route'

let ip = 5000
const freshIp = () => ({ 'cf-connecting-ip': `203.0.200.${ip++ % 255}` })

const ref = (over: Record<string, any> = {}) => ({
  affiliate_id: 'aff_x',
  package_title: 'Caldas',
  customer_email: 'c@c.com',
  sale_amount: 149000,
  commission_amount: 10430,
  commission_status: 'pending',
  ...over,
})

export function register() {
  describe('Contas e totais', () => {
    it('comissão de 7% sobre R$ 1.490 dá R$ 104,30', () => {
      assertEqual(Math.floor(149000 * 0.07), 10430)
    })

    it('totais somam cada status no lugar certo', () => {
      const t = computeAffiliateTotals([
        { sale_amount: 100000, commission_amount: 7000, commission_status: 'pending' },
        { sale_amount: 200000, commission_amount: 14000, commission_status: 'approved' },
        { sale_amount: 300000, commission_amount: 21000, commission_status: 'paid' },
      ])
      assertEqual(t.totalReferrals, 3)
      assertEqual(t.totalSales, 600000)
      assertEqual(t.pendingCommission, 7000)
      assertEqual(t.approvedCommission, 14000)
      assertEqual(t.paidCommission, 21000)
      assertEqual(t.receivableCommission, 21000)
      assertEqual(t.totalCommission, 42000)
    })

    it('indicação rejeitada não entra em nenhum total', () => {
      const t = computeAffiliateTotals([
        { sale_amount: 100000, commission_amount: 7000, commission_status: 'rejected' },
        { sale_amount: 100000, commission_amount: 7000, commission_status: 'paid' },
      ])
      assertEqual(t.totalReferrals, 1)
      assertEqual(t.totalSales, 100000)
      assertEqual(t.totalCommission, 7000)
    })

    it('status em maiúsculas (dado antigo) conta igual', () => {
      const t = computeAffiliateTotals([
        { sale_amount: 100000, commission_amount: 7000, commission_status: 'PAID' },
        { sale_amount: 100000, commission_amount: 7000, commission_status: 'Pending' },
      ])
      assertEqual(t.paidCommission, 7000)
      assertEqual(t.pendingCommission, 7000)
    })

    it('status desconhecido não some do total nem é contado como pago', () => {
      const t = computeAffiliateTotals([
        { sale_amount: 100000, commission_amount: 7000, commission_status: 'estranho' },
      ])
      assertEqual(t.paidCommission, 0)
      assertEqual(t.totalReferrals, 1)
    })

    it('lista vazia não quebra a conta', () => {
      const t = computeAffiliateTotals([])
      assertEqual(t.totalCommission, 0)
      assertEqual(t.totalSales, 0)
    })

    it('valores nulos não viram NaN', () => {
      const t = computeAffiliateTotals([
        { sale_amount: null as any, commission_amount: null as any, commission_status: 'pending' },
      ])
      assert(!Number.isNaN(t.totalSales), 'totalSales virou NaN')
      assert(!Number.isNaN(t.pendingCommission), 'pendingCommission virou NaN')
    })

    it('faixas sobem na ordem certa e nunca passam de 10%', () => {
      assertEqual(tierForSales(0).rate, 7)
      assertEqual(tierForSales(5).rate, 7)
      assertEqual(tierForSales(6).rate, 8)
      assertEqual(tierForSales(16).rate, 9)
      assertEqual(tierForSales(31).rate, 10)
      assertEqual(tierForSales(100000).rate, 10)
      assertEqual(nextTier(100000), null)
      assert(
        AFFILIATE_TIERS.every((t, i, arr) => i === 0 || t.rate > arr[i - 1].rate),
        'as faixas precisam ser crescentes',
      )
    })

    it('sugestão de faixa só conta venda confirmada', () => {
      const s = buildTierSuggestion(
        [
          { commission_status: 'pending' },
          { commission_status: 'pending' },
          { commission_status: 'approved' },
          { commission_status: 'paid' },
          { commission_status: 'rejected' },
        ],
        7,
      )
      assertEqual(s.qualifyingSales, 2)
      assertEqual(s.currentTier.rate, 7)
      assertEqual(s.salesToNextTier, 4)
      assertEqual(s.needsUpgrade, false)
    })

    it('sugestão avisa quando a comissão cadastrada ficou para trás', () => {
      const vendas = Array.from({ length: 20 }, () => ({ commission_status: 'paid' }))
      const s = buildTierSuggestion(vendas, 7)
      assertEqual(s.currentTier.name, 'Prata')
      assertEqual(s.needsUpgrade, true)
    })

    it('painel do parceiro mostra pendente, a receber e pago separados', async () => {
      const user = seedUser({ email: 'maria@parceiro.com' })
      const aff = seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com', user_id: user.id })
      seed('affiliateReferral', [
        ref({ affiliate_id: aff.id, commission_status: 'pending', commission_amount: 10430 }),
        ref({ affiliate_id: aff.id, commission_status: 'approved', commission_amount: 10430 }),
        ref({ affiliate_id: aff.id, commission_status: 'paid', commission_amount: 10430 }),
      ])

      setSession(user.clerk_id)
      const res = await call(getMe, getRequest('/api/affiliates/me'))
      setSession(null)

      assertStatus(res, 200)
      const s = res.body.data.stats
      assertEqual(s.pendingCommission, 10430)
      assertEqual(s.approvedCommission, 10430)
      assertEqual(s.paidCommission, 10430)
      assertEqual(s.receivableCommission, 20860)
      assertEqual(s.totalCommission, 31290)
    })

    it('pagar, voltar para aprovada e pagar de novo não dobra o total pago', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01' })
      // aprovada e sem viagem vinculada: fica retida, então paga com liberação
      // antecipada confirmada (o que interessa aqui é não somar duas vezes)
      seed('affiliateReferral', [ref({ id: 'ref_1', affiliate_id: aff.id, commission_status: 'approved' })])
      const pagar = { referralId: 'ref_1', status: 'paid', forceRelease: true }

      setSession(admin.clerk_id)
      await call(putReferral, jsonRequest('PUT', '/api/affiliates/referrals', pagar))
      await call(putReferral, jsonRequest('PUT', '/api/affiliates/referrals', { referralId: 'ref_1', status: 'approved' }))
      await call(putReferral, jsonRequest('PUT', '/api/affiliates/referrals', pagar))
      setSession(null)

      assertEqual(table('affiliate')[0].total_earned, 10430, 'total pago dobrou ao reprocessar')
      assertEqual(table('affiliate')[0].total_bookings, 1)
    })

    it('status de comissão fora da lista é recusado', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01' })
      seed('affiliateReferral', [ref({ id: 'ref_1', affiliate_id: aff.id })])

      setSession(admin.clerk_id)
      const res = await call(
        putReferral,
        jsonRequest('PUT', '/api/affiliates/referrals', { referralId: 'ref_1', status: 'pago_dobrado' }),
      )
      setSession(null)

      assertStatus(res, 400)
      assertEqual(table('affiliateReferral')[0].commission_status, 'pending')
    })

    it('comissão nunca fica negativa nem fracionada', async () => {
      seedPackage({ price: 1, price_child_6_10: 0, price_child_11_13: 0 })
      seedAffiliate({ code: 'MARIA01', commission_rate: 7 })

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )

      const valor = table('affiliateReferral')[0].commission_amount
      assert(valor >= 0, `comissão negativa: ${valor}`)
      assert(Number.isInteger(valor), `comissão fracionada: ${valor}`)
    })

    it('valores saem em centavos para o painel (sem dividir duas vezes)', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01' })
      seed('affiliateReferral', [ref({ affiliate_id: aff.id, commission_amount: 10430, sale_amount: 149000 })])

      setSession(admin.clerk_id)
      const res = await call(listReferrals, getRequest('/api/affiliates/referrals'))
      setSession(null)

      assertEqual(res.body.referrals[0].commission_amount, 10430)
      assertEqual(res.body.referrals[0].booking.total_price, 149000)
    })

    it('ciclo completo: venda → paga → viagem sai → comissão paga', async () => {
      // a comissão só é paga depois da viagem (ver suíte 11): o ônibus saiu ontem
      const hoje = new Date()
      const dia = (n: number) => new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + n, 12))
      seedPackage({ departure_date: dia(-1), return_date: dia(3) })
      const aff = seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com' })
      const admin = seedAdmin()

      await call(
        createBooking,
        jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' }), freshIp()),
      )
      const bookingId = table('booking')[0].id
      assertEqual(table('affiliateReferral')[0].commission_status, 'pending')

      setSession(admin.clerk_id)
      await call(putBooking, jsonRequest('PUT', '/api/bookings', { id: bookingId, paymentStatus: 'paid' }))
      assertEqual(table('affiliateReferral')[0].commission_status, 'approved')

      const referralId = table('affiliateReferral')[0].id
      await call(putReferral, jsonRequest('PUT', '/api/affiliates/referrals', { referralId, status: 'paid' }))
      setSession(null)

      assertEqual(table('affiliateReferral')[0].commission_status, 'paid')
      assert(table('affiliateReferral')[0].commission_paid_at instanceof Date, 'faltou data do pagamento')
      assertEqual(table('affiliate')[0].total_earned, Math.floor(PRICE * 0.07))
      assertEqual(table('affiliate')[0].total_sales, PRICE)
    })
  })
}
