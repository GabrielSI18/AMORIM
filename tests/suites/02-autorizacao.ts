/**
 * Quem pode o quê. Toda rota de afiliado é testada como visitante anônimo,
 * como cliente comum e como outro afiliado.
 */

import { describe, it, assert, assertEqual, assertStatus, call, jsonRequest, getRequest } from '../harness'
import { table } from '../mocks/prisma'
import { setSession } from '../mocks/clerk'
import { seedAffiliate, seedUser, seedAdmin } from '../fixtures'

import {
  GET as listAffiliates,
  POST as createAffiliate,
  PATCH as patchAffiliate,
  DELETE as deleteAffiliate,
} from '@/app/api/affiliates/route'
import {
  GET as getAffiliateById,
  PATCH as patchAffiliateById,
  DELETE as deleteAffiliateById,
} from '@/app/api/affiliates/[id]/route'
import { GET as listReferrals, PUT as putReferral } from '@/app/api/affiliates/referrals/route'
import { GET as getMe, POST as postMe } from '@/app/api/affiliates/me/route'
import { GET as listBookings, PUT as putBooking } from '@/app/api/bookings/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

export function register() {
  describe('Autorização — rotas de afiliado', () => {
    it('visitante anônimo não lista afiliados', async () => {
      seedAffiliate({ code: 'MARIA01' })
      const res = await call(listAffiliates, getRequest('/api/affiliates'))
      assertStatus(res, 401, 'GET /api/affiliates anônimo:')
      assert(!JSON.stringify(res.body).includes('MARIA01'), 'vazou código de afiliado')
    })

    it('cliente comum logado não lista afiliados', async () => {
      const user = seedUser()
      seedAffiliate({ code: 'MARIA01' })
      setSession(user.clerk_id)
      const res = await call(listAffiliates, getRequest('/api/affiliates'))
      assertStatus(res, 403, 'GET /api/affiliates como USER:')
    })

    it('usuário com role AFFILIATE não vira admin', async () => {
      const user = seedUser({ role: 'AFFILIATE' })
      seedAffiliate({ code: 'MARIA01' })
      setSession(user.clerk_id)

      for (const [nome, res] of [
        ['GET', await call(listAffiliates, getRequest('/api/affiliates'))],
        ['POST', await call(createAffiliate, jsonRequest('POST', '/api/affiliates', { name: 'X Y', email: 'x@y.com' }))],
        ['PATCH', await call(patchAffiliate, jsonRequest('PATCH', '/api/affiliates', { id: 'qualquer', status: 'active' }))],
        ['DELETE', await call(deleteAffiliate, getRequest('/api/affiliates?id=qualquer'))],
      ] as [string, { status: number }][]) {
        assertStatus(res, 403, `${nome} /api/affiliates como AFFILIATE:`)
      }
    })

    it('anônimo não aprova, não edita e não apaga afiliado', async () => {
      const aff = seedAffiliate({ code: 'MARIA01', status: 'pending' })

      assertStatus(
        await call(patchAffiliate, jsonRequest('PATCH', '/api/affiliates', { id: aff.id, status: 'active' })),
        401,
        'PATCH coletivo:',
      )
      assertStatus(
        await call(patchAffiliateById, jsonRequest('PATCH', `/api/affiliates/${aff.id}`, { status: 'active' }), ctx(aff.id)),
        401,
        'PATCH por id:',
      )
      assertStatus(await call(deleteAffiliate, getRequest(`/api/affiliates?id=${aff.id}`)), 401, 'DELETE coletivo:')
      assertStatus(await call(deleteAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id)), 401, 'DELETE por id:')

      assertEqual(table('affiliate')[0].status, 'pending', 'status não pode ter mudado')
      assertEqual(table('affiliate').length, 1, 'afiliado não pode ter sido apagado')
    })

    it('cliente comum não lê a ficha de um afiliado', async () => {
      const aff = seedAffiliate({ code: 'MARIA01', cpf: '12345678901', pix_key: 'chave-pix-secreta' })
      const user = seedUser()
      setSession(user.clerk_id)

      const res = await call(getAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id))
      assertStatus(res, 403)
      assert(!JSON.stringify(res.body).includes('chave-pix-secreta'), 'vazou chave PIX')
      assert(!JSON.stringify(res.body).includes('12345678901'), 'vazou CPF')
    })

    it('cliente comum não vê nem muda indicações de ninguém', async () => {
      const user = seedUser()
      setSession(user.clerk_id)

      assertStatus(await call(listReferrals, getRequest('/api/affiliates/referrals')), 403, 'GET referrals:')
      assertStatus(
        await call(putReferral, jsonRequest('PUT', '/api/affiliates/referrals', { referralId: 'x', status: 'paid' })),
        403,
        'PUT referrals:',
      )
    })

    it('afiliado não consegue aprovar a própria comissão', async () => {
      const user = seedUser({ role: 'AFFILIATE', email: 'maria@parceiro.com' })
      const aff = seedAffiliate({ code: 'MARIA01', email: 'maria@parceiro.com', user_id: user.id })
      const { seed } = await import('../mocks/prisma')
      seed('affiliateReferral', [
        {
          id: 'ref_alvo',
          affiliate_id: aff.id,
          package_title: 'Caldas',
          customer_email: 'c@c.com',
          sale_amount: 149000,
          commission_amount: 10430,
          commission_status: 'pending',
        },
      ])

      setSession(user.clerk_id)
      const res = await call(
        putReferral,
        jsonRequest('PUT', '/api/affiliates/referrals', { referralId: 'ref_alvo', status: 'paid' }),
      )
      assertStatus(res, 403)
      assertEqual(table('affiliateReferral')[0].commission_status, 'pending', 'comissão não pode ter sido paga')
    })

    it('anônimo não acessa /api/affiliates/me', async () => {
      assertStatus(await call(getMe, getRequest('/api/affiliates/me')), 401)
      assertStatus(await call(postMe, jsonRequest('POST', '/api/affiliates/me', { phone: '31988887777' })), 401)
    })

    it('/me devolve só o afiliado do próprio usuário', async () => {
      const userA = seedUser({ email: 'a@a.com' })
      const userB = seedUser({ email: 'b@b.com' })
      seedAffiliate({ code: 'AFFA01', email: 'a@a.com', user_id: userA.id })
      seedAffiliate({ code: 'AFFB01', email: 'b@b.com', user_id: userB.id, pix_key: 'pix-do-b' })

      setSession(userA.clerk_id)
      const res = await call(getMe, getRequest('/api/affiliates/me'))
      assertStatus(res, 200)
      assertEqual(res.body.data.code, 'AFFA01')
      assert(!JSON.stringify(res.body).includes('pix-do-b'), 'vazou dado do outro afiliado')
    })

    it('listagem completa de reservas é só do admin', async () => {
      const user = seedUser()
      setSession(user.clerk_id)
      assertStatus(await call(listBookings, getRequest('/api/bookings')), 403)
      setSession(null)
      assertStatus(await call(listBookings, getRequest('/api/bookings')), 401)
    })

    it('cliente comum não marca reserva como paga (aprovaria comissão)', async () => {
      const user = seedUser()
      setSession(user.clerk_id)
      const res = await call(putBooking, jsonRequest('PUT', '/api/bookings', { id: 'x', paymentStatus: 'paid' }))
      assertStatus(res, 403)
    })

    it('admin de verdade passa em tudo', async () => {
      const admin = seedAdmin()
      const aff = seedAffiliate({ code: 'MARIA01', status: 'pending' })
      setSession(admin.clerk_id)

      assertStatus(await call(listAffiliates, getRequest('/api/affiliates')), 200, 'listar:')
      assertStatus(await call(getAffiliateById, getRequest(`/api/affiliates/${aff.id}`), ctx(aff.id)), 200, 'ficha:')
      assertStatus(
        await call(patchAffiliateById, jsonRequest('PATCH', `/api/affiliates/${aff.id}`, { status: 'active' }), ctx(aff.id)),
        200,
        'aprovar:',
      )
      assertEqual(table('affiliate')[0].status, 'active')
    })

    it('sessão de usuário que não existe no banco não vira admin', async () => {
      setSession('user_fantasma')
      assertStatus(await call(listAffiliates, getRequest('/api/affiliates')), 403)
      assertStatus(await call(listReferrals, getRequest('/api/affiliates/referrals')), 403)
    })
  })
}
